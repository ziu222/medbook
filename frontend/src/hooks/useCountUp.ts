import { useEffect, useState } from 'react';

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Eases a number from 0 to target once `active` flips true — caller rounds/formats the result. */
export function useCountUp(target: number, active: boolean, delayMs = 0, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now() + delayMs;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(elapsed / durationMs, 1);
      setValue(easeOutCubic(t) * target);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, delayMs, durationMs]);

  return value;
}
