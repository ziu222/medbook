import { useEffect, useState, type ReactNode } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Modal } from '../components/Common/Modal';
import {
  ApiError,
  cancelPatientAppointment,
  fetchDoctors,
  fetchMyAppointments,
  startPayment,
  submitDoctorReview,
  type AppointmentRead,
  type DoctorSummary,
} from '../lib/api';
import { redirectToLogin } from '../lib/auth';
import { avatarColorFor, initialsFor } from '../lib/avatar';
import { BOOKING_FEE_VND, formatVnd } from '../lib/pricing';

interface MyAppointmentsPageProps {
  authed: boolean;
  onNavigate: (key: NavKey) => void;
  onSelectDoctor: (id: number) => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ thanh toán', color: '#96631a', bg: '#fdf3e2' },
  confirmed: { label: 'Đã xác nhận', color: 'var(--brand-d)', bg: 'var(--tint)' },
  completed: { label: 'Đã khám', color: 'var(--muted)', bg: 'var(--tint2)' },
  cancelled: { label: 'Đã hủy', color: '#c0492f', bg: '#fdeceb' },
};

const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function countdownLabel(isoDate: string): string | null {
  const diff = daysUntil(isoDate);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Ngày mai';
  if (diff > 1) return `Còn ${diff} ngày nữa`;
  return null;
}

const clockIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.3l3.3 2" strokeLinecap="round" />
  </svg>
);

const noteIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round">
    <path d="M6 3h12v18l-6-3-6 3Z" />
    <path d="M9.5 8h5M9.5 12h5" />
  </svg>
);

const pinIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </svg>
);

const starIcon = (filled: boolean, size = 30) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'var(--gold)' : 'none'} stroke="var(--gold)" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M12 2.8l2.7 5.9 6.4.7-4.8 4.4 1.3 6.3L12 16.9l-5.6 3.2 1.3-6.3-4.8-4.4 6.4-.7Z" />
  </svg>
);

const refundIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

function CancelModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <Modal open={open} title="Hủy lịch hẹn" onClose={onClose}>
      <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '14px' }}>
        Cho biết lý do bạn muốn hủy — số tiền hoàn (nếu có) phụ thuộc thời điểm hủy so với giờ khám.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 700, fontSize: '13.5px' }}>Lý do hủy</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Vd: tôi có việc đột xuất..."
          style={{ padding: '11px 14px', borderRadius: '11px', border: '1px solid var(--line)', fontSize: '14px', resize: 'vertical', outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <span onClick={onClose} className="link-hover" style={{ padding: '11px 18px', borderRadius: '11px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', color: 'var(--ink2)' }}>
          Đóng
        </span>
        <span
          onClick={() => trimmed && onConfirm(trimmed)}
          className={trimmed ? 'btn-hover' : undefined}
          style={{
            padding: '11px 20px',
            borderRadius: '11px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: trimmed ? 'pointer' : 'not-allowed',
            background: trimmed ? '#c0492f' : 'var(--line)',
            color: trimmed ? '#fff' : 'var(--faint)',
          }}
        >
          Xác nhận hủy
        </span>
      </div>
    </Modal>
  );
}

function ReviewModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (score: number, comment: string) => void }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <Modal open={open} title="Đánh giá bác sĩ" onClose={onClose}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} onClick={() => setScore(n)} className="icon-hover-scale" style={{ cursor: 'pointer', lineHeight: 0 }}>
            {starIcon(n <= score)}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 700, fontSize: '13.5px' }}>Nhận xét (không bắt buộc)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Trải nghiệm khám bệnh của bạn thế nào?"
          style={{ padding: '11px 14px', borderRadius: '11px', border: '1px solid var(--line)', fontSize: '14px', resize: 'vertical', outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <span onClick={onClose} className="link-hover" style={{ padding: '11px 18px', borderRadius: '11px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', color: 'var(--ink2)' }}>
          Đóng
        </span>
        <span
          onClick={() => onConfirm(score, comment.trim())}
          className="btn-hover"
          style={{ padding: '11px 20px', borderRadius: '11px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', background: 'var(--brand-grad)', color: '#fff' }}
        >
          Gửi đánh giá
        </span>
      </div>
    </Modal>
  );
}

