import { AnimatePresence, motion } from 'motion/react';
import { useMotionPrefs } from '../MotionProvider';

/** A rectangle of the screenshot, in fractions of its own width and height. */
export type Focus = { x: number; y: number; w: number };
export type Shot = { src: string; alt: string; focus: Focus };

// A desktop interface shrunk into a phone's width is unreadable, so each step names the region
// that carries its meaning. On a wide screen the region is the whole capture.
export function ShotScene({ shot, wide }: { shot: Shot; wide: boolean }) {
  const { dur, reduced } = useMotionPrefs();
  const { x, y, w } = wide ? { x: 0, y: 0, w: 1 } : shot.focus;
  return (
    // Steps cross-fade rather than cut. The outgoing capture holds full opacity while the new one
    // comes up over it: fading both would dim the panel through the middle of every change.
    <AnimatePresence initial={false}>
      <motion.span
        key={shot.src}
        className="shot__layer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0, delay: reduced ? 0 : dur.slow } }}
        transition={{ duration: reduced ? 0 : dur.slow, ease: 'easeInOut' }}
      >
        <img
          className="shot"
          src={shot.src}
          alt={shot.alt}
          loading="lazy"
          decoding="async"
          style={{
            transformOrigin: `${x * 100}% ${y * 100}%`,
            transform: `translate(${-x * 100}%, ${-y * 100}%) scale(${1 / w})`,
          }}
        />
      </motion.span>
    </AnimatePresence>
  );
}
