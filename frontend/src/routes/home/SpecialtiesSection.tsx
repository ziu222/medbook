import type { ReactNode } from 'react';

interface Specialty {
  label: string;
  icon: ReactNode;
}

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'var(--brand)',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
};

const SPECIALTIES: Specialty[] = [
  {
    label: 'Tim mạch',
    icon: (
      <svg {...iconProps}>
        <path d="M20.8 5.6a5 5 0 0 0-8.8-1 5 5 0 0 0-8.8 1c-1.4 3 .6 6 2.6 8 1.6 1.6 6.2 5.4 6.2 5.4s4.6-3.8 6.2-5.4c2-2 4-5 2.4-8Z" />
      </svg>
    ),
  },
  {
    label: 'Thần kinh',
    icon: (
      <svg {...iconProps}>
        <path d="M4 12h3l2-5 4 10 2-5h5" />
      </svg>
    ),
  },
  {
    label: 'Nhi khoa',
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 20c0-2 .8-3.6 2-4.6" />
      </svg>
    ),
  },
  {
    label: 'Hô hấp',
    icon: (
      <svg {...iconProps}>
        <path d="M6 3v4a4 4 0 0 0 4 4M18 3v4a4 4 0 0 1-4 4m0 0v4a4 4 0 0 0 4 4" />
        <circle cx="18" cy="19" r="2" />
      </svg>
    ),
  },
  {
    label: 'Mắt',
    icon: (
      <svg {...iconProps}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="2.6" />
      </svg>
    ),
  },
  {
    label: 'Da liễu',
    icon: (
      <svg {...iconProps}>
        <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" />
      </svg>
    ),
  },
];

export function SpecialtiesSection() {
  return (
    <section style={{ padding: '44px 0 8px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-.6px', margin: 0 }}>Khám theo chuyên khoa</h2>
      <p style={{ color: 'var(--muted)', fontSize: '16px', margin: '10px 0 30px' }}>Chọn chuyên khoa để tìm bác sĩ phù hợp</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        {SPECIALTIES.map((specialty) => (
          <div
            key={specialty.label}
            className="card-hover"
            style={{
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '18px',
              padding: '26px 12px',
              cursor: 'pointer',
            }}
          >
            <div
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
              {specialty.icon}
            </div>
            <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{specialty.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
