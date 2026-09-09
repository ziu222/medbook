import { useEffect, useState, type CSSProperties } from 'react';
import { AdminTabs } from '../../components/Common/AdminTabs';
import {
  ApiError,
  fetchDoctor,
  fetchDoctors,
  fetchFacilities,
  fetchSpecialties,
  updateDoctorProfile,
  type DoctorDetail,
  type Facility,
  type Specialty,
} from '../../lib/api';
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

function EditDoctorForm({ doctorId, doctor }: { doctorId: number; doctor: DoctorDetail }) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [displayName, setDisplayName] = useState(doctor.display_name);
  const [specialtyId, setSpecialtyId] = useState<number | ''>(doctor.specialty.id);
  const [facilityId, setFacilityId] = useState<number | ''>(doctor.facility?.id ?? '');
  const [clinicName, setClinicName] = useState(doctor.clinic_name ?? '');
  const [professionalTitle, setProfessionalTitle] = useState(doctor.professional_title ?? '');
  const [certificatesText, setCertificatesText] = useState(doctor.certificates.join(', '));
  const [yearsExperience, setYearsExperience] = useState(String(doctor.years_experience));
  const [slotDuration, setSlotDuration] = useState<30 | 60>(doctor.slot_duration_minutes === 60 ? 60 : 30);
  const [bio, setBio] = useState(doctor.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSpecialties().then(setSpecialties).catch(() => setSpecialties([]));
    fetchFacilities().then(setFacilities).catch(() => setFacilities([]));
  }, []);

  const canSave = displayName.trim().length > 0 && specialtyId !== '' && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateDoctorProfile(doctorId, {
        specialty_id: specialtyId,
        facility_id: facilityId === '' ? null : facilityId,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        clinic_name: clinicName.trim() || null,
        professional_title: professionalTitle.trim() || null,
        certificates: certificatesText
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        years_experience: Number(yearsExperience) || 0,
        slot_duration_minutes: slotDuration,
        avatar_url: doctor.avatar_url,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lưu hồ sơ thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '640px' }}>
      <div>
        <label style={labelStyle}>Họ và tên</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={fieldStyle} />
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
        <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} style={fieldStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Số năm kinh nghiệm</label>
          <input type="number" min={0} max={80} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Thời lượng 1 ca khám</label>
          <select value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value) === 60 ? 60 : 30)} style={fieldStyle}>
            <option value={30}>30 phút</option>
            <option value={60}>1 giờ</option>
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Level / học vị (VD: Thạc sĩ, Bác sĩ CKI...)</label>
        <input value={professionalTitle} onChange={(e) => setProfessionalTitle(e.target.value)} style={fieldStyle} />
      </div>

      <div>
        <label style={labelStyle}>Chứng chỉ (mỗi chứng chỉ cách nhau bởi dấu phẩy)</label>
        <input value={certificatesText} onChange={(e) => setCertificatesText(e.target.value)} style={fieldStyle} />
      </div>

      <div>
        <label style={labelStyle}>Giới thiệu</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={5000} style={{ ...fieldStyle, resize: 'vertical' }} />
      </div>

      {error && <div style={{ color: '#c0492f', fontSize: '13.5px' }}>{error}</div>}
      {saved && !error && <div style={{ color: 'var(--brand-d)', fontSize: '13.5px' }}>Đã lưu hồ sơ.</div>}

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
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </span>
      </div>
    </div>
  );
}

function DoctorEditPanel({ doctorId }: { doctorId: number }) {
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);

  useEffect(() => {
    setDoctor(null);
    fetchDoctor(doctorId).then(setDoctor).catch(() => setDoctor(null));
  }, [doctorId]);

  if (!doctor) return <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Đang tải...</div>;
  return <EditDoctorForm key={doctorId} doctorId={doctorId} doctor={doctor} />;
}

export function AdminEditDoctorPage({ authed }: { authed: boolean }) {
  const isAdmin = authed && getUserRole() === 'admin';
  const [doctors, setDoctors] = useState<{ id: number; display_name: string; specialty: { name: string } }[]>([]);
  const [doctorId, setDoctorId] = useState<number | ''>('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchDoctors({ limit: 100 }).then(setDoctors).catch(() => setDoctors([]));
  }, [isAdmin]);

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
      <AdminTabs active="/admin/sua-bac-si" />
      <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>Sửa hồ sơ bác sĩ</h1>
      <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '22px' }}>
        Bác sĩ không tự sửa được hồ sơ — quản trị viên cập nhật thông tin tại đây.
      </div>

      <div style={{ marginBottom: '22px', maxWidth: '360px' }}>
        <label style={labelStyle}>Chọn bác sĩ</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : '')} style={fieldStyle}>
          <option value="">— Chọn bác sĩ —</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.display_name} · {d.specialty.name}
            </option>
          ))}
        </select>
      </div>

      {doctorId !== '' && <DoctorEditPanel doctorId={doctorId} />}
    </main>
  );
}
