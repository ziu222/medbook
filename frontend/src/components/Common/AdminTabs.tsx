import { Link } from 'react-router-dom';

const TABS = [
  { path: '/admin/tao-bac-si', label: 'Tạo tài khoản bác sĩ' },
  { path: '/admin/khoa-lich-bac-si', label: 'Khóa lịch bác sĩ' },
  { path: '/admin/hoan-tien', label: 'Chính sách hủy & hoàn tiền' },
] as const;

export function AdminTabs({ active }: { active: string }) {
  return (
    <div style={{ display: 'flex', gap: '22px', borderBottom: '1px solid var(--line)', marginBottom: '24px' }}>
      {TABS.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          style={{
            paddingBottom: '12px',
            borderBottom: tab.path === active ? '2.5px solid var(--brand)' : 'none',
            color: tab.path === active ? 'var(--brand)' : 'var(--muted)',
            fontWeight: tab.path === active ? 700 : 600,
            fontSize: '14.5px',
            textDecoration: 'none',
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
