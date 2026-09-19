import { useEffect, useState, type CSSProperties } from 'react';
import { AdminTabs } from '../../components/Common/AdminTabs';
import { Modal } from '../../components/Common/Modal';
import {
  ApiError,
  addAdminBlockedSlot,
  deleteAdminBlockedSlot,
  fetchAdminBlockedSlots,
  fetchDoctors,
  type BlockedSlot,
  type DoctorSummary,
} from '../../lib/api';
import { getUserRole, redirectToLogin } from '../../lib/auth';
import { toIsoDate } from '../../lib/date';

const fieldStyle: CSSProperties = {
  padding: '11px 14px',
  borderRadius: '11px',
  border: '1px solid var(--line)',
  fontSize: '14.5px',
  outline: 'none',
  width: '100%',
};

const labelStyle: CSSProperties = { fontWeight: 700, fontSize: '13.5px', marginBottom: '6px', display: 'block' };
const RANGE_DAYS = 30;

function AddBlockModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (date: string, start: string, end: string, reason: string) => Promise<void> }) {
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('09:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onAdded(date, start, end, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Khóa giờ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Khóa khung giờ của bác sĩ" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        <label style={labelStyle}>Ngày</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle} />
      </div>
      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Bắt đầu</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={fieldStyle} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Kết thúc</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={fieldStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
        <label style={labelStyle}>Lý do (VD: bác sĩ vắng đột xuất)</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} style={fieldStyle} placeholder="Bác sĩ báo nghỉ đột xuất" />
      </div>
      {error && <div style={{ color: '#c0492f', fontSize: '13.5px', marginBottom: '14px' }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <span onClick={onClose} className="link-hover" style={{ padding: '11px 18px', borderRadius: '11px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', color: 'var(--ink2)' }}>
          Đóng
        </span>
        <span
          onClick={busy ? undefined : handleSubmit}
          className={busy ? undefined : 'btn-hover'}
          style={{ padding: '11px 20px', borderRadius: '11px', fontWeight: 700, fontSize: '14px', cursor: busy ? 'not-allowed' : 'pointer', background: 'var(--brand-grad)', color: '#fff' }}
        >
          {busy ? 'Đang khóa...' : 'Khóa giờ'}
        </span>
      </div>
    </Modal>
  );
}

function DoctorSlotsPanel({ doctorId }: { doctorId: number }) {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[] | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const dateFrom = toIsoDate(new Date());
  const dateTo = toIsoDate(new Date(Date.now() + RANGE_DAYS * 86_400_000));

  useEffect(() => {
    fetchAdminBlockedSlots(doctorId, dateFrom, dateTo)
      .then(setBlockedSlots)
      .catch(() => setBlockedSlots([]));
  }, [doctorId, dateFrom, dateTo, reloadTick]);

  const reload = () => setReloadTick((t) => t + 1);

  const handleUnblock = (id: number) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      deleteAdminBlockedSlot(doctorId, id)
        .then(reload)
        .catch(() => setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; }));
    }, 180);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '22px', maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontWeight: 800, fontSize: '16px' }}>Giờ bị khóa (30 ngày tới)</div>
        <span onClick={() => setShowAddBlock(true)} className="link-hover" style={{ color: 'var(--brand-d)', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>
          + Khóa giờ
        </span>
      </div>
      {blockedSlots === null ? (
        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Đang tải...</div>
      ) : blockedSlots.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Bác sĩ này không có giờ nào bị khóa.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {blockedSlots.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '11px',
                background: 'var(--tint2)',
                opacity: removingIds.has(b.id) ? 0 : 1,
                transform: removingIds.has(b.id) ? 'translateX(8px)' : undefined,
                transition: 'opacity 0.18s ease, transform 0.18s ease',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{b.block_date}</span>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>
                {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
              </span>
              {b.reason && <span style={{ color: 'var(--muted)', fontSize: '13px' }}>· {b.reason}</span>}
              <span
                onClick={() => handleUnblock(b.id)}
                className="link-hover"
                style={{ marginLeft: 'auto', color: '#c0492f', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Bỏ khóa
              </span>
            </div>
          ))}
        </div>
      )}

      <AddBlockModal
        open={showAddBlock}
        onClose={() => setShowAddBlock(false)}
        onAdded={async (date, start, end, reason) => {
          await addAdminBlockedSlot(doctorId, date, start, end, reason);
          reload();
        }}
      />
    </div>
  );
}

export function AdminDoctorSlotsPage({ authed }: { authed: boolean }) {
  const isAdmin = authed && getUserRole() === 'admin';
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [doctorId, setDoctorId] = useState<number | ''>('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchDoctors({ limit: 100 })
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="fade-up" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>
            {authed ? 'Chỉ quản trị viên mới có thể truy cập trang này.' : 'Đăng nhập bằng tài khoản quản trị để tiếp tục.'}
          </div>
          {!authed && (
            <span
              onClick={() => redirectToLogin()}
              className="btn-hover"
              style={{ display: 'inline-block', padding: '13px 26px', borderRadius: '12px', background: 'var(--brand-grad)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Đăng nhập
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px' }}>
      <AdminTabs active="/admin/khoa-lich-bac-si" />
      <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>Khóa lịch bác sĩ</h1>
      <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '22px' }}>
        Dùng khi bác sĩ báo vắng đột xuất — khóa khung giờ để bệnh nhân không thể đặt lịch vào đó.
      </div>

      <div style={{ marginBottom: '22px', maxWidth: '360px' }}>
        <label style={labelStyle}>Chọn bác sĩ</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : '')} style={fieldStyle}>
          <option value="">— Chọn bác sĩ —</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.display_name} · {d.specialty.name}
            </option>
          ))}
        </select>
      </div>

      {doctorId !== '' && <DoctorSlotsPanel key={doctorId} doctorId={doctorId} />}
    </main>
  );
}
