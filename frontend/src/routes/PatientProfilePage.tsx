import { useEffect, useState, type ReactNode } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { fetchMyProfile, saveMyProfile, type UserProfile } from '../lib/api';
import { getIdTokenClaims, logout, redirectToLogin } from '../lib/auth';
import { initialsFor } from '../lib/avatar';

interface PatientProfilePageProps {
  authed: boolean;
  onNavigate: (key: NavKey) => void;
}

const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const userIcon = (
  <>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 21a7 7 0 0 1 14 0" />
  </>
);
const clockIcon = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" strokeLinecap="round" />
  </>
);
const logoutIcon = (
  <>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
  </>
);

function NavRow({ icon, label, active, danger, onClick }: { icon: ReactNode; label: string; active?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '13px 15px',
        borderRadius: '12px',
        background: active ? 'var(--tint)' : 'transparent',
        color: active ? 'var(--brand-d)' : danger ? 'var(--coral)' : 'var(--ink2)',
        fontWeight: active ? 700 : 600,
        fontSize: '14.5px',
        cursor: 'pointer',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icon}
      </svg>
      {label}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '16px' }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  border: '1.5px solid var(--line)',
  borderRadius: '12px',
  outline: 'none',
  padding: '12px 15px',
  fontSize: '15px',
  color: 'var(--ink)',
  background: '#fff',
} as const;

function EditField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', color: 'var(--muted)', fontSize: '13px', marginBottom: '6px' }}>{label}</label>
      {children}
      {hint && <div style={{ color: 'var(--faint)', fontSize: '12.5px', marginTop: '5px' }}>{hint}</div>}
    </div>
  );
}

export function PatientProfilePage({ authed, onNavigate }: PatientProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const email = getIdTokenClaims()?.email;

  useEffect(() => {
    if (!authed) {
      setLoading(false);
      return;
    }
    fetchMyProfile()
      .then((p) => {
        setProfile(p);
        if (p) {
          setDisplayName(p.display_name);
          setPhone(p.phone_number ?? '');
          setBirthDate(p.date_of_birth ?? '');
        } else {
          // No profile row yet — booking is blocked until there is one, so open the form straight away.
          setDisplayName(getIdTokenClaims()?.name ?? '');
          setEditing(true);
        }
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [authed]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await saveMyProfile({
        display_name: displayName.trim(),
        phone_number: phone.trim() || null,
        date_of_birth: birthDate || null,
      });
      setProfile(saved);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu hồ sơ thất bại, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setPhone(profile.phone_number ?? '');
    setBirthDate(profile.date_of_birth ?? '');
    setError(null);
    setEditing(false);
  };

  const name = profile?.display_name ?? 'Chưa có hồ sơ';

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header active="profile" authed={authed} onNavigate={onNavigate} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ padding: '30px 0' }}>
          {!authed ? (
            <div className="fade-up" style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>Đăng nhập để xem hồ sơ của bạn.</div>
              <span
                onClick={() => redirectToLogin()}
                className="btn-hover"
                style={{ display: 'inline-block', padding: '13px 26px', borderRadius: '12px', background: 'var(--brand-grad)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Đăng nhập
              </span>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <LoadingSpinner label="Đang tải hồ sơ..." />
            </div>
          ) : failed ? (
            <div className="fade-up" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
              Không tải được hồ sơ, vui lòng thử lại sau.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px', alignItems: 'start' }}>
              <aside style={{ position: 'sticky', top: '96px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '24px',
                      background: 'var(--brand-grad)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '30px',
                      margin: '0 auto 14px',
                    }}
                  >
                    {profile ? initialsFor(profile.display_name) : '—'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '19px' }}>{name}</div>
                  {email && <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '3px', wordBreak: 'break-all' }}>{email}</div>}
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '12px' }}>
                  <NavRow icon={userIcon} label="Thông tin cá nhân" active />
                  <NavRow icon={clockIcon} label="Lịch hẹn của tôi" onClick={() => onNavigate('appointments')} />
                  <NavRow icon={logoutIcon} label="Đăng xuất" danger onClick={logout} />
                </div>
              </aside>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {!profile && (
                  <div
                    className="fade-up"
                    style={{ background: 'var(--sand)', border: '1px solid var(--peach)', borderRadius: '18px', padding: '20px 22px', display: 'flex', gap: '13px' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
                    </svg>
                    <div style={{ fontSize: '14.5px', color: 'var(--ink2)', lineHeight: 1.6 }}>
                      Bạn chưa có hồ sơ cá nhân. <b>Hoàn tất hồ sơ trước khi đặt lịch khám</b> — bệnh viện cần họ tên và số điện thoại để liên hệ xác nhận.
                    </div>
                  </div>
                )}

                <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '22px', padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Thông tin cá nhân</h1>
                    {!editing && profile && (
                      <div
                        onClick={() => setEditing(true)}
                        className="link-hover"
                        style={{ padding: '10px 18px', borderRadius: '11px', background: 'var(--tint)', color: 'var(--brand-d)', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                      >
                        Chỉnh sửa
                      </div>
                    )}
                  </div>

                  {editing ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                        <EditField label="Họ và tên">
                          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nguyễn Văn A" style={inputStyle} />
                        </EditField>
                        <EditField label="Ngày sinh">
                          <input type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle} />
                        </EditField>
                        <EditField label="Số điện thoại" hint="8–15 chữ số, có thể bắt đầu bằng +">
                          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" style={inputStyle} />
                        </EditField>
                        <EditField label="Email" hint="Lấy từ tài khoản đăng nhập, không sửa tại đây">
                          <input value={email ?? '—'} disabled style={{ ...inputStyle, background: 'var(--tint2)', color: 'var(--muted)' }} />
                        </EditField>
                      </div>

                      {error && <div style={{ color: '#c0492f', fontSize: '13.5px', marginTop: '16px' }}>{error}</div>}

                      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <div
                          onClick={saving ? undefined : handleSave}
                          className={saving ? undefined : 'btn-hover'}
                          style={{
                            padding: '13px 28px',
                            borderRadius: '12px',
                            background: saving ? 'var(--line)' : 'var(--brand-grad)',
                            color: saving ? 'var(--faint)' : '#fff',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: saving ? 'none' : 'var(--sh-sm)',
                          }}
                        >
                          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </div>
                        {profile && (
                          <div
                            onClick={handleCancelEdit}
                            className="link-hover"
                            style={{ padding: '13px 24px', borderRadius: '12px', border: '1.5px solid var(--line)', fontWeight: 700, fontSize: '15px', color: 'var(--ink2)', cursor: 'pointer' }}
                          >
                            Hủy
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                      <Field label="Họ và tên" value={profile?.display_name ?? '—'} />
                      <Field label="Ngày sinh" value={profile?.date_of_birth ? DATE_FORMAT.format(new Date(profile.date_of_birth)) : 'Chưa cập nhật'} />
                      <Field label="Email" value={email ?? '—'} />
                      <Field label="Số điện thoại" value={profile?.phone_number ?? 'Chưa cập nhật'} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
