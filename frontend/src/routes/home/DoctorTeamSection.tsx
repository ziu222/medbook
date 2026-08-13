import { useRef } from 'react';
import { ImageSlot } from '../../components/Common/ImageSlot';
import { doctorTeam } from '../../lib/mockDoctors';

const arrowButtonStyle = {
  position: 'absolute' as const,
  top: '112px',
  transform: 'translateY(-50%)',
  zIndex: 5,
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  background: 'var(--forest)',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  boxShadow: 'var(--sh)',
};

export function DoctorTeamSection() {
  const stripRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    stripRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section style={{ padding: '52px 0 8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-.6px', margin: 0 }}>Đội ngũ Bác sĩ</h2>
        <p style={{ color: 'var(--muted)', fontSize: '16px', margin: '10px 0 0' }}>Chuyên gia đầu ngành của Bệnh viện Quân y 175</p>
      </div>

      <div style={{ position: 'relative' }}>
        <div className="btn-hover" style={{ ...arrowButtonStyle, left: 0 }} onClick={() => scrollBy(-340)}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </div>
        <div className="btn-hover" style={{ ...arrowButtonStyle, right: 0 }} onClick={() => scrollBy(340)}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </div>

        <div
          ref={stripRef}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            padding: '6px 58px 18px',
            scrollbarWidth: 'none',
          }}
        >
          {doctorTeam.map((doctor) => (
            <div key={doctor.id} style={{ flex: '0 0 160px', scrollSnapAlign: 'start', cursor: 'pointer' }}>
              <div
                className="card-hover-lift"
                style={{ aspectRatio: '3 / 4', borderRadius: '18px', overflow: 'hidden', background: 'var(--tint)', boxShadow: 'var(--sh-sm)' }}
              >
                <ImageSlot placeholder={doctor.name} shape="rect" fit="cover" />
              </div>
              <div style={{ textAlign: 'center', marginTop: '13px' }}>
                <div style={{ fontWeight: 800, fontSize: '15.5px', letterSpacing: '-.2px' }}>{doctor.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '3px' }}>{doctor.specialty}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
