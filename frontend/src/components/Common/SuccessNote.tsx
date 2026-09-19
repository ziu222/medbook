export function SuccessNote({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        className="check-pop"
        style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--brand-grad)', display: 'grid', placeItems: 'center', flexShrink: 0 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4.5 4.5L19 7" />
        </svg>
      </div>
      <div style={{ color: 'var(--brand-d)', fontSize: '13.5px', fontWeight: 600 }}>{text}</div>
    </div>
  );
}
