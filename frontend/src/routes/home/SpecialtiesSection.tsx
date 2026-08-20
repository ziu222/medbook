import { useEffect, useState, type ReactNode } from 'react';
import { fetchSpecialties, type Specialty } from '../../lib/api';

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'var(--brand)',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS_BY_SLUG: Record<string, ReactNode> = {
  'co-xuong-khop': (
    <svg {...iconProps}>
      <path d="M8 4a2 2 0 1 0-2 2 2 2 0 0 0-2 2" />
      <path d="M6 6l12 12" />
      <path d="M18 20a2 2 0 1 0 2-2 2 2 0 0 0 2-2" />
      <path d="M16 4a2 2 0 1 1 2 2 2 2 0 0 1 2 2" />
      <path d="M8 20a2 2 0 1 1-2-2 2 2 0 0 1-2-2" />
    </svg>
  ),
  'da-lieu': (
    <svg {...iconProps}>
      <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" />
      <path d="M9.5 12.5 11 14l3.5-3.5" />
    </svg>
  ),
  mat: (
    <svg {...iconProps}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  ),
  'nhi-khoa': (
    <svg {...iconProps}>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15 20c0-2 .8-3.6 2-4.6" />
    </svg>
  ),
  'noi-tong-quat': (
    <svg {...iconProps}>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" />
      <path d="M6 3H4M14 3h2" />
      <path d="M10 12v3a5 5 0 0 0 10 0v-1" />
      <circle cx="20" cy="12" r="2" />
    </svg>
  ),
  'san-phu-khoa': (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M12 12v8" />
      <path d="M9 17h6" />
    </svg>
  ),
  'tai-mui-hong': (
    <svg {...iconProps}>
      <path d="M6 8a6 6 0 0 1 12 0c0 3-2 4-2 7a3 3 0 0 1-6 0" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  ),
  'than-kinh': (
    <svg {...iconProps}>
      <path d="M4 12h3l2-5 4 10 2-5h5" />
    </svg>
  ),
  'tim-mach': (
    <svg {...iconProps}>
      <path d="M20.8 5.6a5 5 0 0 0-8.8-1 5 5 0 0 0-8.8 1c-1.4 3 .6 6 2.6 8 1.6 1.6 6.2 5.4 6.2 5.4s4.6-3.8 6.2-5.4c2-2 4-5 2.4-8Z" />
    </svg>
  ),
  'tieu-hoa': (
    <svg {...iconProps}>
      <path d="M8 3v4a4 4 0 0 0 4 4 4 4 0 0 1 4 4v2a4 4 0 0 1-8 0" />
      <path d="M8 3H6M8 3h2" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg {...iconProps}>
    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" />
    <path d="M12 8v6M9 11h6" />
  </svg>
);

export function SpecialtiesSection() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    fetchSpecialties()
      .then(setSpecialties)
      .catch(() => setSpecialties([]));
  }, []);

  return (
    <section style={{ padding: '44px 0 8px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-.6px', margin: 0 }}>Khám theo chuyên khoa</h2>
      <p style={{ color: 'var(--muted)', fontSize: '16px', margin: '10px 0 30px' }}>Chọn chuyên khoa để tìm bác sĩ phù hợp</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
        {specialties.map((specialty) => (
          <div
            key={specialty.id}
            className="card-hover fade-up"
            style={{
              width: 'calc((100% - 80px) / 6)',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '18px',
              padding: '26px 12px',
              cursor: 'pointer',
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
              {ICONS_BY_SLUG[specialty.slug] ?? DEFAULT_ICON}
            </div>
            <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{specialty.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
