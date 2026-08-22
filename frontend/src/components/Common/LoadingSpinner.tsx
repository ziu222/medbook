import { Lottie } from 'lottie-react';
import loadingDots from '../../assets/loading-dots.json';

interface LoadingSpinnerProps {
  label?: string;
  size?: number;
}

export function LoadingSpinner({ label, size = 48 }: LoadingSpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <Lottie src={loadingDots} autoplay loop style={{ width: size * 2.5, height: size }} />
      {label && <div style={{ color: 'var(--muted)', fontSize: '14.5px' }}>{label}</div>}
    </div>
  );
}
