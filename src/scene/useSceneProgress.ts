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
}
