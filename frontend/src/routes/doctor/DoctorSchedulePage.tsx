import { useEffect, useState } from 'react';
import { DoctorShell } from '../../components/Common/DoctorShell';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { Modal } from '../../components/Common/Modal';
import {
  ApiError,
  addBlockedSlot,
  addWorkingInterval,
  closeWorkingDay,
  deleteBlockedSlot,
  fetchBlockedSlots,
  fetchWorkingDays,
  type BlockedSlot,
  type WorkingDay,
} from '../../lib/api';
import { toIsoDate } from '../../lib/date';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorSchedulePageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });
const RANGE_DAYS = 14;

function upcomingDates(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function AddIntervalModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (start: string, end: string) => Promise<void> }) {
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('17:00');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onAdded(start, end);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Thêm khung giờ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Thêm khung giờ làm việc" onClose={onClose}>
      <div style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '13.5px' }}>Bắt đầu</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '14px' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '13.5px' }}>Kết thúc</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '14px' }} />
        </div>
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
          {busy ? 'Đang thêm...' : 'Thêm'}
        </span>
      </div>
    </Modal>
  );
}

function AddBlockModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (start: string, end: string, reason: string) => Promise<void> }) {
  const [start, setStart] = useState('12:00');
  const [end, setEnd] = useState('13:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onAdded(start, end, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chặn giờ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Chặn khung giờ" onClose={onClose}>
      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '13.5px' }}>Bắt đầu</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '14px' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '13.5px' }}>Kết thúc</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '14px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
        <label style={{ fontWeight: 700, fontSize: '13.5px' }}>Lý do (không bắt buộc)</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Vd: nghỉ trưa, hội chẩn..."
          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '14px' }}
        />
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
          {busy ? 'Đang chặn...' : 'Chặn giờ'}
        </span>
      </div>
    </Modal>
  );
}

function CloseDayModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đóng ngày thất bại.');
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Đóng cả ngày làm việc" onClose={onClose}>
      <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '18px' }}>Toàn bộ khung giờ làm việc trong ngày này sẽ bị xóa. Bệnh nhân sẽ không thể đặt lịch vào ngày này nữa.</div>
      {error && <div style={{ color: '#c0492f', fontSize: '13.5px', marginBottom: '14px' }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <span onClick={onClose} className="link-hover" style={{ padding: '11px 18px', borderRadius: '11px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', color: 'var(--ink2)' }}>
          Đóng
        </span>
        <span
          onClick={busy ? undefined : handleConfirm}
          className={busy ? undefined : 'btn-hover'}
          style={{ padding: '11px 20px', borderRadius: '11px', fontWeight: 700, fontSize: '14px', cursor: busy ? 'not-allowed' : 'pointer', background: '#c0492f', color: '#fff' }}
        >
          {busy ? 'Đang xử lý...' : 'Xác nhận đóng ngày'}
        </span>
      </div>
    </Modal>
  );
}

