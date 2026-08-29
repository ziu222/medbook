import { DoctorShell } from '../../components/Common/DoctorShell';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorAccountPageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

export function DoctorAccountPage({ authed, onNavigate }: DoctorAccountPageProps) {
  return (
    <DoctorShell active="profile" authed={authed} onNavigate={onNavigate}>
      {() => <div style={{ color: 'var(--muted)' }}>Sắp ra mắt.</div>}
    </DoctorShell>
  );
}
