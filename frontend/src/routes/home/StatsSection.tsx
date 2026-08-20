import { useEffect, useRef, useState } from 'react';
import { hospitalStats } from '../../lib/mockContent';

function parseStat(num: string): { target: number; suffix: string } {
  const match = num.match(/^(\d+)(.*)$/);
  return match ? { target: Number(match[1]), suffix: match[2] } : { target: 0, suffix: num };
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function useCountUp(target: number, active: boolean, delayMs: number): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const durationMs = 900;
    let raf = 0;
    const start = performance.now() + delayMs;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(elapsed / durationMs, 1);
      setValue(Math.round(easeOutCubic(t) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, delayMs]);

  return value;
}

function StatNumber({ num, active, delayMs }: { num: string; active: boolean; delayMs: number }) {
  const { target, suffix } = parseStat(num);
  const value = useCountUp(target, active, delayMs);
  return (
    <>
      {value}
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
