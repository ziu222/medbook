import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ApiError, bookAppointment, fetchAvailability, fetchDoctor, startPayment, type AvailabilitySlot, type DoctorDetail } from '../lib/api';
import { redirectToLogin } from '../lib/auth';
import { avatarColorFor, initialsFor } from '../lib/avatar';
import { doctorReviewCount, doctorReviews } from '../lib/mockContent';
import { BOOKING_FEE_VND, formatVnd } from '../lib/pricing';

const HOSPITAL_ADDRESS = '786 Nguyễn Kiệm, TP. Hồ Chí Minh';

interface DoctorProfilePageProps {
  doctorId: number;
  authed: boolean;
  onNavigate: (key: NavKey) => void;
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });

function upcomingDates(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const starIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="var(--gold)">
    <path d="m12 3 2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.9 6.9 18.8 8 13 3.7 9l5.8-.7Z" />
  </svg>
);

const checkFilledIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--brand)">
    <circle cx="12" cy="12" r="10" />
    <path d="m8.5 12 2.3 2.3 4.7-4.6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </svg>
);

const clinicIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 8h.01M15 8h.01M10 21v-3h4v3" />
  </svg>
);

const shieldIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
    <path d="M12 3 5 6v5c0 5 3.4 8.5 7 10 3.6-1.5 7-5 7-10V6Z" />
    <path d="m9 12 2 2 4-4" strokeLinecap="round" />
  </svg>
);

const reviewIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2">
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6M15 11a3 3 0 1 0 0-6M21 20c0-2.4-1.7-4.5-4-5.4" />
  </svg>
);

const specialtyPath = (
  <>
    <circle cx="9" cy="8" r="3" />
    <path d="M6 21a5 5 0 0 1 10 0M17 10a2 2 0 1 0 0-4" />
  </>
);

const experiencePath = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.3l3.3 2" strokeLinecap="round" />
  </>
);

const pinPath = (
  <>
    <path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </>
);

const buildingPath = (
  <>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 8h.01M15 8h.01M10 21v-3h4v3" />
  </>
);

const starPath = <path d="m12 3 2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.9 6.9 18.8 8 13 3.7 9l5.8-.7Z" />;

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'about', label: 'Giới thiệu' },
  { key: 'experience', label: 'Kinh nghiệm' },
  { key: 'reviews', label: 'Đánh giá' },
];

const tileIcon = (path: ReactNode) => (
  <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#fff', display: 'grid', placeItems: 'center', marginBottom: '12px' }}>
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
      {path}
    </svg>
  </div>
);

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: 'var(--tint2)', borderRadius: '16px', padding: '18px' }}>
      {tileIcon(icon)}
      <div style={{ color: 'var(--muted)', fontSize: '13.5px' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '15.5px' }}>{value}</div>
    </div>
  );
}

const TABS = ['about', 'experience', 'reviews'] as const;
type Tab = (typeof TABS)[number];

/**
 * The backend stores one average rating per doctor, not per-star counts. Split the bar chart
 * across the two integers the average sits between — 4.2 becomes 20% five-star, 80% four-star —
 * so the bars always add back up to the score shown next to them.
 */
function ratingBars(rating: number): { star: number; percent: number }[] {
  const lower = Math.floor(rating);
  const fraction = rating - lower;
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    percent: star === lower + 1 ? Math.round(fraction * 100) : star === lower ? Math.round((1 - fraction) * 100) : 0,
  }));
}

