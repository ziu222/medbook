import { useEffect, useState, type ReactNode } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { fetchDoctors, fetchMyAppointments, startPayment, type AppointmentRead, type DoctorSummary } from '../lib/api';
import { redirectToLogin } from '../lib/auth';
import { avatarColorFor, initialsFor } from '../lib/avatar';

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

function AppointmentCard({
  appointment,
  doctor,
  delayMs,
  onSelectDoctor,
}: {
  appointment: AppointmentRead;
  doctor: DoctorSummary | undefined;
  delayMs: number;
  onSelectDoctor: (id: number) => void;
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = STATUS_META[appointment.status] ?? { label: appointment.status, color: 'var(--muted)', bg: 'var(--tint2)' };

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const payment = await startPayment(appointment.id);
      window.location.assign(payment.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được liên kết thanh toán.');
      setPaying(false);
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
          <div onClick={() => onSelectDoctor(appointment.doctor_id)} style={{ fontWeight: 800, fontSize: '16.5px', cursor: 'pointer' }}>
            {doctor?.display_name ?? `Bác sĩ #${appointment.doctor_id}`}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{doctor?.specialty.name ?? '—'}</div>
        </div>
        <span
          style={{
            marginLeft: 'auto',
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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '14px', color: 'var(--ink2)', margin: '16px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {clockIcon}
          <b style={{ color: 'var(--ink)' }}>{appointment.start_time.slice(0, 5)}</b> · {DATE_FORMAT.format(new Date(appointment.appointment_date))}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ marginTop: '2px', flexShrink: 0 }}>{noteIcon}</span>
          {appointment.symptoms}
        </div>
      </div>

      {error && <div style={{ color: '#c0492f', fontSize: '13.5px', marginTop: '14px' }}>{error}</div>}

      {appointment.status === 'pending' && (
        <div
          onClick={paying ? undefined : handlePay}
          className={paying ? undefined : 'btn-hover'}
          style={{
            textAlign: 'center',
            padding: '12px',
            borderRadius: '12px',
            marginTop: '16px',
            background: paying ? 'var(--line)' : 'var(--brand-grad)',
            color: paying ? 'var(--faint)' : '#fff',
            fontWeight: 700,
            fontSize: '15px',
            cursor: paying ? 'not-allowed' : 'pointer',
          }}
        >
          {paying ? 'Đang chuyển tới VNPAY...' : 'Thanh toán ngay'}
        </div>
      )}
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
