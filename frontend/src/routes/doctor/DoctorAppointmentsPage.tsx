import { DoctorShell } from '../../components/Common/DoctorShell';
import type { DoctorNavKey } from '../../lib/doctorRoutes';

interface DoctorAppointmentsPageProps {
  authed: boolean;
  onNavigate: (key: DoctorNavKey) => void;
}

export function DoctorAppointmentsPage({ authed, onNavigate }: DoctorAppointmentsPageProps) {
  return (
    <DoctorShell active="appointments" authed={authed} onNavigate={onNavigate}>
      {() => <div style={{ color: 'var(--muted)' }}>Sắp ra mắt.</div>}
    </DoctorShell>
  );
}
