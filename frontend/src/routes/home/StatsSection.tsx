import { hospitalStats } from '../../lib/mockContent';

export function StatsSection() {
  return (
    <section
      style={{
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
        width: '100vw',
        background: 'var(--forest)',
        marginTop: '56px',
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '56px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {hospitalStats.map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: '44px', fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{stat.num}</div>
            <div style={{ color: '#8FBBA6', fontSize: '14.5px', marginTop: '11px', lineHeight: 1.4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
