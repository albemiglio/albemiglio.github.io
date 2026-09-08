import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ease } from '../motion';
import { useMotionPrefs } from '../MotionProvider';

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { reduced, dur } = useMotionPrefs();
  if (reduced) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: dur.slow, ease: [...ease], delay }}
    >
      {children}
    </motion.div>
  );
}
