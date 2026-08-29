import { DoctorShell } from '../../components/Common/DoctorShell';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorOverviewPageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

export function DoctorOverviewPage({ authed, onNavigate }: DoctorOverviewPageProps) {
  return (
    <DoctorShell active="overview" authed={authed} onNavigate={onNavigate}>
      {() => <div style={{ color: 'var(--muted)' }}>Sắp ra mắt.</div>}
    </DoctorShell>
  );
}
