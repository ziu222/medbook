import { useEffect, useState } from 'react';
import { DoctorShell } from '../../components/Common/DoctorShell';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { Modal } from '../../components/Common/Modal';
import {
  ApiError,
  cancelDoctorAppointment,
  completeAppointment,
  fetchDoctorAppointments,
  type AppointmentRead,
} from '../../lib/api';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorAppointmentsPageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ thanh toán', color: '#96631a', bg: '#fdf3e2' },
  confirmed: { label: 'Đã xác nhận', color: 'var(--brand-d)', bg: 'var(--tint)' },
  completed: { label: 'Đã khám', color: 'var(--muted)', bg: 'var(--tint2)' },
  cancelled: { label: 'Đã hủy', color: '#c0492f', bg: '#fdeceb' },
};

const FILTERS: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ thanh toán' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'completed', label: 'Đã khám' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function CancelModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <Modal open={open} title="Hủy lịch hẹn" onClose={onClose}>
      <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '14px' }}>Cho bệnh nhân biết lý do bạn hủy lịch hẹn này.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 700, fontSize: '13.5px' }}>Lý do hủy</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Vd: bác sĩ có lịch cấp cứu đột xuất..."
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

function AppointmentRow({ appointment, onChanged }: { appointment: AppointmentRead; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const status = STATUS_META[appointment.status] ?? { label: appointment.status, color: 'var(--muted)', bg: 'var(--tint2)' };

  const handleCancel = async (reason: string) => {
    setShowCancelModal(false);
    setBusy(true);
    setError(null);
    try {
      await cancelDoctorAppointment(appointment.id, reason);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Hủy lịch thất bại.');
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setBusy(true);
    setError(null);
    try {
      await completeAppointment(appointment.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cập nhật thất bại.');
      setBusy(false);
    }
  };

  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
  const canComplete = appointment.status === 'confirmed';

  return (
    <>
    <tr style={{ borderTop: '1px solid var(--line)' }}>
      <td style={{ padding: '13px 10px', fontWeight: 700 }}>{appointment.patient_full_name}</td>
      <td style={{ padding: '13px 10px' }}>
        {DATE_FORMAT.format(new Date(appointment.appointment_date))} · {appointment.start_time.slice(0, 5)}
      </td>
      <td style={{ padding: '13px 10px', color: 'var(--ink2)', maxWidth: '260px' }}>{appointment.symptoms}</td>
      <td style={{ padding: '13px 10px' }}>
        <span style={{ padding: '5px 11px', borderRadius: '999px', background: status.bg, color: status.color, fontWeight: 700, fontSize: '12.5px' }}>
          {status.label}
        </span>
      </td>
      <td style={{ padding: '13px 10px' }}>
        {error && <div style={{ color: '#c0492f', fontSize: '12.5px', marginBottom: '4px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px' }}>
          {canComplete && (
            <span
              onClick={busy ? undefined : handleComplete}
              className={busy ? undefined : 'link-hover'}
              style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--brand-d)', cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              Hoàn tất khám
            </span>
          )}
          {canCancel && (
            <span
              onClick={busy ? undefined : () => setShowCancelModal(true)}
              className={busy ? undefined : 'link-hover'}
              style={{ fontWeight: 700, fontSize: '13.5px', color: '#c0492f', cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              Hủy
            </span>
          )}
        </div>
      </td>
    </tr>
    <CancelModal open={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={handleCancel} />
    </>
  );
}

export function DoctorAppointmentsPage({ authed, onNavigate }: DoctorAppointmentsPageProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [appointments, setAppointments] = useState<AppointmentRead[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!authed) return;
    setAppointments(null);
    fetchDoctorAppointments({ status: statusFilter || undefined, limit: 100 })
      .then(setAppointments)
      .catch(() => setFailed(true));
  }, [authed, statusFilter, reloadTick]);

  const sorted = [...(appointments ?? [])].sort((a, b) => `${b.appointment_date}${b.start_time}`.localeCompare(`${a.appointment_date}${a.start_time}`));

  return (
    <DoctorShell active="appointments" authed={authed} onNavigate={onNavigate}>
      {() => (
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>Cuộc hẹn</h1>
          <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '22px' }}>Quản lý toàn bộ lịch hẹn của bạn</div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <div
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  background: statusFilter === f.key ? 'var(--brand-grad)' : '#fff',
                  color: statusFilter === f.key ? '#fff' : 'var(--ink2)',
                  border: statusFilter === f.key ? 'none' : '1px solid var(--line)',
                }}
              >
                {f.label}
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '10px 22px' }}>
            {appointments === null ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
                <LoadingSpinner />
              </div>
            ) : failed ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>Không tải được danh sách lịch hẹn.</div>
            ) : sorted.length === 0 ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>Không có lịch hẹn nào.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14.5px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--faint)', fontSize: '12.5px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 10px', fontWeight: 700 }}>Bệnh nhân</th>
                    <th style={{ padding: '12px 10px', fontWeight: 700 }}>Ngày/giờ</th>
                    <th style={{ padding: '12px 10px', fontWeight: 700 }}>Lý do khám</th>
                    <th style={{ padding: '12px 10px', fontWeight: 700 }}>Trạng thái</th>
                    <th style={{ padding: '12px 10px', fontWeight: 700 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} onChanged={() => setReloadTick((t) => t + 1)} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </DoctorShell>
  );
}
