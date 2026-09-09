import { useEffect, type RefObject } from 'react';
import { sceneStore } from './store';

export function useRectRegistration(id: string, kind: 'object' | 'frame', ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      // Measure the layout box, not the painted one: the `frame` element carries the handoff
      // matrix the scene wrote onto it, and feeding that back in would leave the projection
      // chasing its own output (it has no restoring force — every scale is a fixed point).
      // Clearing and restoring within one task never reaches the screen, and `transform` is not
      // a layout property, so this costs a style recalc rather than a reflow.
      const inline = (el as HTMLElement).style.transform;
      if (inline) (el as HTMLElement).style.transform = 'none';
      const r = el.getBoundingClientRect();
      if (inline) (el as HTMLElement).style.transform = inline;
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
