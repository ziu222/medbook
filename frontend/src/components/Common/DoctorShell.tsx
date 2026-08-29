import { useEffect, useState, type ReactNode } from 'react';
import { DoctorSidebar } from './DoctorSidebar';
import { LoadingSpinner } from './LoadingSpinner';
import { fetchMyDoctorProfile, type DoctorDetail } from '../../lib/api';
import { redirectToLogin } from '../../lib/auth';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorShellProps {
  active: DoctorNavKey;
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
  children: (doctor: DoctorDetail | null) => ReactNode;
}

export function DoctorShell({ active, authed, onNavigate, children }: DoctorShellProps) {
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(authed);

  useEffect(() => {
    if (!authed) return;
    fetchMyDoctorProfile()
      .then(setDoctor)
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false));
  }, [authed]);

  if (!authed) {
    return (
      <div className="fade-up" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>Đăng nhập bằng tài khoản bác sĩ để tiếp tục.</div>
          <span
            onClick={() => redirectToLogin()}
            className="btn-hover"
            style={{
              display: 'inline-block',
              padding: '13px 26px',
              borderRadius: '12px',
              background: 'var(--brand-grad)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Đăng nhập
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <DoctorSidebar
        active={active}
        doctorName={doctor?.display_name ?? 'Bác sĩ'}
        specialtyName={doctor?.specialty.name ?? ''}
        onNavigate={onNavigate}
      />
      <main style={{ flex: 1, padding: '28px 36px', minWidth: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <LoadingSpinner />
          </div>
        ) : !doctor && active !== 'profile' ? (
          <div className="fade-up" style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>Hoàn thiện hồ sơ bác sĩ trước khi sử dụng mục này.</div>
            <span
              onClick={() => onNavigate('profile')}
              className="btn-hover"
              style={{
                display: 'inline-block',
                padding: '13px 26px',
                borderRadius: '12px',
                background: 'var(--brand-grad)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Hoàn thiện hồ sơ
            </span>
          </div>
        ) : (
          children(doctor)
        )}
      </main>
    </div>
  );
}
