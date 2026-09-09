import { useEffect, type RefObject } from 'react';
import { useScroll } from 'motion/react';
import { sceneStore } from './store';

// Maps the scroll through `target` (the Work section) onto 0..1 and mirrors the viewport size.
export function useSceneProgress(target: RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] });
  useEffect(() => scrollYProgress.on('change', (v) => sceneStore.set({ progress: v })), [scrollYProgress]);
  useEffect(() => {
    const read = () => sceneStore.set({ viewport: { w: window.innerWidth, h: window.innerHeight } });
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  // heroExit (P3-R8) reads scrollY straight from the store — rAF-gated so a scroll fling doesn't
  // fan out into more than one store emit per frame. useSceneSelector subscribers already bail on
  // their own signature, so the extra emits this adds cost nothing beyond this one.
  useEffect(() => {
    let raf = 0;
    const read = () => { raf = 0; sceneStore.set({ scrollY: window.scrollY }); };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', schedule, { passive: true });
    return () => { window.removeEventListener('scroll', schedule); if (raf) cancelAnimationFrame(raf); };
  }, []);
}
