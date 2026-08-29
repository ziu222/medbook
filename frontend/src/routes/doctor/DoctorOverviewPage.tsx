import { useEffect, useState } from 'react';
import { DoctorShell } from '../../components/Common/DoctorShell';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { fetchDoctorAppointments, type AppointmentRead, type DoctorDetail } from '../../lib/api';
import { toIsoDate } from '../../lib/date';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorOverviewPageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ thanh toán', color: '#96631a', bg: '#fdf3e2' },
  confirmed: { label: 'Đã xác nhận', color: 'var(--brand-d)', bg: 'var(--tint)' },
  completed: { label: 'Đã khám', color: 'var(--muted)', bg: 'var(--tint2)' },
  cancelled: { label: 'Đã hủy', color: '#c0492f', bg: '#fdeceb' },
};

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '20px' }}>
      <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-.5px' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

export function DoctorOverviewPage({ authed, onNavigate }: DoctorOverviewPageProps) {
  const [today, setToday] = useState<AppointmentRead[] | null>(null);
  const [completedThisMonth, setCompletedThisMonth] = useState<AppointmentRead[] | null>(null);

  useEffect(() => {
    if (!authed) return;
    const todayIso = toIsoDate(new Date());
    Promise.all([
      fetchDoctorAppointments({ date: todayIso, limit: 100 }),
      fetchDoctorAppointments({ status: 'completed', limit: 100 }),
    ])
      .then(([todayList, completedList]) => {
        setToday(todayList);
        setCompletedThisMonth(completedList.filter((a) => a.appointment_date.startsWith(todayIso.slice(0, 7))));
      })
      .catch(() => {
        setToday([]);
        setCompletedThisMonth([]);
      });
  }, [authed]);

  const loading = today === null || completedThisMonth === null;
  const pendingToday = today?.filter((a) => a.status === 'pending').length ?? 0;
  const sortedToday = [...(today ?? [])].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <DoctorShell active="overview" authed={authed} onNavigate={onNavigate}>
      {(doctor: DoctorDetail | null) => (
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>
            Xin chào, {doctor?.display_name ?? 'bác sĩ'} 👋
          </h1>
          <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '24px' }}>
            {new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '26px' }}>
                <StatCard value={String(today?.length ?? 0)} label="Cuộc hẹn hôm nay" />
                <StatCard value={String(pendingToday)} label="Chờ thanh toán hôm nay" />
                <StatCard value={String(completedThisMonth?.length ?? 0)} label="Đã khám tháng này" />
                <StatCard value={doctor ? doctor.rating.toFixed(1) : '—'} label="Đánh giá trung bình" />
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '22px' }}>
                <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '16px' }}>Lịch hẹn hôm nay</div>
                {sortedToday.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: '14px', padding: '20px 0' }}>Chưa có lịch hẹn nào hôm nay.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14.5px' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--faint)', fontSize: '12.5px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Bệnh nhân</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Giờ</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Lý do</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedToday.map((a) => {
                        const status = STATUS_META[a.status] ?? { label: a.status, color: 'var(--muted)', bg: 'var(--tint2)' };
                        return (
                          <tr key={a.id} style={{ borderTop: '1px solid var(--line)' }}>
                            <td style={{ padding: '12px 10px', fontWeight: 700 }}>{a.patient_full_name}</td>
                            <td style={{ padding: '12px 10px' }}>{a.start_time.slice(0, 5)}</td>
                            <td style={{ padding: '12px 10px', color: 'var(--ink2)' }}>{a.symptoms}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{ padding: '5px 11px', borderRadius: '999px', background: status.bg, color: status.color, fontWeight: 700, fontSize: '12.5px' }}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </DoctorShell>
  );
}