function ReviewsCard({ rating }: { rating: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '22px', padding: '30px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 22px' }}>Đánh giá từ bệnh nhân</h2>
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1 }}>{rating.toFixed(1)}</div>
          <div style={{ color: 'var(--gold)', fontSize: '15px', letterSpacing: '2px' }}>{'★'.repeat(Math.round(rating))}</div>
          <div style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>{doctorReviewCount} đánh giá</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ratingBars(rating).map(({ star, percent }) => (
            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13.5px', color: 'var(--muted)' }}>
              <span style={{ width: '10px' }}>{star}</span>
              <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'var(--tint)' }}>
                <div style={{ width: `${percent}%`, height: '8px', borderRadius: '999px', background: 'var(--gold)' }} />
              </div>
              <span style={{ width: '34px', textAlign: 'right' }}>{percent}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: '1px', background: 'var(--line)', marginBottom: '20px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {doctorReviews.map((review, i) => (
          <div key={review.author} style={{ display: 'flex', gap: '13px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: avatarColorFor(i + 1),
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: '15px',
                flexShrink: 0,
              }}
            >
              {initialsFor(review.author)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <b style={{ fontSize: '15.5px' }}>{review.author}</b>
                <span style={{ color: 'var(--gold)', fontSize: '12px' }}>{'★'.repeat(review.stars)}</span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--ink2)', fontSize: '15px', lineHeight: 1.55 }}>{review.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoctorProfilePage({ doctorId, authed, onNavigate }: DoctorProfilePageProps) {
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [dates] = useState(() => upcomingDates(4));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [tab, setTab] = useState<Tab>('about');
  const reviewsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDoctor(doctorId)
      .then(setDoctor)
      .catch(() => setDoctor(null));
  }, [doctorId]);

  useEffect(() => {
    if (!selectedDate) return;
    setSelectedSlot(null);
    fetchAvailability(doctorId, toIsoDate(selectedDate))
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [doctorId, selectedDate]);

  const canConfirm = selectedDate !== null && selectedSlot !== null && symptoms.trim().length > 0 && !submitting;

  const handleConfirm = async () => {
    if (!authed) {
      redirectToLogin();
      return;
    }
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await bookAppointment({
        doctorId,
        appointmentDate: toIsoDate(selectedDate),
        startTime: selectedSlot.start_time,
        symptoms: symptoms.trim(),
      });
      await startPayment(appointment.id);
      onNavigate('appointments');
    } catch (err) {
      // The API rejects booking until the account has a profile row. Say so in Vietnamese and
      // point at the page that fixes it, instead of surfacing the raw backend string.
      if (err instanceof ApiError && err.status === 409 && err.message.includes('user profile')) {
        setNeedsProfile(true);
        setSubmitting(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Đặt lịch thất bại, vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  if (!doctor) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Header active="find" authed={authed} onNavigate={onNavigate} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 32px', display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner label="Đang tải hồ sơ bác sĩ..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header active="find" authed={authed} onNavigate={onNavigate} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ padding: '26px 0' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
            <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
              Trang chủ
            </span>{' '}
            /{' '}
            <span onClick={() => onNavigate('find')} style={{ cursor: 'pointer' }}>
              {doctor.specialty.name}
            </span>{' '}
            / <b style={{ color: 'var(--ink)' }}>{doctor.display_name}</b>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '28px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* profile card */}
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '22px', padding: '30px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '26px',
                      background: avatarColorFor(doctor.id),
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '40px',
                      flexShrink: 0,
                      boxShadow: 'var(--sh)',
                    }}
                  >
                    {initialsFor(doctor.display_name)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-.6px', margin: 0 }}>{doctor.display_name}</h1>
                      {checkFilledIcon}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '16px', margin: '6px 0 16px' }}>
                      Chuyên khoa {doctor.specialty.name} · {doctor.years_experience} năm kinh nghiệm
                    </div>
                    <div style={{ display: 'flex', gap: '26px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {starIcon}
                        <b style={{ fontSize: '17px' }}>{doctor.rating.toFixed(1)}</b>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink2)' }}>
                        {reviewIcon}
                        <b>{doctorReviewCount}</b> đánh giá
                      </div>
                      {doctor.clinic_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink2)' }}>
                          {clinicIcon}
                          {doctor.clinic_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '28px', borderBottom: '1px solid var(--line)', margin: '24px 0 20px' }}>
                  {TAB_LABELS.map(({ key, label }) => (
                    <div
                      key={key}
                      onClick={() => {
                        setTab(key);
                        if (key === 'reviews') reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      style={{
                        paddingBottom: '12px',
                        borderBottom: key === tab ? '2.5px solid var(--brand)' : 'none',
                        color: key === tab ? 'var(--brand)' : 'var(--muted)',
                        fontWeight: key === tab ? 700 : 600,
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      {key === 'reviews' ? `${label} (${doctorReviewCount})` : label}
                    </div>
                  ))}
                </div>

                {tab === 'experience' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    <InfoTile icon={experiencePath} label="Số năm kinh nghiệm" value={`${doctor.years_experience} năm`} />
                    <InfoTile icon={specialtyPath} label="Chuyên khoa" value={doctor.specialty.name} />
                    <InfoTile icon={buildingPath} label="Nơi công tác" value={doctor.clinic_name ?? 'Bệnh viện Quân y 175'} />
                    <InfoTile icon={starPath} label="Đánh giá trung bình" value={`${doctor.rating.toFixed(1)} / 5`} />
                  </div>
                ) : (
                  <>
                    {doctor.bio && <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--ink2)', margin: '0 0 22px' }}>{doctor.bio}</p>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <InfoTile icon={specialtyPath} label="Chuyên môn" value={doctor.specialty.name} />
                      <InfoTile icon={experiencePath} label="Kinh nghiệm" value={`${doctor.years_experience} năm`} />
                      <InfoTile icon={pinPath} label="Địa chỉ" value={HOSPITAL_ADDRESS} />
                    </div>
                  </>
                )}
              </div>

              <div ref={reviewsRef}>
                <ReviewsCard rating={doctor.rating} />
              </div>
            </div>

            {/* booking card */}
            <aside style={{ position: 'sticky', top: '96px', background: '#fff', border: '1px solid var(--line)', borderRadius: '22px', padding: '26px', boxShadow: 'var(--sh)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>Đặt lịch khám</div>
              <div style={{ color: 'var(--muted)', fontSize: '15px', margin: '6px 0 22px' }}>
                Phí đặt lịch <b style={{ color: 'var(--ink)' }}>{formatVnd(BOOKING_FEE_VND)}</b>
              </div>

              <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '11px' }}>Chọn ngày</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '22px' }}>
                {dates.map((d) => {
                  const isSelected = selectedDate !== null && toIsoDate(d) === toIsoDate(selectedDate);
                  return (
                    <div
                      key={toIsoDate(d)}
                      onClick={() => setSelectedDate(d)}
                      className={`mood-pill${isSelected ? ' active' : ''}`}
                      style={{
                        textAlign: 'center',
                        padding: '10px 4px',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--brand-grad)' : '#fff',
                        border: isSelected ? 'none' : '1.5px solid var(--line)',
                        color: isSelected ? '#fff' : 'var(--ink2)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '12.5px', opacity: 0.8 }}>{WEEKDAY_FORMAT.format(d)}</div>
                      <div style={{ fontWeight: 800, fontSize: '19px' }}>{String(d.getDate()).padStart(2, '0')}</div>
                    </div>
                  );
                })}
              </div>

              {selectedDate && (
                <>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '11px' }}>
                    Khung giờ · {String(selectedDate.getDate()).padStart(2, '0')}/{String(selectedDate.getMonth() + 1).padStart(2, '0')}
                  </div>
                  {slots.length === 0 ? (
                    <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px' }}>Không có khung giờ trống ngày này.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.start_time === slot.start_time;
                        return (
                          <div
                            key={slot.start_time}
                            onClick={() => setSelectedSlot(slot)}
                            className={`mood-pill${isSelected ? ' active' : ''}`}
                            style={{
                              textAlign: 'center',
                              padding: '10px 4px',
                              borderRadius: '10px',
                              background: isSelected ? 'var(--brand-grad)' : '#fff',
                              border: isSelected ? 'none' : '1.5px solid var(--line)',
                              color: isSelected ? '#fff' : 'var(--ink2)',
                              fontWeight: 600,
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            {slot.start_time.slice(0, 5)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {selectedSlot && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '8px' }}>Triệu chứng</div>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Mô tả ngắn gọn triệu chứng của bạn"
                    rows={3}
                    style={{
                      width: '100%',
                      border: '1.5px solid var(--line)',
                      borderRadius: '13px',
                      outline: 'none',
                      padding: '12px 14px',
                      fontSize: '14.5px',
                      resize: 'vertical',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
              )}

              {error && <div style={{ color: '#d9573f', fontSize: '13.5px', marginBottom: '14px' }}>{error}</div>}

              {needsProfile && (
                <div className="fade-up" style={{ background: 'var(--sand)', border: '1px solid var(--peach)', borderRadius: '14px', padding: '15px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--ink2)', lineHeight: 1.55, marginBottom: '12px' }}>
                    Bạn cần hoàn tất hồ sơ cá nhân trước khi đặt lịch — bệnh viện cần họ tên và số điện thoại để xác nhận.
                  </div>
                  <div
                    onClick={() => onNavigate('profile')}
                    className="btn-hover"
                    style={{ textAlign: 'center', padding: '11px', borderRadius: '11px', background: 'var(--brand-grad)', color: '#fff', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer' }}
                  >
                    Hoàn tất hồ sơ
                  </div>
                </div>
              )}

              <div
                onClick={canConfirm ? handleConfirm : undefined}
                className={canConfirm ? 'btn-hover' : undefined}
                style={{
                  textAlign: 'center',
                  padding: '15px',
                  borderRadius: '14px',
                  background: canConfirm ? 'var(--brand-grad)' : 'var(--line)',
                  color: canConfirm ? '#fff' : 'var(--faint)',
                  fontWeight: 700,
                  fontSize: '16px',
                  cursor: canConfirm ? 'pointer' : 'not-allowed',
                  boxShadow: canConfirm ? 'var(--sh-sm)' : 'none',
                }}
              >
                {submitting ? 'Đang xử lý...' : authed ? 'Xác nhận đặt lịch' : 'Đăng nhập để đặt lịch'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', color: 'var(--muted)', fontSize: '13px', marginTop: '14px' }}>
                {shieldIcon}
                Bảo mật thông tin · miễn phí hủy trước 24h
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
