import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { HomePage } from './routes/HomePage';
import { FindDoctorPage } from './routes/FindDoctorPage';
import { DoctorProfilePage } from './routes/DoctorProfilePage';
import { MyAppointmentsPage } from './routes/MyAppointmentsPage';
import { PatientProfilePage } from './routes/PatientProfilePage';
import { SpecialtiesPage } from './routes/SpecialtiesPage';
import { SpecialtyDetailPage } from './routes/SpecialtyDetailPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { handleAuthCallback, isAuthenticated } from './lib/auth';
import { PATHS, doctorPath, pathForNavKey } from './lib/routes';
import type { NavKey } from './components/Common/Header';

type Screen = 'find' | 'appointments' | 'profile' | 'specialties' | 'specialty';

/**
 * Screens still driven by local state rather than the URL. Each one moves out to a real route in
 * turn; this shrinks as that happens and gets deleted once the last one is gone.
 */
function LegacyScreens({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('find');
  const [selectedSpecialtySlug, setSelectedSpecialtySlug] = useState<string | null>(null);

  const onNavigate = (key: NavKey) => {
    if (key === 'home' || key === 'ai') {
      navigate(pathForNavKey(key));
      return;
    }
    setScreen(key as Screen);
  };
  const onSelectSpecialty = (slug: string) => {
    setSelectedSpecialtySlug(slug);
    setScreen('specialty');
    window.scrollTo({ top: 0 });
  };
  const onSelectDoctor = (id: number) => navigate(doctorPath(id));

  if (screen === 'specialty' && selectedSpecialtySlug !== null) {
    return (
      <SpecialtyDetailPage
        slug={selectedSpecialtySlug}
        authed={authed}
        onNavigate={onNavigate}
        onSelectSpecialty={onSelectSpecialty}
        onSelectDoctor={onSelectDoctor}
      />
    );
  }
  if (screen === 'specialties') return <SpecialtiesPage authed={authed} onNavigate={onNavigate} onSelectSpecialty={onSelectSpecialty} />;
  if (screen === 'profile') return <PatientProfilePage authed={authed} onNavigate={onNavigate} />;
  if (screen === 'appointments') return <MyAppointmentsPage authed={authed} onNavigate={onNavigate} onSelectDoctor={onSelectDoctor} />;
  return <FindDoctorPage authed={authed} onNavigate={onNavigate} onSelectDoctor={onSelectDoctor} />;
}

function DoctorProfile({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const doctorId = Number(id);
  if (!Number.isInteger(doctorId) || doctorId < 1) return <NotFoundPage authed={authed} />;
  return <DoctorProfilePage doctorId={doctorId} authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} />;
}

function Home({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  return <HomePage authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} />;
}

function App() {
  const [onCallback, setOnCallback] = useState(window.location.pathname === '/auth/callback');
  const [authed, setAuthed] = useState(isAuthenticated());

  useEffect(() => {
    if (!onCallback) return;
    handleAuthCallback()
      .catch((err) => console.error('Đăng nhập thất bại:', err))
      .finally(() => {
        setAuthed(isAuthenticated());
        window.history.replaceState({}, '', PATHS.home);
        setOnCallback(false);
      });
  }, [onCallback]);

  if (onCallback) return null;

  return (
    <Routes>
      <Route path={PATHS.home} element={<Home authed={authed} />} />
      <Route path="/bac-si/:id" element={<DoctorProfile authed={authed} />} />
      <Route path="*" element={<LegacyScreens authed={authed} />} />
    </Routes>
  );
}

export default App
