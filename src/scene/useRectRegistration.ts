import { useEffect, type RefObject } from 'react';
import { sceneStore } from './store';

export function useRectRegistration(id: string, kind: 'object' | 'frame', ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      sceneStore.setRect(id, kind, { x: r.left, y: r.top, w: r.width, h: r.height });
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); ro.disconnect(); if (raf) cancelAnimationFrame(raf); sceneStore.setRect(id, kind, null); };
  }, [id, kind, ref]);
}
