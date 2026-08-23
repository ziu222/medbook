import { useEffect, useState, type ReactNode } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ImageSlot } from '../components/Common/ImageSlot';
import { fetchDoctors, fetchSpecialties, type DoctorSummary, type Specialty } from '../lib/api';
import { avatarColorFor, initialsFor } from '../lib/avatar';
import { infraTabs } from '../lib/mockContent';
import { BOOKING_FEE_VND, formatVnd } from '../lib/pricing';
import { copyFor, DEPARTMENT_FUNCTIONS } from '../lib/specialtyContent';

interface SpecialtyDetailPageProps {
  slug: string;
  authed: boolean;
  onNavigate: (key: NavKey) => void;
  onSelectSpecialty: (slug: string) => void;
  onSelectDoctor: (id: number) => void;
}

// Hospital-level contact, from the footer. Per-department location and extension are not in the API.
const CONTACT = {
  location: '786 Nguyễn Kiệm, Phường Hạnh Thông, TP. Hồ Chí Minh',
  phone: '1900 1175',
  hours: 'Thứ 2 – Thứ 7, 07:00 – 16:30',
};

/**
 * Banner image. There is no per-department photo anywhere, so this reuses the hospital
 * infrastructure shots already in the repo and labels them as what they are — a picture of the
 * hospital, not a claim about this department's team.
 */
function bannerFor(specialtyId: number): string {
  const pool = infraTabs.flatMap((tab) => tab.images);
  return pool[specialtyId % pool.length];
}

const chevron = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.5 }}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <>
      <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-.6px', margin: '44px 0 4px' }}>{children}</h2>
      <div style={{ width: '44px', height: '3px', background: 'var(--coral)', borderRadius: '2px', marginBottom: '20px' }} />
    </>
  );
}

function StatCell({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ background: '#fff', padding: '22px 20px' }}>
      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.7px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.7px', color: 'var(--ink)', marginTop: '6px' }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{note}</div>
    </div>
  );
}

