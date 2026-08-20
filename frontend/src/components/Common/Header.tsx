import type { CSSProperties } from 'react';

export type NavKey = 'home' | 'find' | 'specialties' | 'ai';

interface HeaderProps {
  /** Which nav item is highlighted as current. Pages not built yet just pass 'home'. */
  active?: NavKey;
  onLogin?: () => void;
  onRegister?: () => void;
}

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'home', label: 'Trang chủ' },
  { key: 'find', label: 'Tìm bác sĩ' },
  { key: 'specialties', label: 'Chuyên khoa' },
  { key: 'ai', label: 'Trợ lý AI' },
];

const navItemStyle = (isActive: boolean): CSSProperties =>
  isActive
    ? {
        padding: '9px 15px',
        borderRadius: '10px',
        fontWeight: 700,
        fontSize: '15px',
        cursor: 'pointer',
        color: 'var(--brand)',
        background: 'var(--tint)',
      }
    : {
        padding: '9px 15px',
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: '15px',
        cursor: 'pointer',
        color: 'var(--ink2)',
      };

export function Header({ active = 'home', onLogin, onRegister }: HeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(255,255,255,.86)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 32px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          gap: '40px',
        }}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/long_primary_logo.svg" alt="Bệnh viện Quân y 175" style={{ height: '42px', width: 'auto', display: 'block' }} />
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
          {NAV_ITEMS.map((item) => (
            <span
              key={item.key}
              className={item.key === active ? undefined : 'nav-hover-slide'}
              style={navItemStyle(item.key === active)}
            >
              {item.label}
            </span>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            onClick={onLogin}
            className="link-hover"
            style={{
              padding: '11px 20px',
              borderRadius: '12px',
              border: '1.5px solid var(--line)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              color: 'var(--ink)',
            }}
          >
            Đăng nhập
          </span>
          <span
            onClick={onRegister}
            className="btn-hover"
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              background: 'var(--brand-grad)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: 'var(--sh-sm)',
            }}
          >
            Đăng ký
          </span>
        </div>
      </div>
    </header>
  );
}
