import type { CSSProperties } from 'react';
import { logout } from '../../lib/auth';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorSidebarProps {
  active: DoctorNavKey;
  doctorName: string;
  specialtyName: string;
  onNavigate: (key: DoctorNavKey) => void;
}

const overviewIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="5" rx="1.5" />
    <rect x="13" y="12" width="8" height="9" rx="1.5" />
    <rect x="3" y="15" width="8" height="6" rx="1.5" />
  </svg>
);

const scheduleIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

const appointmentsIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);

const profileIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20.2c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
  </svg>
);

const NAV_ITEMS: { key: DoctorNavKey; label: string; icon: JSX.Element }[] = [
  { key: 'overview', label: 'Tổng quan', icon: overviewIcon },
  { key: 'schedule', label: 'Lịch làm việc', icon: scheduleIcon },
  { key: 'appointments', label: 'Cuộc hẹn', icon: appointmentsIcon },
  { key: 'profile', label: 'Hồ sơ & Cài đặt', icon: profileIcon },
];

const itemStyle = (isActive: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '11px 14px',
  borderRadius: '12px',
  fontWeight: isActive ? 700 : 600,
  fontSize: '14.5px',
  cursor: 'pointer',
  color: isActive ? '#fff' : 'var(--tint2)',
  background: isActive ? 'var(--brand)' : 'transparent',
});

export function DoctorSidebar({ active, doctorName, specialtyName, onNavigate }: DoctorSidebarProps) {
  return (
    <aside
      style={{
        width: '256px',
        flexShrink: 0,
        minHeight: '100vh',
        background: 'var(--forest)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '28px' }}>
        <img src="/favicon.svg" alt="" style={{ width: '28px', height: '28px' }} />
        <span style={{ fontWeight: 800, fontSize: '17px' }}>MedBook</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <div key={item.key} style={itemStyle(item.key === active)} onClick={() => onNavigate(item.key)}>
            {item.icon}
            {item.label}
          </div>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,.12)' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'var(--coral)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          {doctorName.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctorName}</div>
          <div style={{ color: 'var(--tint2)', fontSize: '12.5px', opacity: 0.75 }}>{specialtyName}</div>
        </div>
        <span onClick={logout} style={{ cursor: 'pointer', opacity: 0.75, fontSize: '12.5px', fontWeight: 700 }}>
          Thoát
        </span>
      </div>
    </aside>
  );
}