function PaymentSuccessModal({
  open,
  onClose,
  doctorName,
  appointment,
}: {
  open: boolean;
  onClose: () => void;
  doctorName: string;
  appointment: AppointmentRead;
}) {
  return (
    <Modal open={open} title="Thanh toán thành công" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '6px 0 18px' }}>
        <div
          className="check-pop"
          style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-grad)', display: 'grid', placeItems: 'center', marginBottom: '18px' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4.5 4.5L19 7" />
          </svg>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '4px' }}>Đã giữ chỗ lịch khám với</div>
        <div style={{ fontWeight: 800, fontSize: '17px', marginBottom: '10px' }}>{doctorName}</div>
        <div style={{ color: 'var(--ink2)', fontSize: '14.5px' }}>
          <b style={{ color: 'var(--ink)' }}>{appointment.start_time.slice(0, 5)}</b> · {DATE_FORMAT.format(new Date(appointment.appointment_date))}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '6px' }}>Phí đặt lịch {formatVnd(BOOKING_FEE_VND)}</div>
      </div>
      <span
        onClick={onClose}
        className="btn-hover"
        style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '12px', background: 'var(--brand-grad)', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
      >
        Đóng
      </span>
    </Modal>
  );
}

function AppointmentCard({
  appointment,
  doctor,
  delayMs,
  onSelectDoctor,
  onPaid,
  onCancelled,
  cancelNote,
  reviewedScore,
  onReviewed,
}: {
  appointment: AppointmentRead;
  doctor: DoctorSummary | undefined;
  delayMs: number;
  onSelectDoctor: (id: number) => void;
  onPaid: (appointmentId: number) => void;
  onCancelled: (appointmentId: number, note: string) => void;
  cancelNote: string | null;
  reviewedScore: number | null;
  onReviewed: (appointmentId: number, score: number) => void;
}) {
  const [paying, setPaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const status = STATUS_META[appointment.status] ?? { label: appointment.status, color: 'var(--muted)', bg: 'var(--tint2)' };
  const countdown = (appointment.status === 'pending' || appointment.status === 'confirmed') ? countdownLabel(appointment.appointment_date) : null;

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      await startPayment(appointment.id);
      onPaid(appointment.id);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Thanh toán thất bại, vui lòng thử lại.');
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async (reason: string) => {
    setShowCancelModal(false);
    setBusy(true);
    setError(null);
    try {
      const result = await cancelPatientAppointment(appointment.id, reason);
      onCancelled(
        appointment.id,
        result.refund_percentage > 0
          ? `Đã hủy — hoàn ${result.refund_percentage}% phí đặt lịch.`
          : 'Đã hủy lịch hẹn.',
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Hủy lịch thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleReview = async (score: number, comment: string) => {
    setShowReviewModal(false);
    setBusy(true);
    setError(null);
    try {
      await submitDoctorReview(appointment.id, score, comment);
      onReviewed(appointment.id, score);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gửi đánh giá thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="card-hover fade-up"
      style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '22px', animationDelay: `${delayMs}ms` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          onClick={() => onSelectDoctor(appointment.doctor_id)}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '15px',
            background: avatarColorFor(appointment.doctor_id),
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: '18px',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          {initialsFor(doctor?.display_name ?? '?')}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div onClick={() => onSelectDoctor(appointment.doctor_id)} style={{ fontWeight: 800, fontSize: '16.5px', cursor: 'pointer' }}>
              {doctor?.display_name ?? `Bác sĩ #${appointment.doctor_id}`}
            </div>
            <span style={{ color: 'var(--faint)', fontSize: '12px', fontFamily: 'monospace' }}>#{appointment.id}</span>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{doctor?.specialty.name ?? '—'}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span
            style={{
              padding: '7px 13px',
              borderRadius: '999px',
              background: status.bg,
              color: status.color,
              fontWeight: 700,
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            {status.label}
          </span>
          {countdown && <span style={{ color: 'var(--brand-d)', fontWeight: 700, fontSize: '12px' }}>{countdown}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '14px', color: 'var(--ink2)', margin: '16px 0 0', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {clockIcon}
          <b style={{ color: 'var(--ink)' }}>
            {appointment.start_time.slice(0, 5)}–{appointment.end_time.slice(0, 5)}
          </b>{' '}
          · {DATE_FORMAT.format(new Date(appointment.appointment_date))}
        </div>
        {doctor?.facility && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ marginTop: '2px', flexShrink: 0 }}>{pinIcon}</span>
            <span>
              {doctor.facility.name}
              {doctor.facility.address && <span style={{ color: 'var(--faint)' }}> · {doctor.facility.address}</span>}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ marginTop: '2px', flexShrink: 0 }}>{noteIcon}</span>
          {appointment.symptoms}
        </div>
      </div>

      {error && <div style={{ color: '#c0492f', fontSize: '13.5px', marginTop: '14px' }}>{error}</div>}
      {cancelNote && !error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '14px',
            padding: '10px 13px',
            borderRadius: '11px',
            background: 'var(--tint2)',
            color: 'var(--ink2)',
            fontSize: '13.5px',
          }}
        >
          <span style={{ color: 'var(--faint)', flexShrink: 0, display: 'flex' }}>{refundIcon}</span>
          {cancelNote}
        </div>
      )}

      {appointment.status === 'pending' && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <div
            onClick={paying || busy ? undefined : handlePay}
            className={paying || busy ? undefined : 'btn-hover'}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px',
              borderRadius: '12px',
              background: paying || busy ? 'var(--line)' : 'var(--brand-grad)',
              color: paying || busy ? 'var(--faint)' : '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: paying || busy ? 'not-allowed' : 'pointer',
            }}
          >
            {paying ? 'Đang xử lý...' : 'Thanh toán ngay'}
          </div>
          <div
            onClick={busy ? undefined : () => setShowCancelModal(true)}
            className={busy ? undefined : 'btn-hover'}
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid #f3d2ca',
              fontWeight: 700,
              fontSize: '14px',
              color: '#c0492f',
              cursor: busy ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Hủy lịch
          </div>
        </div>
      )}

      {appointment.status === 'confirmed' && (
        <div
          onClick={busy ? undefined : () => setShowCancelModal(true)}
          className={busy ? undefined : 'btn-hover'}
          style={{
            marginTop: '16px',
            textAlign: 'center',
            padding: '11px',
            borderRadius: '12px',
            border: '1px solid #f3d2ca',
            fontWeight: 700,
            fontSize: '14px',
            color: '#c0492f',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          Hủy lịch
        </div>
      )}

      {appointment.status === 'completed' && (
        <div style={{ marginTop: '16px' }}>
          {reviewedScore !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '1px' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} style={{ lineHeight: 0 }}>
                    {starIcon(n <= reviewedScore, 16)}
                  </span>
                ))}
              </div>
              <span style={{ color: 'var(--muted)', fontSize: '13.5px' }}>Cảm ơn bạn đã đánh giá</span>
            </div>
          ) : (
            <div
              onClick={busy ? undefined : () => setShowReviewModal(true)}
              className={busy ? undefined : 'btn-hover'}
              style={{
                textAlign: 'center',
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid var(--soft)',
                background: 'var(--tint2)',
                fontWeight: 700,
                fontSize: '14px',
                color: 'var(--brand-d)',
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              Đánh giá bác sĩ
            </div>
          )}
        </div>
      )}

      <CancelModal open={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={handleCancel} />
      <ReviewModal open={showReviewModal} onClose={() => setShowReviewModal(false)} onConfirm={handleReview} />
      <PaymentSuccessModal open={showSuccess} onClose={() => setShowSuccess(false)} doctorName={doctor?.display_name ?? `Bác sĩ #${appointment.doctor_id}`} appointment={appointment} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: '34px' }}>
      <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '16px' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>{children}</div>
    </div>
  );
}

