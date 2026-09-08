import { createContext, useContext, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { durations, ease, type Durations } from './motion';

type Prefs = { reduced: boolean; dur: Durations };
const Ctx = createContext<Prefs>({ reduced: false, dur: durations(false) });

export function MotionProvider({ children, forceReduced = false }: { children: ReactNode; forceReduced?: boolean }) {
  const system = useReducedMotion() ?? false;
  const reduced = forceReduced || system;
  return (
    <Ctx.Provider value={{ reduced, dur: durations(reduced) }}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={{ ease: [...ease], duration: durations(reduced).base }}>
        {children}
      </MotionConfig>
    </Ctx.Provider>
  );
}

export function useMotionPrefs(): Prefs {
  return useContext(Ctx);
}
