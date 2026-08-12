interface SpecialtyChip {
  label: string;
  emphasis?: boolean;
}

const CHIPS: SpecialtyChip[] = [{ label: 'Tim mạch' }, { label: 'Thần kinh' }, { label: 'Nhi khoa' }, { label: 'Hỏi trợ lý AI', emphasis: true }];

export function HeroSection() {
  return (
    <section style={{ textAlign: 'center', padding: '56px 0 30px', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '20px',
          transform: 'translateX(-50%)',
          width: '520px',
          height: '300px',
          background: 'radial-gradient(ellipse, var(--peach), transparent 65%)',
          opacity: 0.6,
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--soft)',
            color: 'var(--brand-d)',
            fontWeight: 700,
            fontSize: '13.5px',
            padding: '8px 16px',
            borderRadius: '999px',
          }}
        >
          Nền tảng y tế số tin cậy
        </div>

        <h1 style={{ fontSize: '60px', lineHeight: 1.05, fontWeight: 800, letterSpacing: '-1.6px', margin: '22px auto 0', maxWidth: '820px' }}>
          Tìm đúng bác sĩ.
          <br />
          <span style={{ color: 'var(--brand)' }}>Đặt lịch trong vài phút.</span>
        </h1>
        <p style={{ fontSize: '18.5px', lineHeight: 1.6, color: 'var(--ink2)', maxWidth: '560px', margin: '20px auto 30px' }}>
          Mô tả triệu chứng — trợ lý AI gợi ý đúng chuyên khoa và bác sĩ phù hợp với bạn.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: '10px',
            maxWidth: '660px',
            margin: '0 auto',
            boxShadow: 'var(--sh)',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '11px', padding: '8px 14px' }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4-4" />
            </svg>
            <input
              placeholder="Triệu chứng, bác sĩ, chuyên khoa…"
              style={{ border: 'none', outline: 'none', fontSize: '16px', width: '100%', background: 'transparent' }}
            />
          </div>
          <span
            style={{
              padding: '14px 30px',
              borderRadius: '13px',
              background: 'var(--brand-grad)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Tìm
          </span>
        </div>

        <div style={{ display: 'flex', gap: '9px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
          {CHIPS.map((chip) =>
            chip.emphasis ? (
              <span
                key={chip.label}
                style={{
                  padding: '9px 17px',
                  borderRadius: '999px',
                  background: 'var(--forest)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  gap: '7px',
                  alignItems: 'center',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7BE3B8" strokeWidth="2">
                  <rect x="5" y="4" width="14" height="16" rx="3" />
                  <path d="M9 9h6M9 13h4" />
                </svg>
                {chip.label}
              </span>
            ) : (
              <span
                key={chip.label}
                style={{
                  padding: '9px 17px',
                  borderRadius: '999px',
                  background: '#fff',
                  border: '1px solid var(--line)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--ink2)',
                }}
              >
                {chip.label}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
