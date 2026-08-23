import { useEffect, useState } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { SpecialtyIcon } from '../components/Common/SpecialtyIcon';
import { fetchDoctors, fetchSpecialties, type DoctorSummary, type Specialty } from '../lib/api';
import { copyFor } from '../lib/specialtyContent';

interface SpecialtiesPageProps {
  authed: boolean;
  onNavigate: (key: NavKey) => void;
  onSelectSpecialty: (slug: string) => void;
}

// The hospital's institutional count, same figure the homepage stats band already shows.
const INSTITUTE_COUNT = 12;

const chevron = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: '32px', fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</div>
      <div style={{ fontSize: '13.5px', color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function SpecialtyCard({
  specialty,
  doctorCount,
  delayMs,
  onOpen,
}: {
  specialty: Specialty;
  doctorCount: number;
  delayMs: number;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="card-hover fade-up"
      style={{
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: '20px',
        padding: '24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          className="img-zoom"
          style={{ width: '50px', height: '50px', flexShrink: 0, borderRadius: '15px', background: 'var(--tint)', display: 'grid', placeItems: 'center' }}
        >
          <SpecialtyIcon slug={specialty.slug} />
        </div>
        <div style={{ minWidth: 0, fontWeight: 800, fontSize: '17px', letterSpacing: '-.3px' }}>{specialty.name}</div>
      </div>
      <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.55, color: 'var(--ink2)' }}>{copyFor(specialty.slug).blurb}</p>
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '12px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '13.5px', color: 'var(--muted)', fontWeight: 600 }}>
          {doctorCount > 0 ? `${doctorCount} bác sĩ` : 'Đang cập nhật bác sĩ'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: 'var(--brand)' }}>
          Xem chi tiết
          {chevron}
        </span>
      </div>
    </div>
  );
}

export function SpecialtiesPage({ authed, onNavigate, onSelectSpecialty }: SpecialtiesPageProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // One doctors call covers every card's count — grouping client-side beats ten requests.
    Promise.all([fetchSpecialties(), fetchDoctors({ limit: 100 })])
      .then(([specs, docs]) => {
        setSpecialties(specs);
        setDoctors(docs);
      })
      .catch(() => setSpecialties([]))
      .finally(() => setLoading(false));
  }, []);

  const countFor = (specialtyId: number) => doctors.filter((d) => d.specialty.id === specialtyId).length;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header active="specialties" authed={authed} onNavigate={onNavigate} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ padding: '26px 0 60px' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '26px' }}>
            <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
              Trang chủ
            </span>{' '}
            / <b style={{ color: 'var(--ink)' }}>Chuyên khoa</b>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '40px', paddingBottom: '26px', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--soft)',
                  color: 'var(--brand-d)',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  marginBottom: '16px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--coral)' }} />
                Bệnh viện Quân y 175
              </div>
              <h1 style={{ fontSize: '44px', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-1.2px', margin: 0 }}>
                Danh mục <span style={{ color: 'var(--brand)' }}>chuyên khoa</span>
              </h1>
              <p style={{ fontSize: '17px', lineHeight: 1.6, color: 'var(--ink2)', maxWidth: '560px', margin: '14px 0 0' }}>
                Hệ thống khoa &amp; trung tâm điều trị chuyên sâu. Chọn một chuyên khoa để xem giới thiệu và đội ngũ bác sĩ đang nhận lịch khám.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '34px', flexShrink: 0, paddingBottom: '6px' }}>
              <Stat value={specialties.length} label="Chuyên khoa" color="var(--brand)" />
              <Stat value={INSTITUTE_COUNT} label="Viện / Trung tâm" color="var(--brand)" />
              <Stat value={doctors.length} label="Bác sĩ" color="var(--coral)" />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '70px 0' }}>
              <LoadingSpinner label="Đang tải chuyên khoa..." />
            </div>
          ) : specialties.length === 0 ? (
            <div className="fade-up" style={{ textAlign: 'center', padding: '70px 0', color: 'var(--muted)' }}>
              Không tải được danh mục chuyên khoa, vui lòng thử lại sau.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', paddingTop: '32px' }}>
              {specialties.map((specialty, i) => (
                <SpecialtyCard
                  key={specialty.id}
                  specialty={specialty}
                  doctorCount={countFor(specialty.id)}
                  delayMs={Math.min(i * 40, 320)}
                  onOpen={() => onSelectSpecialty(specialty.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
