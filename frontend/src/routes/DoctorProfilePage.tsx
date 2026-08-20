import { useEffect, useState } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { bookAppointment, fetchAvailability, fetchDoctor, startPayment, type AvailabilitySlot, type DoctorDetail } from '../lib/api';
import { redirectToLogin } from '../lib/auth';
import { avatarColorFor, initialsFor } from '../lib/avatar';
import { BOOKING_FEE_VND, formatVnd } from '../lib/pricing';

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

export function DoctorProfilePage({ doctorId, authed, onNavigate }: DoctorProfilePageProps) {
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [dates] = useState(() => upcomingDates(4));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const payment = await startPayment(appointment.id);
      window.location.assign(payment.checkout_url);
    } catch (err) {
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
                      {doctor.clinic_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink2)' }}>
                          {clinicIcon}
                          {doctor.clinic_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {doctor.bio && <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--ink2)', margin: '24px 0 0' }}>{doctor.bio}</p>}
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
