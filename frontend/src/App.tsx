import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { HomePage } from './routes/HomePage';
import { FindDoctorPage } from './routes/FindDoctorPage';
import { DoctorProfilePage } from './routes/DoctorProfilePage';
import { MyAppointmentsPage } from './routes/MyAppointmentsPage';
import { PatientProfilePage } from './routes/PatientProfilePage';
import { SpecialtiesPage } from './routes/SpecialtiesPage';
import { SpecialtyDetailPage } from './routes/SpecialtyDetailPage';
import { AiAssistantPage } from './routes/AiAssistantPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { ScrollToTop } from './components/Common/ScrollToTop';
import { handleAuthCallback, isAuthenticated } from './lib/auth';
import { PATHS, doctorPath, pathForNavKey, specialtyPath } from './lib/routes';

function PatientProfile({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  return <PatientProfilePage authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} />;
}

function MyAppointments({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  return (
    <MyAppointmentsPage authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} onSelectDoctor={(id) => navigate(doctorPath(id))} />
  );
}

function Specialties({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  return (
    <SpecialtiesPage
      authed={authed}
      onNavigate={(key) => navigate(pathForNavKey(key))}
      onSelectSpecialty={(slug) => navigate(specialtyPath(slug))}
    />
  );
}

function SpecialtyDetail({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  const { slug } = useParams();
  if (!slug) return <NotFoundPage authed={authed} />;
  return (
    <SpecialtyDetailPage
      slug={slug}
      authed={authed}
      onNavigate={(key) => navigate(pathForNavKey(key))}
      onSelectSpecialty={(next) => navigate(specialtyPath(next))}
      onSelectDoctor={(id) => navigate(doctorPath(id))}
    />
  );
}

function DoctorProfile({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const doctorId = Number(id);
  if (!Number.isInteger(doctorId) || doctorId < 1) return <NotFoundPage authed={authed} />;
  return <DoctorProfilePage doctorId={doctorId} authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} />;
}

function FindDoctor({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  return <FindDoctorPage authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} onSelectDoctor={(id) => navigate(doctorPath(id))} />;
}

function Home({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  return <HomePage authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} />;
}

function AiAssistant({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  return <AiAssistantPage authed={authed} onNavigate={(key) => navigate(pathForNavKey(key))} onSelectDoctor={(id) => navigate(doctorPath(id))} />;
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
    <>
      <ScrollToTop />
      <Routes>
        <Route path={PATHS.home} element={<Home authed={authed} />} />
        <Route path={PATHS.find} element={<FindDoctor authed={authed} />} />
        <Route path="/bac-si/:id" element={<DoctorProfile authed={authed} />} />
        <Route path={PATHS.specialties} element={<Specialties authed={authed} />} />
        <Route path="/chuyen-khoa/:slug" element={<SpecialtyDetail authed={authed} />} />
        <Route path={PATHS.ai} element={<AiAssistant authed={authed} />} />
        <Route path={PATHS.appointments} element={<MyAppointments authed={authed} />} />
        <Route path={PATHS.profile} element={<PatientProfile authed={authed} />} />
        <Route path="*" element={<NotFoundPage authed={authed} />} />
      </Routes>
    </>
  );
}

export default App
