import { DoctorShell } from '../../components/Common/DoctorShell';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorSchedulePageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

export function DoctorSchedulePage({ authed, onNavigate }: DoctorSchedulePageProps) {
  return (
    <DoctorShell active="schedule" authed={authed} onNavigate={onNavigate}>
      {() => <div style={{ color: 'var(--muted)' }}>Sắp ra mắt.</div>}
    </DoctorShell>
  );
}
