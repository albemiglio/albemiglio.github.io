import { useCallback, useEffect, useRef, useState } from 'react';

export function useActiveChapter(ids: string[]) {
  const els = useRef(new Map<string, HTMLElement>());
  const [activeId, setActiveId] = useState<string | null>(null);

  const compute = useCallback(() => {
    const vh = window.innerHeight;
    const centre = vh / 2;
    let best: { id: string; dist: number } | null = null;
    for (const id of ids) {
      const el = els.current.get(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      if (visible / r.height < 0.5) continue;
      const dist = Math.abs(r.top + r.height / 2 - centre);
      if (!best || dist < best.dist) best = { id, dist };
    }
    setActiveId(best ? best.id : null);
  }, [ids]);

  useEffect(() => {
    compute();
    let raf = 0;
    // Coalesce scroll/resize bursts to at most one compute() per animation frame.
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; compute(); });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, [compute]);

  const register = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) els.current.set(id, el); else els.current.delete(id);
  }, []);

  return { activeId, register };
}
