import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { PATHS, pathForNavKey } from '../lib/routes';

export function NotFoundPage({ authed }: { authed: boolean }) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div className="fade-up" style={{ textAlign: 'center', padding: '110px 0' }}>
          <div style={{ fontSize: '64px', fontWeight: 800, letterSpacing: '-2px', color: 'var(--brand)', lineHeight: 1 }}>404</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-.6px', margin: '16px 0 10px' }}>Không tìm thấy trang</h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', margin: '0 0 26px' }}>
            Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.
          </p>
          <span
            onClick={() => navigate(PATHS.home)}
            className="btn-hover"
            style={{
              display: 'inline-block',
              padding: '13px 26px',
              borderRadius: '12px',
              background: 'var(--brand-grad)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--sh-sm)',
            }}
          >
            Về trang chủ
          </span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
