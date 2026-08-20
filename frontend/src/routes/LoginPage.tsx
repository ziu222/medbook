import { useState } from 'react';
import { AuthLayout } from './auth/AuthLayout';
import { FieldInput } from './auth/FieldInput';
import { CheckField } from './auth/CheckField';

const faintIconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--faint)', strokeWidth: 2 };

interface LoginPageProps {
  onGoHome: () => void;
  onGoRegister: () => void;
}

export function LoginPage({ onGoHome, onGoRegister }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No login API exists yet — real auth is Cognito-based (see infra/modules/cognito),
    // not wired up until a deployed User Pool is available to the frontend.
    onGoHome();
  };

  return (
    <AuthLayout onGoHome={onGoHome}>
      <form onSubmit={handleSubmit} style={{ width: '400px', maxWidth: '100%' }} className="fade-up">
        <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-.5px', margin: 0 }}>Đăng nhập</h1>
        <p style={{ color: 'var(--muted)', fontSize: '15.5px', margin: '8px 0 28px' }}>Chào mừng bạn quay lại MedBook 👋</p>

        <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Email hoặc số điện thoại</label>
        <div style={{ marginBottom: '18px' }}>
          <FieldInput
            icon={
              <svg {...faintIconProps}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            }
            placeholder="you@email.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Mật khẩu</label>
        <div style={{ marginBottom: '14px' }}>
          <FieldInput
            icon={
              <svg {...faintIconProps}>
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            }
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            trailing={
              <svg
                {...faintIconProps}
                className="icon-hover-scale"
                style={{ cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setShowPassword((v) => !v)}
              >
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="2.6" />
              </svg>
            }
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <CheckField checked={remember} onChange={setRemember}>
            Ghi nhớ đăng nhập
          </CheckField>
          <span style={{ color: 'var(--brand)', fontWeight: 600, fontSize: '14.5px', cursor: 'pointer' }}>Quên mật khẩu?</span>
        </div>

        <button
          type="submit"
          className="btn-hover"
          style={{
            width: '100%',
            textAlign: 'center',
            padding: '15px',
            border: 'none',
            borderRadius: '13px',
            background: 'var(--brand-grad)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: 'var(--sh-sm)',
          }}
        >
          Đăng nhập
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '22px 0', color: 'var(--faint)', fontSize: '13.5px' }}>
          <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
          hoặc
          <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            className="link-hover"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', padding: '12px', border: '1.5px solid var(--line)', borderRadius: '12px', fontWeight: 600, fontSize: '14.5px', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22 12.2c0-.7-.06-1.4-.18-2H12v3.8h5.6a4.8 4.8 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1-2.6 0-4.8-1.7-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.5 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.4-2.6Z" />
              <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.4 2.6C7.2 7.8 9.4 6.1 12 6.1Z" />
            </svg>
            Google
          </div>
          <div
            className="link-hover"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', padding: '12px', border: '1.5px solid var(--line)', borderRadius: '12px', fontWeight: 600, fontSize: '14.5px', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8h2.6L15.6 15h-2.2v7A10 10 0 0 0 22 12Z" />
            </svg>
            Facebook
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '26px', fontSize: '15px', color: 'var(--muted)' }}>
          Chưa có tài khoản?{' '}
          <span onClick={onGoRegister} style={{ color: 'var(--brand)', fontWeight: 700, cursor: 'pointer' }}>
            Đăng ký ngay
          </span>
        </div>
      </form>
    </AuthLayout>
  );
}
