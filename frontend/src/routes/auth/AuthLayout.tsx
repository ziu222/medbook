import type { ReactNode } from 'react';

interface AuthLayoutProps {
  onGoHome: () => void;
  children: ReactNode;
}

export function AuthLayout({ onGoHome, children }: AuthLayoutProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>
      <div
        style={{
          position: 'relative',
          background: 'var(--forest)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 52px',
        }}
      >
        <div
          className="blob-float"
          style={{
            position: 'absolute',
            right: '-80px',
            top: '-60px',
            width: '340px',
            height: '340px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(24,169,129,.5), transparent 70%)',
          }}
        />
        <div
          className="blob-float"
          style={{
            position: 'absolute',
            left: '-70px',
            bottom: '40px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(242,106,79,.28), transparent 70%)',
            animationDelay: '-4s',
          }}
        />
        <div onClick={onGoHome} style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '11px', cursor: 'pointer' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--brand-grad)', display: 'grid', placeItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 4v16h12.5a1.5 1.5 0 0 0 0-3H8" />
              <path d="M12 8.5v4M10 10.5h4" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '22px', color: '#fff' }}>MedBook</span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="fade-up" style={{ fontSize: '38px', lineHeight: 1.15, fontWeight: 800, color: '#fff', letterSpacing: '-.8px', margin: '0 0 18px' }}>
            Chăm sóc sức khỏe
            <br />
            bắt đầu từ đây
          </h2>
          <p className="fade-up" style={{ fontSize: '16.5px', lineHeight: 1.6, color: '#CDE3D8', maxWidth: '400px', margin: '0 0 30px', animationDelay: '80ms' }}>
            Đặt lịch với hơn 1.200 bác sĩ chuyên khoa, quản lý hồ sơ và nhận nhắc hẹn — tất cả trong một tài khoản.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {['Đặt lịch nhanh trong vài phút', 'Trợ lý AI gợi ý đúng chuyên khoa', 'Bảo mật thông tin y tế của bạn'].map((line, i) => (
              <div
                key={line}
                className="fade-up"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#DCEEE3', fontSize: '15.5px', animationDelay: `${160 + i * 30}ms` }}
              >
                <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(255,255,255,.14)', display: 'grid', placeItems: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7BE3B8" strokeWidth="3" strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, color: '#8FB6A2', fontSize: '13.5px' }}>© 2026 MedBook · Nền tảng đặt lịch khám</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '44px' }}>{children}</div>
    </div>
  );
}
