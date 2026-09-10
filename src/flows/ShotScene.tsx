import { motion } from 'motion/react';
import { useMotionPrefs } from '../MotionProvider';

/** A rectangle of the screenshot, in fractions of its own width and height. */
export type Focus = { x: number; y: number; w: number };
export type Shot = { src: string; alt: string; focus: Focus };

/**
 * A real screen of the real product, framed.
 *
 * The chapters used to reconstruct each product's interface in React. However carefully those
 * were built they read as mock-ups, and at a phone's width the reconstruction showed almost
 * nothing — which is the opposite of what a showcase is for. These are captures of the running
 * product instead.
 *
 * A desktop interface shrunk into a 350 px card is unreadable, so each step names the region
 * that carries its meaning and the image is scaled and panned to it. On a wide screen the region
 * is the whole capture, so the transform resolves to identity and the screen is shown as it is.
 */
export function ShotScene({ shot, wide }: { shot: Shot; wide: boolean }) {
  const { dur, reduced } = useMotionPrefs();
  const { x, y, w } = wide ? { x: 0, y: 0, w: 1 } : shot.focus;
  const scale = 1 / w;
  // Pan in the image's own coordinates: the origin sits at the focus rect's top-left, so the
  // region lands flush with the frame whatever its size.
  const originX = `${x * 100}%`;
  const originY = `${y * 100}%`;

  return (
    <motion.img
      className="shot"
      src={shot.src}
      alt={shot.alt}
      loading="lazy"
      decoding="async"
      style={{ transformOrigin: `${originX} ${originY}` }}
      animate={{ scale, x: `${-x * 100}%`, y: `${-y * 100}%` }}
      initial={false}
      transition={reduced ? { duration: 0 } : { type: 'spring', bounce: 0, duration: dur.slow }}
    />
  );
}
