import { Header } from '../components/Common/Header';
import { Footer } from '../components/Common/Footer';
import { HeroSection } from './home/HeroSection';
import { SpecialtiesSection } from './home/SpecialtiesSection';
import { DoctorTeamSection } from './home/DoctorTeamSection';

export function HomePage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header active="home" />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <HeroSection />
        <SpecialtiesSection />
        <DoctorTeamSection />
      </main>
      <Footer />
    </div>
  );
}
