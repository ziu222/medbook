import { useState } from 'react';
import { ImageSlot } from '../../components/Common/ImageSlot';
import { feedbackMoods } from '../../lib/mockContent';

const inputStyle = {
  width: '100%',
  border: 'none',
  borderBottom: '1.5px solid var(--line)',
  outline: 'none',
  padding: '10px 2px',
  fontSize: '15px',
  background: 'transparent',
  color: 'var(--ink)',
};

export function FeedbackFormSection() {
  const [moodId, setMoodId] = useState(feedbackMoods[0].id);

  return (
    <section style={{ padding: '64px 0 8px', display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: '52px', alignItems: 'start' }}>
      <div>
        <div style={{ color: 'var(--brand)', fontWeight: 700, fontSize: '14px', letterSpacing: '.3px', textTransform: 'uppercase' }}>
          Chất lượng dịch vụ y tế hàng đầu
        </div>
        <h2 style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-.8px', margin: '12px 0 24px' }}>Đánh giá chất lượng</h2>
        <div className="card-hover-lift" style={{ aspectRatio: '4 / 3', borderRadius: '20px', overflow: 'hidden', background: 'var(--tint)', boxShadow: 'var(--sh)' }}>
          <ImageSlot placeholder="Nhân viên y tế & bệnh nhân" shape="rect" fit="cover" />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '24px', padding: '34px', boxShadow: 'var(--sh-sm)' }}>
        <p style={{ fontSize: '16.5px', color: 'var(--ink2)', lineHeight: 1.6, margin: '0 0 22px' }}>
          Vui lòng cho biết ý kiến của bạn để chúng tôi phục vụ bạn tốt hơn!
        </p>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', marginBottom: '28px' }}>
          {feedbackMoods.map((mood) => {
            const isActive = mood.id === moodId;
            return (
              <span
                key={mood.id}
                onClick={() => setMoodId(mood.id)}
                className="link-hover"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: '11px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? '1.5px solid var(--brand)' : '1.5px solid var(--line)',
                  background: isActive ? 'var(--tint)' : '#fff',
                  color: isActive ? 'var(--brand-d)' : 'var(--ink2)',
                }}
              >
                <span style={{ fontSize: '16px' }}>{mood.emoji}</span>
                {mood.label}
              </span>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '22px', marginBottom: '22px' }}>
          <div style={{ flex: 1 }}>
            <input placeholder="Họ và tên" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <input placeholder="Số điện thoại" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: '22px' }}>
          <input placeholder="Email" style={inputStyle} />
        </div>
        <textarea
          placeholder="Ghi chú"
          rows={3}
          style={{
            width: '100%',
            border: '1.5px solid var(--line)',
            borderRadius: '13px',
            outline: 'none',
            padding: '13px 15px',
            fontSize: '15px',
            resize: 'vertical',
            background: 'transparent',
            color: 'var(--ink)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <span
            className="btn-hover"
            style={{
              padding: '13px 30px',
              borderRadius: '12px',
              background: 'var(--coral)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Gửi ngay
          </span>
        </div>
      </div>
    </section>
  );
}
