import { useEffect, useState } from 'react';
import { HomePage } from './routes/HomePage';
import { FindDoctorPage } from './routes/FindDoctorPage';
import { DoctorProfilePage } from './routes/DoctorProfilePage';
import { handleAuthCallback, isAuthenticated } from './lib/auth';
import type { NavKey } from './components/Common/Header';

type Screen = 'home' | 'find' | 'doctor';

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

  const onNavigate = (key: NavKey) => setScreen(key === 'find' ? 'find' : 'home');
  const onSelectDoctor = (id: number) => {
    setSelectedDoctorId(id);
    setScreen('doctor');
  };

  if (screen === 'doctor' && selectedDoctorId !== null) {
    return <DoctorProfilePage doctorId={selectedDoctorId} authed={authed} onNavigate={onNavigate} />;
  }
  if (screen === 'find') return <FindDoctorPage authed={authed} onNavigate={onNavigate} onSelectDoctor={onSelectDoctor} />;
  return <HomePage authed={authed} onNavigate={onNavigate} />;
}

export default App
