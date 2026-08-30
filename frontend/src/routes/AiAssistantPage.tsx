import { useState } from 'react';
import { Header, type NavKey } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ApiError, sendChatMessage } from '../lib/api';
import { redirectToLogin } from '../lib/auth';

interface AiAssistantPageProps {
  authed: boolean;
  onNavigate: (key: NavKey) => void;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  toolsUsed?: string[];
}

const sendIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4Z" />
  </svg>
);

const TOOL_LABELS: Record<string, string> = {
  search_doctors: 'Tìm bác sĩ',
  get_doctor_schedule: 'Xem lịch trống',
  get_my_appointments: 'Xem lịch hẹn của bạn',
};

export function AiAssistantPage({ authed, onNavigate }: AiAssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Chào bạn 👋 Mình là trợ lý AI của MedBook. Bạn có thể hỏi mình về triệu chứng, tìm bác sĩ theo chuyên khoa, xem lịch trống hoặc lịch hẹn của bạn.',
    },
  ]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const message = input.trim();
    if (!message || submitting) return;
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');
    setSubmitting(true);
    try {
      const data = await sendChatMessage(message);
      setMessages((prev) => [...prev, { role: 'ai', text: data.reply, toolsUsed: data.tools_used }]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin();
        return;
      }
      const text = err instanceof ApiError ? err.message : 'Xin lỗi, mình chưa xử lý được yêu cầu này. Bạn thử mô tả lại nhé.';
      setMessages((prev) => [...prev, { role: 'ai', text }]);
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
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: m.role === 'user' ? 'var(--brand-grad)' : 'var(--tint2)',
                        color: m.role === 'user' ? '#fff' : 'var(--ink)',
                        fontSize: '14.5px',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.text}
                    </div>
                    {m.toolsUsed && m.toolsUsed.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {m.toolsUsed.map((t) => (
                          <span key={t} style={{ padding: '3px 9px', borderRadius: '999px', background: 'var(--tint)', color: 'var(--brand-d)', fontSize: '11.5px', fontWeight: 700 }}>
                            {TOOL_LABELS[t] ?? t}
                          </span>
                        ))}
                      </div>
                    )}
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
                  placeholder="Nhắn tin cho trợ lý AI..."
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

            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '22px' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '14px' }}>Trợ lý có thể giúp bạn</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--ink2)' }}>
                <div>• Định hướng chuyên khoa dựa trên triệu chứng</div>
                <div>• Tìm bác sĩ theo chuyên khoa và lịch trống</div>
                <div>• Xem lịch hẹn hiện có của bạn</div>
              </div>
              <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '12px', background: '#fdf3e2', color: '#96631a', fontSize: '13px', lineHeight: 1.5 }}>
                Trợ lý không thay thế chẩn đoán y khoa. Nếu có dấu hiệu khẩn cấp, hãy gọi 115 hoặc đến cơ sở cấp cứu gần nhất.
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