export function MyAppointmentsPage({ authed, onNavigate, onSelectDoctor }: MyAppointmentsPageProps) {
  const [appointments, setAppointments] = useState<AppointmentRead[]>([]);
  const [doctorsById, setDoctorsById] = useState<Map<number, DoctorSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reviewedScores, setReviewedScores] = useState<Map<number, number>>(new Map());
  const [cancelNotes, setCancelNotes] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (!authed) {
      setLoading(false);
      return;
    }
    Promise.all([fetchMyAppointments(), fetchDoctors({ limit: 100 })])
      .then(([mine, doctors]) => {
        setAppointments(mine);
        setDoctorsById(new Map(doctors.map((d) => [d.id, d])));
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [authed]);

  // An appointment is "upcoming" while it is still actionable — cancelled/completed ones belong to history
  // regardless of date.
  const isUpcoming = (a: AppointmentRead) => a.status === 'pending' || a.status === 'confirmed';
  const byDate = (a: AppointmentRead, b: AppointmentRead) => `${a.appointment_date}${a.start_time}`.localeCompare(`${b.appointment_date}${b.start_time}`);

  const handlePaid = (appointmentId: number) => {
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: 'confirmed' } : a)));
  };

  const handleCancelled = (appointmentId: number, note: string) => {
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: 'cancelled' } : a)));
    setCancelNotes((prev) => new Map(prev).set(appointmentId, note));
  };

  const handleReviewed = (appointmentId: number, score: number) => {
    setReviewedScores((prev) => new Map(prev).set(appointmentId, score));
  };

  const upcoming = appointments.filter(isUpcoming).sort(byDate);
  const past = appointments.filter((a) => !isUpcoming(a)).sort((a, b) => byDate(b, a));

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header active="appointments" authed={authed} onNavigate={onNavigate} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ padding: '26px 0' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
            <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
              Trang chủ
            </span>{' '}
            / <b style={{ color: 'var(--ink)' }}>Lịch hẹn của tôi</b>
          </div>

          <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-.6px', margin: '0 0 26px' }}>Lịch hẹn của tôi</h1>

          {!authed ? (
            <div className="fade-up" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>Đăng nhập để xem lịch hẹn của bạn.</div>
              <span
                onClick={() => redirectToLogin()}
                className="btn-hover"
                style={{
                  display: 'inline-block',
                  padding: '13px 26px',
                  borderRadius: '12px',
                  background: 'var(--brand-grad)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Đăng nhập
              </span>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <LoadingSpinner label="Đang tải lịch hẹn..." />
            </div>
          ) : failed ? (
            <div className="fade-up" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              Không tải được lịch hẹn, vui lòng thử lại sau.
            </div>
          ) : appointments.length === 0 ? (
            <div className="fade-up" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>Bạn chưa có lịch hẹn nào.</div>
              <span
                onClick={() => onNavigate('find')}
                className="btn-hover"
                style={{
                  display: 'inline-block',
                  padding: '13px 26px',
                  borderRadius: '12px',
                  background: 'var(--brand-grad)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tìm bác sĩ
              </span>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <Section title={`Sắp tới · ${upcoming.length}`}>
                  {upcoming.map((a, i) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      doctor={doctorsById.get(a.doctor_id)}
                      delayMs={Math.min(i * 40, 320)}
                      onSelectDoctor={onSelectDoctor}
                      onPaid={handlePaid}
                      onCancelled={handleCancelled}
                      cancelNote={cancelNotes.get(a.id) ?? null}
                      reviewedScore={reviewedScores.get(a.id) ?? null}
                      onReviewed={handleReviewed}
                    />
                  ))}
                </Section>
              )}
              {past.length > 0 && (
                <Section title={`Lịch sử · ${past.length}`}>
                  {past.map((a, i) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      doctor={doctorsById.get(a.doctor_id)}
                      delayMs={Math.min(i * 40, 320)}
                      onSelectDoctor={onSelectDoctor}
                      onPaid={handlePaid}
                      onCancelled={handleCancelled}
                      cancelNote={cancelNotes.get(a.id) ?? null}
                      reviewedScore={reviewedScores.get(a.id) ?? null}
                      onReviewed={handleReviewed}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
