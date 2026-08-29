import type { CSSProperties } from 'react';
import { logout, redirectToLogin, redirectToSignup } from '../../lib/auth';

export type NavKey = 'home' | 'find' | 'specialties' | 'ai' | 'appointments' | 'profile';

interface HeaderProps {
  /** Which nav item is highlighted as current. Pages not built yet just pass 'home'. */
  active?: NavKey;
  authed?: boolean;
  /** 'appointments' and 'profile' only show once authed. */
  onNavigate?: (key: NavKey) => void;
}

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'home', label: 'Trang chủ' },
  { key: 'find', label: 'Tìm bác sĩ' },
  { key: 'specialties', label: 'Chuyên khoa' },
  { key: 'ai', label: 'Trợ lý AI' },
];

// whiteSpace matters: the patient links pushed the row past its width and every label
// started wrapping onto a second line.
const navItemStyle = (isActive: boolean): CSSProperties => ({
  padding: '9px 14px',
  borderRadius: '10px',
  fontWeight: isActive ? 700 : 600,
  fontSize: '15px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  color: isActive ? 'var(--brand)' : 'var(--ink2)',
  ...(isActive ? { background: 'var(--tint)' } : {}),
});

export function Header({ active = 'home', authed = false, onNavigate }: HeaderProps) {
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
          gap: '28px',
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
              onClick={() => onNavigate?.(item.key)}
            >
              {item.label}
            </span>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {authed ? (
            <>
              <span
                className={active === 'appointments' ? undefined : 'nav-hover-slide'}
                style={navItemStyle(active === 'appointments')}
                onClick={() => onNavigate?.('appointments')}
              >
                Lịch hẹn của tôi
              </span>
              <span
                className={active === 'profile' ? undefined : 'nav-hover-slide'}
                style={navItemStyle(active === 'profile')}
                onClick={() => onNavigate?.('profile')}
              >
                Hồ sơ
              </span>
              <span
                onClick={logout}
                className="link-hover"
                style={{
                  padding: '11px 20px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--line)',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  color: 'var(--ink)',
                }}
              >
                Đăng xuất
              </span>
            </>
          ) : (
            <>
              <span
                onClick={() => redirectToLogin()}
                className="link-hover"
                style={{
                  padding: '11px 20px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--line)',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  color: 'var(--ink)',
                }}
              >
                Đăng nhập
              </span>
              <span
                onClick={() => redirectToSignup()}
                className="btn-hover"
                style={{
                  padding: '12px 22px',
                  borderRadius: '12px',
                  background: 'var(--brand-grad)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--sh-sm)',
                }}
              >
                Đăng ký
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