export function DoctorSchedulePage({ authed, onNavigate }: DoctorSchedulePageProps) {
  const [dates] = useState(() => upcomingDates(RANGE_DAYS));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [workingDays, setWorkingDays] = useState<WorkingDay[] | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[] | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [showAddInterval, setShowAddInterval] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showCloseDay, setShowCloseDay] = useState(false);

  const dateFrom = toIsoDate(dates[0]);
  const dateTo = toIsoDate(dates[dates.length - 1]);
  const selectedIso = toIsoDate(selectedDate);

  useEffect(() => {
    if (!authed) return;
    Promise.all([fetchWorkingDays(dateFrom, dateTo), fetchBlockedSlots(dateFrom, dateTo)])
      .then(([days, blocks]) => {
        setWorkingDays(days);
        setBlockedSlots(blocks);
      })
      .catch(() => {
        setWorkingDays([]);
        setBlockedSlots([]);
      });
  }, [authed, dateFrom, dateTo, reloadTick]);

  const reload = () => setReloadTick((t) => t + 1);
  const loading = workingDays === null || blockedSlots === null;
  const dayIntervals = (workingDays ?? []).filter((w) => w.work_date === selectedIso).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const dayBlocks = (blockedSlots ?? []).filter((b) => b.block_date === selectedIso).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <DoctorShell active="schedule" authed={authed} onNavigate={onNavigate}>
      {() => (
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>Lịch làm việc</h1>
          <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '22px' }}>Quản lý khung giờ làm việc và giờ bị chặn</div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, 1fr)`, gap: '8px', marginBottom: '26px' }}>
            {dates.map((d) => {
              const iso = toIsoDate(d);
              const isSelected = iso === selectedIso;
              const hasHours = (workingDays ?? []).some((w) => w.work_date === iso);
              return (
                <div
                  key={iso}
                  onClick={() => setSelectedDate(d)}
                  className="mood-pill"
                  style={{
                    textAlign: 'center',
                    padding: '10px 4px',
                    borderRadius: '12px',
                    background: isSelected ? 'var(--brand-grad)' : '#fff',
                    border: isSelected ? 'none' : '1.5px solid var(--line)',
                    color: isSelected ? '#fff' : 'var(--ink2)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{WEEKDAY_FORMAT.format(d)}</div>
                  <div style={{ fontWeight: 800, fontSize: '17px' }}>{String(d.getDate()).padStart(2, '0')}</div>
                  {hasHours && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: isSelected ? '#fff' : 'var(--brand)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <LoadingSpinner />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>Khung giờ làm việc</div>
                  <span onClick={() => setShowAddInterval(true)} className="link-hover" style={{ color: 'var(--brand-d)', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>
                    + Thêm khung giờ
                  </span>
                </div>
                {dayIntervals.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Chưa mở khung giờ nào cho ngày này.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                      {dayIntervals.map((w) => (
                        <span key={w.id} style={{ padding: '8px 14px', borderRadius: '11px', background: 'var(--tint)', color: 'var(--brand-d)', fontWeight: 700, fontSize: '14px' }}>
                          {w.start_time.slice(0, 5)} – {w.end_time.slice(0, 5)}
                        </span>
                      ))}
                    </div>
                    <span onClick={() => setShowCloseDay(true)} className="link-hover" style={{ color: '#c0492f', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>
                      Đóng cả ngày
                    </span>
                  </>
                )}
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>Giờ bị chặn</div>
                  <span onClick={() => setShowAddBlock(true)} className="link-hover" style={{ color: 'var(--brand-d)', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>
                    + Chặn giờ
                  </span>
                </div>
                {dayBlocks.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Không có giờ nào bị chặn.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dayBlocks.map((b) => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '11px', background: 'var(--tint2)' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>
                          {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                        </span>
                        {b.reason && <span style={{ color: 'var(--muted)', fontSize: '13px' }}>· {b.reason}</span>}
                        <span
                          onClick={() => deleteBlockedSlot(b.id).then(reload).catch(() => {})}
                          className="link-hover"
                          style={{ marginLeft: 'auto', color: '#c0492f', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                        >
                          Bỏ chặn
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <AddIntervalModal
            open={showAddInterval}
            onClose={() => setShowAddInterval(false)}
            onAdded={async (start, end) => {
              await addWorkingInterval(selectedIso, start, end);
              reload();
            }}
          />
          <AddBlockModal
            open={showAddBlock}
            onClose={() => setShowAddBlock(false)}
            onAdded={async (start, end, reason) => {
              await addBlockedSlot(selectedIso, start, end, reason);
              reload();
            }}
          />
          <CloseDayModal
            open={showCloseDay}
            onClose={() => setShowCloseDay(false)}
            onConfirm={async () => {
              await closeWorkingDay(selectedIso);
              reload();
            }}
          />
        </div>
      )}
    </DoctorShell>
  );
}
