import { useEffect, useState } from 'react';
import { HomePage } from './routes/HomePage';
import { FindDoctorPage } from './routes/FindDoctorPage';
import { DoctorProfilePage } from './routes/DoctorProfilePage';
import { MyAppointmentsPage } from './routes/MyAppointmentsPage';
import { PatientProfilePage } from './routes/PatientProfilePage';
import { handleAuthCallback, isAuthenticated } from './lib/auth';
import type { NavKey } from './components/Common/Header';

type Screen = 'home' | 'find' | 'doctor' | 'appointments' | 'profile';

function App() {
  const [onCallback, setOnCallback] = useState(window.location.pathname === '/auth/callback');
  const [authed, setAuthed] = useState(isAuthenticated());
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  useEffect(() => {
    if (!onCallback) return;
    handleAuthCallback()
      .catch((err) => console.error('Đăng nhập thất bại:', err))
      .finally(() => {
        setAuthed(isAuthenticated());
        window.history.replaceState({}, '', '/');
        setOnCallback(false);
      });
  }, [onCallback]);

  if (onCallback) return null;

  const onNavigate = (key: NavKey) => setScreen(key === 'find' || key === 'appointments' || key === 'profile' ? key : 'home');
  const onSelectDoctor = (id: number) => {
    setSelectedDoctorId(id);
    setScreen('doctor');
  };

  if (screen === 'doctor' && selectedDoctorId !== null) {
    return <DoctorProfilePage doctorId={selectedDoctorId} authed={authed} onNavigate={onNavigate} />;
  }
  if (screen === 'profile') return <PatientProfilePage authed={authed} onNavigate={onNavigate} />;
  if (screen === 'appointments') return <MyAppointmentsPage authed={authed} onNavigate={onNavigate} onSelectDoctor={onSelectDoctor} />;
  if (screen === 'find') return <FindDoctorPage authed={authed} onNavigate={onNavigate} onSelectDoctor={onSelectDoctor} />;
  return <HomePage authed={authed} onNavigate={onNavigate} />;
}

export default App