function DoctorCard({ doctor, onOpen }: { doctor: DoctorSummary; onOpen: () => void }) {
  return (
    <div onClick={onOpen} className="card-hover" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer' }}>
      <div
        style={{
          height: '210px',
          background: avatarColorFor(doctor.id),
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: '46px',
        }}
      >
        {initialsFor(doctor.display_name)}
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.7px' }}>
          {doctor.years_experience} năm kinh nghiệm
        </div>
        <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-.3px', marginTop: '6px' }}>{doctor.display_name}</div>
        <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.5 }}>
          {doctor.clinic_name ?? 'Bệnh viện Quân y 175'} · ★ {doctor.rating.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

export function SpecialtyDetailPage({ slug, authed, onNavigate, onSelectSpecialty, onSelectDoctor }: SpecialtyDetailPageProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const specialty = specialties.find((s) => s.slug === slug);

  useEffect(() => {
    setLoading(true);
    fetchSpecialties()
      .then((specs) => {
        setSpecialties(specs);
        const match = specs.find((s) => s.slug === slug);
        return match ? fetchDoctors({ limit: 100, specialtyId: match.id }) : [];
      })
      .then(setDoctors)
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Header active="specialties" authed={authed} onNavigate={onNavigate} />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 32px' }}>
          <LoadingSpinner label="Đang tải chuyên khoa..." />
        </div>
      </div>
    );
  }

  if (!specialty) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Header active="specialties" authed={authed} onNavigate={onNavigate} />
        <div style={{ textAlign: 'center', padding: '100px 32px', color: 'var(--muted)' }}>
          Không tìm thấy chuyên khoa này.
          <div onClick={() => onNavigate('specialties')} style={{ color: 'var(--brand)', fontWeight: 700, cursor: 'pointer', marginTop: '12px' }}>
            Quay lại danh mục
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const copy = copyFor(specialty.slug);
  const avgRating = doctors.length ? doctors.reduce((sum, d) => sum + d.rating, 0) / doctors.length : 0;
  const avgYears = doctors.length ? Math.round(doctors.reduce((sum, d) => sum + d.years_experience, 0) / doctors.length) : 0;
  const others = specialties.filter((s) => s.slug !== slug);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header active="specialties" authed={authed} onNavigate={onNavigate} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ padding: '26px 0 70px' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '26px' }}>
            <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
              Trang chủ
            </span>{' '}
            /{' '}
            <span onClick={() => onNavigate('specialties')} style={{ cursor: 'pointer' }}>
              Chuyên khoa
            </span>{' '}
            / <b style={{ color: 'var(--ink)' }}>{specialty.name}</b>
          </div>

          {/* hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '48px', alignItems: 'end', paddingBottom: '30px' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--coral)',
                  textTransform: 'uppercase',
                  letterSpacing: '.9px',
                  marginBottom: '14px',
                }}
              >
                <span style={{ width: '22px', height: '2px', background: 'var(--coral)' }} />
                Chuyên khoa
              </div>
              <h1 style={{ fontSize: '46px', lineHeight: 1.08, fontWeight: 800, letterSpacing: '-1.4px', margin: 0 }}>{specialty.name}</h1>
              <p style={{ fontSize: '17.5px', lineHeight: 1.6, color: 'var(--ink2)', margin: '16px 0 0' }}>{copy.blurb}</p>
              <div
                onClick={() => onNavigate('find')}
                className="btn-hover cta-arrow-slide"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  marginTop: '24px',
                  padding: '13px 24px',
                  borderRadius: '13px',
                  background: 'var(--brand-grad)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '15.5px',
                  cursor: 'pointer',
                  boxShadow: 'var(--sh-sm)',
                }}
              >
                Đặt lịch khám khoa này
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: 'var(--line)', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--line)' }}>
              <StatCell label="Bác sĩ" value={String(doctors.length)} note="đang nhận lịch khám" />
              <StatCell label="Đánh giá TB" value={doctors.length ? avgRating.toFixed(1) : '—'} note="trên thang 5" />
              <StatCell label="Kinh nghiệm TB" value={doctors.length ? `${avgYears} năm` : '—'} note="của bác sĩ trong khoa" />
              <StatCell label="Phí đặt lịch" value={formatVnd(BOOKING_FEE_VND)} note="mọi chuyên khoa" />
            </div>
          </div>

          <div style={{ height: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--sh)', marginBottom: '52px' }}>
            <ImageSlot src={bannerFor(specialty.id)} placeholder="Bệnh viện Quân y 175" shape="rect" fit="cover" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '56px', alignItems: 'start' }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-.6px', margin: '0 0 4px' }}>Giới thiệu</h2>
              <div style={{ width: '44px', height: '3px', background: 'var(--coral)', borderRadius: '2px', marginBottom: '18px' }} />
              {(copy.intro ?? [copy.blurb]).map((paragraph) => (
                <p key={paragraph.slice(0, 40)} style={{ fontSize: '16.5px', lineHeight: 1.75, color: 'var(--ink2)', margin: '0 0 15px' }}>
                  {paragraph}
                </p>
              ))}

              <SectionHeading>Bác sĩ chuyên khoa</SectionHeading>
              {doctors.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '15.5px' }}>Chuyên khoa này chưa có bác sĩ nhận lịch khám trực tuyến.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                  {doctors.slice(0, 6).map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} onOpen={() => onSelectDoctor(doctor.id)} />
                  ))}
                </div>
              )}

              <SectionHeading>Chức năng &amp; nhiệm vụ</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {DEPARTMENT_FUNCTIONS.map((fn) => (
                  <div key={fn} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: 'var(--tint2)', borderRadius: '14px', padding: '16px 18px' }}>
                    <span style={{ width: '24px', height: '24px', flexShrink: 0, borderRadius: '8px', background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', marginTop: '1px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--ink2)' }}>{fn}</span>
                  </div>
                ))}
              </div>

              {copy.equipment && copy.equipment.length > 0 && (
                <>
                  <SectionHeading>Máy móc / Trang thiết bị</SectionHeading>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {copy.equipment.map((item) => (
                      <div key={item} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#fff', border: '1px solid var(--line)', borderRadius: '14px', padding: '15px 17px' }}>
                        <span style={{ width: '7px', height: '7px', flexShrink: 0, borderRadius: '50%', background: 'var(--coral)', marginTop: '8px' }} />
                        <span style={{ fontSize: '15.5px', lineHeight: 1.55, color: 'var(--ink2)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {copy.techniques && copy.techniques.length > 0 && (
                <>
                  <SectionHeading>Kỹ thuật mũi nhọn</SectionHeading>
                  <div style={{ background: 'var(--forest)', borderRadius: '22px', padding: '30px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 30px' }}>
                    {copy.techniques.map((item) => (
                      <div key={item} style={{ display: 'flex', gap: '13px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.09)' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6FBF9C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px' }}>
                          <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4Z" />
                        </svg>
                        <span style={{ fontSize: '15.5px', lineHeight: 1.55, color: 'rgba(255,255,255,.9)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* side rail */}
            <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '14px' }}>
                  Liên hệ bệnh viện
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11Z" />
                      <circle cx="12" cy="10" r="2.6" />
                    </svg>
                    <span style={{ fontSize: '14.5px', lineHeight: 1.55, color: 'var(--ink2)' }}>{CONTACT.location}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '11px', alignItems: 'center' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <path d="M4 5c0 8 7 15 15 15l2-4-4-2-2 2c-3-1.5-5.5-4-7-7l2-2-2-4Z" />
                    </svg>
                    <span style={{ fontSize: '14.5px', color: 'var(--ink2)' }}>{CONTACT.phone}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '11px', alignItems: 'center' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3.5 2" />
                    </svg>
                    <span style={{ fontSize: '14.5px', color: 'var(--ink2)' }}>{CONTACT.hours}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '12px' }}>
                  Chuyên khoa khác
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {others.map((other) => (
                    <div
                      key={other.id}
                      onClick={() => onSelectSpecialty(other.slug)}
                      className="link-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '11px 0',
                        borderTop: '1px solid var(--line)',
                        cursor: 'pointer',
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: 'var(--ink2)',
                      }}
                    >
                      {other.name}
                      {chevron}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
