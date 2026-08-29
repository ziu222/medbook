import { useEffect, useState, type CSSProperties } from 'react';
import { DoctorShell } from '../../components/Common/DoctorShell';
import {
  ApiError,
  fetchFacilities,
  fetchSpecialties,
  saveMyDoctorProfile,
  type DoctorDetail,
  type Facility,
  type Specialty,
} from '../../lib/api';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorAccountPageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

const fieldStyle: CSSProperties = {
  padding: '11px 14px',
  borderRadius: '11px',
  border: '1px solid var(--line)',
  fontSize: '14.5px',
  outline: 'none',
  width: '100%',
};

const labelStyle: CSSProperties = { fontWeight: 700, fontSize: '13.5px', marginBottom: '6px', display: 'block' };

function DoctorAccountForm({ doctor }: { doctor: DoctorDetail | null }) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [displayName, setDisplayName] = useState(doctor?.display_name ?? '');
  const [specialtyId, setSpecialtyId] = useState<number | ''>(doctor?.specialty.id ?? '');
  const [facilityId, setFacilityId] = useState<number | ''>(doctor?.facility?.id ?? '');
  const [clinicName, setClinicName] = useState(doctor?.clinic_name ?? '');
  const [yearsExperience, setYearsExperience] = useState(String(doctor?.years_experience ?? 0));
  const [fee, setFee] = useState(doctor?.consultation_fee_vnd ? String(doctor.consultation_fee_vnd) : '');
  const [bio, setBio] = useState(doctor?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSpecialties().then(setSpecialties).catch(() => setSpecialties([]));
    fetchFacilities().then(setFacilities).catch(() => setFacilities([]));
  }, []);

  const canSave = displayName.trim().length > 0 && specialtyId !== '' && !saving;

  const handleSave = async () => {
    if (!canSave || specialtyId === '') return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveMyDoctorProfile({
        specialty_id: specialtyId,
        facility_id: facilityId === '' ? null : facilityId,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        clinic_name: clinicName.trim() || null,
        years_experience: Number(yearsExperience) || 0,
        consultation_fee_vnd: fee ? Number(fee) : null,
        avatar_url: doctor?.avatar_url ?? null,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lưu hồ sơ thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '26px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--coral)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: '19px',
            flexShrink: 0,
          }}
        >
          {(displayName || 'BS').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '18px' }}>{displayName || 'Bác sĩ mới'}</div>
          <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
            {specialties.find((s) => s.id === specialtyId)?.name ?? 'Chưa chọn chuyên khoa'}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Số năm kinh nghiệm</label>
            <input type="number" min={0} max={80} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phí khám (VNĐ)</label>
            <input type="number" min={0} step={1000} value={fee} onChange={(e) => setFee(e.target.value)} style={fieldStyle} placeholder="500000" />
          </div>
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
    </div>
  );
}

export function DoctorAccountPage({ authed, onNavigate }: DoctorAccountPageProps) {
  return (
    <DoctorShell active="profile" authed={authed} onNavigate={onNavigate}>
      {(doctor) => (
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>Hồ sơ & Cài đặt</h1>
          <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '22px' }}>
            {doctor ? 'Quản lý thông tin hồ sơ khám bệnh' : 'Hoàn thiện hồ sơ để bắt đầu nhận lịch hẹn'}
          </div>
          <DoctorAccountForm doctor={doctor} />
        </div>
      )}
    </DoctorShell>
  );
}
