import { useEffect, useState, type CSSProperties } from 'react';
import { ApiError, createDoctorAccount, fetchFacilities, fetchSpecialties, type Facility, type Specialty } from '../../lib/api';
import { getUserRole, redirectToLogin } from '../../lib/auth';

const fieldStyle: CSSProperties = {
  padding: '11px 14px',
  borderRadius: '11px',
  border: '1px solid var(--line)',
  fontSize: '14.5px',
  outline: 'none',
  width: '100%',
};

const labelStyle: CSSProperties = { fontWeight: 700, fontSize: '13.5px', marginBottom: '6px', display: 'block' };

function CreateDoctorForm() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [specialtyId, setSpecialtyId] = useState<number | ''>('');
  const [facilityId, setFacilityId] = useState<number | ''>('');
  const [clinicName, setClinicName] = useState('');
  const [yearsExperience, setYearsExperience] = useState('0');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSpecialties().then(setSpecialties).catch(() => setSpecialties([]));
    fetchFacilities().then(setFacilities).catch(() => setFacilities([]));
  }, []);

  const canSave = email.trim().length > 0 && displayName.trim().length > 0 && specialtyId !== '' && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await createDoctorAccount({
        email: email.trim(),
        specialty_id: specialtyId,
        facility_id: facilityId === '' ? null : facilityId,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        clinic_name: clinicName.trim() || null,
        years_experience: Number(yearsExperience) || 0,
        avatar_url: null,
      });
      setSaved(true);
      setEmail('');
      setDisplayName('');
      setSpecialtyId('');
      setFacilityId('');
      setClinicName('');
      setYearsExperience('0');
      setBio('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tạo tài khoản thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '640px' }}>
      <div>
        <label style={labelStyle}>Email đăng nhập</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={fieldStyle} placeholder="bacsi@benhvien.vn" />
      </div>

      <div>
        <label style={labelStyle}>Họ và tên</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={fieldStyle} placeholder="BS.CKII Nguyễn Văn A" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Chuyên khoa</label>
          <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value ? Number(e.target.value) : '')} style={fieldStyle}>
            <option value="">— Chọn chuyên khoa —</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Cơ sở khám</label>
          <select value={facilityId} onChange={(e) => setFacilityId(e.target.value ? Number(e.target.value) : '')} style={fieldStyle}>
            <option value="">— Không chọn —</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Tên phòng khám (hiển thị công khai)</label>
        <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} style={fieldStyle} placeholder="Vd: Phòng khám Tim mạch 175" />
      </div>

      <div>
        <label style={labelStyle}>Số năm kinh nghiệm</label>
        <input type="number" min={0} max={80} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} style={fieldStyle} />
      </div>

      <div>
        <label style={labelStyle}>Giới thiệu</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={5000} style={{ ...fieldStyle, resize: 'vertical' }} />
      </div>

      {error && <div style={{ color: '#c0492f', fontSize: '13.5px' }}>{error}</div>}
      {saved && !error && <div style={{ color: 'var(--brand-d)', fontSize: '13.5px' }}>Đã tạo tài khoản bác sĩ. Mật khẩu tạm thời đã được gửi qua email.</div>}

      <div>
        <span
          onClick={canSave ? handleSave : undefined}
          className={canSave ? 'btn-hover' : undefined}
          style={{
            display: 'inline-block',
            padding: '12px 26px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '14.5px',
            cursor: canSave ? 'pointer' : 'not-allowed',
            background: canSave ? 'var(--brand-grad)' : 'var(--line)',
            color: canSave ? '#fff' : 'var(--faint)',
          }}
        >
          {saving ? 'Đang tạo...' : 'Tạo tài khoản bác sĩ'}
        </span>
      </div>
    </div>
  );
}

export function AdminCreateDoctorPage({ authed }: { authed: boolean }) {
  const isAdmin = authed && getUserRole() === 'admin';

  if (!isAdmin) {
    return (
      <div className="fade-up" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>
            {authed ? 'Chỉ quản trị viên mới có thể truy cập trang này.' : 'Đăng nhập bằng tài khoản quản trị để tiếp tục.'}
          </div>
          {!authed && (
            <span
              onClick={() => redirectToLogin()}
              className="btn-hover"
              style={{ display: 'inline-block', padding: '13px 26px', borderRadius: '12px', background: 'var(--brand-grad)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Đăng nhập
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>Tạo tài khoản bác sĩ</h1>
      <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '22px' }}>
        Bác sĩ không tự đăng ký — quản trị viên tạo tài khoản và điền hồ sơ tại đây.
      </div>
      <CreateDoctorForm />
    </main>
  );
}
