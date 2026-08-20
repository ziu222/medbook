import { useEffect, useState } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { fetchDoctors, fetchSpecialties, type DoctorSummary, type Specialty } from '../lib/api';
import { avatarColorFor, initialsFor } from '../lib/avatar';
import { BOOKING_FEE_VND, formatVnd } from '../lib/pricing';

interface FindDoctorPageProps {
  authed: boolean;
  onNavigate: (key: NavKey) => void;
  onSelectDoctor: (id: number) => void;
}

const RATING_FILTERS = [0, 4.5, 4.0, 3.5];

const starIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--gold)">
    <path d="m12 3 2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.9 6.9 18.8 8 13 3.7 9l5.8-.7Z" />
  </svg>
);

const checkFilledIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--brand)">
    <circle cx="12" cy="12" r="10" />
    <path d="m8.5 12 2.3 2.3 4.7-4.6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </svg>
);

const clinicIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2">
    <path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

const feeIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M3 10h18" />
    <circle cx="7" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

function DoctorCard({ doctor, delayMs, onSelectDoctor }: { doctor: DoctorSummary; delayMs: number; onSelectDoctor: (id: number) => void }) {
  return (
    <div
      className="card-hover fade-up"
      style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '22px', animationDelay: `${delayMs}ms` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '15px',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: '18px',
            background: avatarColorFor(doctor.id),
            flexShrink: 0,
          }}
        >
          {initialsFor(doctor.display_name)}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '16.5px' }}>{doctor.display_name}</span>
            {checkFilledIcon}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{doctor.specialty.name}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--ink2)', marginBottom: '16px' }}>
        {doctor.clinic_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {clinicIcon}
            {doctor.clinic_name}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {starIcon}
          <b style={{ color: 'var(--ink)' }}>{doctor.rating.toFixed(1)}</b> · {doctor.years_experience} năm kinh nghiệm
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand)', fontWeight: 600 }}>
          {feeIcon}
          Phí đặt lịch {formatVnd(BOOKING_FEE_VND)}
        </div>
      </div>
      <div
        onClick={() => onSelectDoctor(doctor.id)}
        className="btn-hover"
        style={{
          textAlign: 'center',
          padding: '12px',
          borderRadius: '12px',
          background: 'var(--brand-grad)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '15px',
          cursor: 'pointer',
        }}
      >
        Đặt lịch ngay
      </div>
    </div>
  );
}

export function FindDoctorPage({ authed, onNavigate, onSelectDoctor }: FindDoctorPageProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [sortByRating, setSortByRating] = useState(false);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);

  useEffect(() => {
    fetchSpecialties()
      .then(setSpecialties)
      .catch(() => setSpecialties([]));
  }, []);

  useEffect(() => {
    fetchDoctors({ limit: 50, specialtyId: selectedSpecialtyId ?? undefined })
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [selectedSpecialtyId]);

  const results = doctors
    .filter((d) => d.rating >= minRating)
    .sort((a, b) => (sortByRating ? b.rating - a.rating : 0));

  const selectedSpecialty = specialties.find((s) => s.id === selectedSpecialtyId);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header active="find" authed={authed} onNavigate={onNavigate} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ padding: '26px 0' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
            <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
              Trang chủ
            </span>{' '}
            / <span style={{ cursor: 'pointer' }}>Tìm bác sĩ</span> /{' '}
            <b style={{ color: 'var(--ink)' }}>{selectedSpecialty?.name ?? 'Tất cả'}</b>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px', alignItems: 'start' }}>
            {/* filters */}
            <aside style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '24px', position: 'sticky', top: '96px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 800, fontSize: '18px', marginBottom: '20px' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 5h18l-7 8v6l-4-2v-4Z" />
                </svg>
                Bộ lọc
              </div>

              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>Chuyên khoa</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
                <label
                  onClick={() => setSelectedSpecialtyId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: selectedSpecialtyId === null ? 'var(--ink)' : 'var(--ink2)', cursor: 'pointer' }}
                >
                  {selectedSpecialtyId === null ? (
                    <span className="check-pop" style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--brand)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  ) : (
                    <span style={{ width: '20px', height: '20px', borderRadius: '6px', border: '1.8px solid var(--line)', flexShrink: 0 }} />
                  )}
                  Tất cả
                </label>
                {specialties.map((sp) => (
                  <label
                    key={sp.id}
                    onClick={() => setSelectedSpecialtyId(sp.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: selectedSpecialtyId === sp.id ? 'var(--ink)' : 'var(--ink2)', cursor: 'pointer' }}
                  >
                    {selectedSpecialtyId === sp.id ? (
                      <span className="check-pop" style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--brand)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    ) : (
                      <span style={{ width: '20px', height: '20px', borderRadius: '6px', border: '1.8px solid var(--line)', flexShrink: 0 }} />
                    )}
                    {sp.name}
                  </label>
                ))}
              </div>

              <div style={{ height: '1px', background: 'var(--line)', marginBottom: '20px' }} />

              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>Đánh giá</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
                {RATING_FILTERS.map((r) => (
                  <div
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`mood-pill${minRating === r ? ' active' : ''}`}
                    style={{
                      padding: '9px 15px',
                      borderRadius: '11px',
                      background: minRating === r ? 'var(--forest)' : '#fff',
                      border: minRating === r ? 'none' : '1.5px solid var(--line)',
                      color: minRating === r ? '#fff' : 'var(--ink2)',
                      fontWeight: minRating === r ? 700 : 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                    }}
                  >
                    {r > 0 && starIcon}
                    {r > 0 ? `${r.toFixed(1)}+` : 'Tất cả'}
                  </div>
                ))}
              </div>
            </aside>

            {/* results */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px' }}>
                  <b style={{ fontSize: '18px' }}>{results.length} bác sĩ</b>{' '}
                  <span style={{ color: 'var(--muted)' }}>{selectedSpecialty ? `chuyên khoa ${selectedSpecialty.name}` : 'phù hợp'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14.5px' }}>Sắp xếp:</span>
                  <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '4px' }}>
                    <div
                      onClick={() => setSortByRating(false)}
                      style={{
                        padding: '8px 15px',
                        borderRadius: '9px',
                        background: sortByRating ? 'transparent' : 'var(--brand-grad)',
                        color: sortByRating ? 'var(--muted)' : '#fff',
                        fontWeight: sortByRating ? 600 : 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'background .2s cubic-bezier(.2,0,0,1), color .2s cubic-bezier(.2,0,0,1)',
                      }}
                    >
                      Phù hợp nhất
                    </div>
                    <div
                      onClick={() => setSortByRating(true)}
                      style={{
                        padding: '8px 15px',
                        borderRadius: '9px',
                        background: sortByRating ? 'var(--brand-grad)' : 'transparent',
                        color: sortByRating ? '#fff' : 'var(--muted)',
                        fontWeight: sortByRating ? 700 : 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'background .2s cubic-bezier(.2,0,0,1), color .2s cubic-bezier(.2,0,0,1)',
                      }}
                    >
                      ★ Đánh giá
                    </div>
                  </div>
                </div>
              </div>

              {results.length === 0 ? (
                <div className="fade-up" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                  Không tìm thấy bác sĩ phù hợp với bộ lọc.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {results.map((doctor, i) => (
                    <DoctorCard key={doctor.id} doctor={doctor} delayMs={Math.min(i * 40, 320)} onSelectDoctor={onSelectDoctor} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
