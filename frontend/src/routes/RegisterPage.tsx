import { useState } from 'react';
import { AuthLayout } from './auth/AuthLayout';
import { FieldInput } from './auth/FieldInput';
import { CheckField } from './auth/CheckField';

const faintIconProps = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--faint)', strokeWidth: 2 };

function passwordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

interface RegisterPageProps {
  onGoHome: () => void;
  onGoLogin: () => void;
}

export function RegisterPage({ onGoHome, onGoLogin }: RegisterPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const strength = passwordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No signup API exists yet — real auth is Cognito-based (see infra/modules/cognito),
    // not wired up until a deployed User Pool is available to the frontend.
    onGoHome();
  };

  return (
    <AuthLayout onGoHome={onGoHome}>
      <form onSubmit={handleSubmit} style={{ width: '420px', maxWidth: '100%' }} className="fade-up">
        <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-.5px', margin: 0 }}>Tạo tài khoản</h1>
        <p style={{ color: 'var(--muted)', fontSize: '15.5px', margin: '8px 0 24px' }}>Đăng ký miễn phí để đặt lịch khám tại Bệnh viện Quân y 175</p>

        <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Họ và tên</label>
        <div style={{ marginBottom: '16px' }}>
          <FieldInput
            compact
            icon={
              <svg {...faintIconProps}>
                <circle cx="12" cy="8" r="3.4" />
                <path d="M5 21a7 7 0 0 1 14 0" />
              </svg>
            }
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Email</label>
            <FieldInput
              compact
              icon={
                <svg {...faintIconProps}>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              }
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Số điện thoại</label>
            <FieldInput
              compact
              icon={
                <svg {...faintIconProps}>
                  <path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                </svg>
              }
              placeholder="09xx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Mật khẩu</label>
        <div style={{ marginBottom: '10px' }}>
          <FieldInput
            compact
            icon={
              <svg {...faintIconProps}>
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            }
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '999px',
                background: i >= strength ? 'var(--line)' : i === strength - 1 && strength < 4 ? 'var(--gold)' : 'var(--brand)',
                transition: 'background 0.2s ease',
              }}
            />
          ))}
        </div>

        <div style={{ marginBottom: '22px' }}>
          <CheckField checked={agreed} onChange={setAgreed} align="flex-start">
            Tôi đồng ý với <b style={{ color: 'var(--brand)' }}>Điều khoản dịch vụ</b> và <b style={{ color: 'var(--brand)' }}>Chính sách bảo mật</b> của MedBook
          </CheckField>
        </div>

        <button
          type="submit"
          className="btn-hover"
          disabled={!agreed}
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
            cursor: agreed ? 'pointer' : 'not-allowed',
            opacity: agreed ? 1 : 0.6,
            boxShadow: 'var(--sh-sm)',
            transition: 'opacity 0.2s ease, filter 0.15s ease',
          }}
        >
          Tạo tài khoản
        </button>

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '15px', color: 'var(--muted)' }}>
          Đã có tài khoản?{' '}
          <span onClick={onGoLogin} style={{ color: 'var(--brand)', fontWeight: 700, cursor: 'pointer' }}>
            Đăng nhập
          </span>
        </div>
      </form>
    </AuthLayout>
  );
}
