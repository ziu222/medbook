import { useState } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { recommendDoctors, type DoctorRecommendation, type RecommendationRead } from '../lib/api';
import { redirectToLogin } from '../lib/auth';
import { avatarColorFor, initialsFor } from '../lib/avatar';
import { toIsoDate } from '../lib/date';

interface AiAssistantPageProps {
  authed: boolean;
  onNavigate: (key: NavKey) => void;
  onSelectDoctor: (id: number) => void;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const sendIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4Z" />
  </svg>
);

const starIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)">
    <path d="m12 3 2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.9 6.9 18.8 8 13 3.7 9l5.8-.7Z" />
  </svg>
);

function aiReplyFor(result: RecommendationRead): string {
  const { classification } = result;
  if (classification.urgent) return classification.emergency_message ?? 'Triệu chứng này cần được cấp cứu ngay.';
  const specialty = classification.specialty_name ?? 'phù hợp';
  return `Dựa trên mô tả, bạn nên khám chuyên khoa ${specialty}. ${classification.reason}`;
}

function DoctorRecommendationCard({ doctor, onSelectDoctor }: { doctor: DoctorRecommendation; onSelectDoctor: (id: number) => void }) {
  const firstSlot = doctor.available_slots[0];
  return (
    <div
      onClick={() => onSelectDoctor(doctor.doctor_id)}
      className="card-hover"
      style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '16px', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '13px',
            background: avatarColorFor(doctor.doctor_id),
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: '15px',
            flexShrink: 0,
          }}
        >
          {initialsFor(doctor.doctor_name)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '15px' }}>{doctor.doctor_name}</div>
          <div style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
            {doctor.specialty_name}
            {doctor.facility_name ? ` · ${doctor.facility_name}` : ''}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '13.5px', color: 'var(--ink2)' }}>
        {starIcon}
        <b style={{ color: 'var(--ink)' }}>{doctor.rating.toFixed(1)}</b>
        {firstSlot && (
          <span
            style={{
              marginLeft: 'auto',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'var(--tint)',
              color: 'var(--brand-d)',
              fontWeight: 700,
              fontSize: '12.5px',
            }}
          >
            Trống {firstSlot.slice(0, 5)} hôm nay
          </span>
        )}
      </div>
      {doctor.factors.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {doctor.factors.map((f) => (
            <span key={f} style={{ padding: '4px 9px', borderRadius: '999px', background: 'var(--tint2)', color: 'var(--muted)', fontSize: '12px' }}>
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiAssistantPage({ authed, onNavigate, onSelectDoctor }: AiAssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Chào bạn 👋 Mình là trợ lý AI của MedBook. Bạn có thể mô tả triệu chứng đang gặp để mình gợi ý đúng chuyên khoa nhé.' },
  ]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RecommendationRead | null>(null);

  const handleSubmit = async () => {
    const description = input.trim();
    if (!description || submitting) return;
    setMessages((prev) => [...prev, { role: 'user', text: description }]);
    setInput('');
    setSubmitting(true);
    try {
      const data = await recommendDoctors(description, toIsoDate(new Date()));
      setResult(data);
      setMessages((prev) => [...prev, { role: 'ai', text: aiReplyFor(data) }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Xin lỗi, mình chưa xử lý được yêu cầu này. Bạn thử mô tả lại nhé.' }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header active="ai" authed={authed} onNavigate={onNavigate} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '26px 32px' }}>
        {!authed ? (
          <div className="fade-up" style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>Đăng nhập để dùng Trợ lý AI.</div>
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
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', display: 'flex', flexDirection: 'column', height: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'var(--brand-grad)' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>Trợ lý sức khỏe AI</div>
                  <div style={{ color: 'var(--forest)', fontSize: '13px' }}>● Đang trực tuyến</div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: m.role === 'user' ? 'var(--brand-grad)' : 'var(--tint2)',
                      color: m.role === 'user' ? '#fff' : 'var(--ink)',
                      fontSize: '14.5px',
                      lineHeight: 1.5,
                    }}
                  >
                    {m.text}
                  </div>
                ))}
                {submitting && (
                  <div style={{ alignSelf: 'flex-start' }}>
                    <LoadingSpinner size={28} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', padding: '16px 22px', borderTop: '1px solid var(--line)' }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Mô tả triệu chứng của bạn..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    fontSize: '14.5px',
                    outline: 'none',
                  }}
                />
                <div
                  onClick={handleSubmit}
                  className={submitting ? undefined : 'btn-hover'}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: submitting ? 'var(--line)' : 'var(--brand-grad)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {sendIcon}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {result ? (
                <>
                  <div
                    style={{
                      background: result.classification.urgent ? '#fdeceb' : 'var(--forest)',
                      color: result.classification.urgent ? '#c0492f' : '#fff',
                      borderRadius: '18px',
                      padding: '20px',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '8px' }}>Phân loại nhóm triệu chứng</div>
                    <div style={{ fontSize: '14px', lineHeight: 1.6 }}>{aiReplyFor(result)}</div>
                  </div>

                  {!result.classification.urgent && (
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '12px' }}>Bác sĩ được gợi ý</div>
                      {result.doctors.length === 0 ? (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Không có bác sĩ trống lịch hôm nay, thử lại vào ngày khác.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {result.doctors.map((d) => (
                            <DoctorRecommendationCard key={d.doctor_id} doctor={d} onSelectDoctor={onSelectDoctor} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '40px 20px' }}>
                  Mô tả triệu chứng ở khung chat để nhận gợi ý chuyên khoa và bác sĩ phù hợp.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
