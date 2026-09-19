import { useEffect, useState } from 'react';
import { SpecialtyIcon } from '../../components/Common/SpecialtyIcon';
import { fetchSpecialties, type Specialty } from '../../lib/api';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

export function SpecialtiesSection() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const { ref, active } = useRevealOnScroll<HTMLDivElement>();

  useEffect(() => {
    fetchSpecialties()
      .then(setSpecialties)
      .catch(() => setSpecialties([]));
  }, []);

  return (
    <section style={{ padding: '44px 0 8px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-.6px', margin: 0 }}>Khám theo chuyên khoa</h2>
      <p style={{ color: 'var(--muted)', fontSize: '16px', margin: '10px 0 30px' }}>Chọn chuyên khoa để tìm bác sĩ phù hợp</p>
      <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
        {specialties.map((specialty, i) => (
          <div
            key={specialty.id}
            className={`card-hover reveal-item${active ? ' reveal-active' : ''}`}
            style={{
              flex: '1 1 140px',
              maxWidth: '170px',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '18px',
              padding: '26px 12px',
              cursor: 'pointer',
              transitionDelay: `${i * 60}ms`,
            }}
          >
            <div
              className="img-zoom"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '15px',
                background: 'var(--tint)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 12px',
              }}
            >
              <SpecialtyIcon slug={specialty.slug} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{specialty.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
