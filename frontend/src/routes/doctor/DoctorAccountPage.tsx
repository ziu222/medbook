import type { CSSProperties } from 'react';
import { DoctorShell } from '../../components/Common/DoctorShell';
import type { DoctorDetail } from '../../lib/api';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorAccountPageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

const rowStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const labelStyle: CSSProperties = { fontWeight: 700, fontSize: '13px', color: 'var(--muted)' };
const valueStyle: CSSProperties = { fontSize: '15px' };

function DoctorAccountView({ doctor }: { doctor: DoctorDetail | null }) {
  if (!doctor) {
    return <div style={{ color: 'var(--muted)', fontSize: '14.5px' }}>Chưa có hồ sơ. Liên hệ quản trị viên để được khởi tạo tài khoản.</div>;
  }

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
          {doctor.display_name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '18px' }}>{doctor.display_name}</div>
          <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{doctor.specialty.name}</div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
          Chỉ quản trị viên mới có thể chỉnh sửa hồ sơ này. Liên hệ quản trị viên nếu thông tin cần cập nhật.
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Cơ sở khám</span>
          <span style={valueStyle}>{doctor.facility?.name ?? '—'}</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Tên phòng khám</span>
          <span style={valueStyle}>{doctor.clinic_name ?? '—'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Số năm kinh nghiệm</span>
            <span style={valueStyle}>{doctor.years_experience}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Thời lượng 1 ca khám</span>
            <span style={valueStyle}>{doctor.slot_duration_minutes} phút</span>
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Level / học vị</span>
          <span style={valueStyle}>{doctor.professional_title ?? '—'}</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Chứng chỉ</span>
          <span style={valueStyle}>{doctor.certificates.length ? doctor.certificates.join(', ') : '—'}</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Giới thiệu</span>
          <span style={valueStyle}>{doctor.bio ?? '—'}</span>
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
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>Hồ sơ</h1>
          <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '22px' }}>Xem thông tin hồ sơ khám bệnh của bạn</div>
          <DoctorAccountView doctor={doctor} />
        </div>
      )}
    </DoctorShell>
  );
}
