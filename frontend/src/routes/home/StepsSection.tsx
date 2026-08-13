interface Step {
  number: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { number: 1, title: 'Tìm bác sĩ', description: 'Tìm theo chuyên khoa hoặc để AI gợi ý theo triệu chứng.' },
  { number: 2, title: 'Chọn lịch trống', description: 'Xem hồ sơ, đánh giá và chọn khung giờ phù hợp.' },
  { number: 3, title: 'Xác nhận & khám', description: 'Nhận xác nhận, nhắc lịch tự động và tới khám.' },
];

export function StepsSection() {
  return (
    <section style={{ padding: '56px 0 20px' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--sand), #fff)', border: '1px solid var(--line)', borderRadius: '26px', padding: '46px 40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-.6px', textAlign: 'center', margin: '0 0 34px' }}>
          Đặt lịch chỉ với 3 bước
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '26px' }}>
          {STEPS.map((step) => (
            <div key={step.number} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'var(--tint)',
                  color: 'var(--brand)',
                  fontWeight: 800,
                  fontSize: '22px',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                {step.number}
              </div>
              <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '7px' }}>{step.title}</div>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.55, margin: 0 }}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
