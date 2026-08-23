interface LoadingSpinnerProps {
  label?: string;
  size?: number;
}

// Geometry is authored against a 48x48 viewBox and scaled by `size`, so the
// dasharrays below are the real circumferences: 2*pi*18 = 113, 2*pi*21.5 = 135.
const RING_RADIUS = 18;
const OUTER_RADIUS = 21.5;

export function LoadingSpinner({ label, size = 48 }: LoadingSpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }} role="status" aria-live="polite">
      <div style={{ position: 'relative', width: size, height: size }}>
        <div
          className="spinner-halo"
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--tint)' }}
        />
        <svg width={size} height={size} viewBox="0 0 48 48" style={{ position: 'relative', display: 'block' }} aria-hidden="true">
          <circle cx="24" cy="24" r={RING_RADIUS} fill="none" stroke="var(--soft)" strokeWidth="4" />
          <circle
            className="spinner-arc-outer"
            cx="24"
            cy="24"
            r={OUTER_RADIUS}
            fill="none"
            stroke="var(--brand)"
            strokeOpacity="0.38"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10 125"
          />
          <circle
            className="spinner-arc"
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="38 75"
          />
        </svg>
      </div>
      {label && (
        <div className="spinner-label" style={{ color: 'var(--muted)', fontSize: '14.5px' }}>
          {label}
        </div>
      )}
    </div>
  );
}
