import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { hospitalStats } from '../../lib/mockContent';

function parseStat(num: string): { target: number; suffix: string } {
  const match = num.match(/^(\d+)(.*)$/);
  return match ? { target: Number(match[1]), suffix: match[2] } : { target: 0, suffix: num };
}

function StatNumber({ num, active, delayMs }: { num: string; active: boolean; delayMs: number }) {
  const { target, suffix } = parseStat(num);
  const value = useCountUp(target, active, delayMs);
  return (
    <>
      {Math.round(value)}
      {suffix}
    </>
  );
}

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
        width: '100vw',
        background: 'var(--forest)',
        marginTop: '56px',
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '56px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {hospitalStats.map((stat, i) => (
          <div key={stat.label}>
            <div style={{ fontSize: '44px', fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
              <StatNumber num={stat.num} active={active} delayMs={i * 80} />
            </div>
            <div style={{ color: '#8FBBA6', fontSize: '14.5px', marginTop: '11px', lineHeight: 1.4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
