import { useCallback, useEffect, useState } from 'react';
import type { Step } from './types';

export const LOOP_PAUSE_MS = 2000;

type Opts = { active: boolean; reduced: boolean };

export function useFlowPlayer<S>(steps: Step<S>[], { active, reduced }: Opts) {
  const last = steps.length - 1;
  const [index, setIndex] = useState(reduced ? last : 0);
  const [paused, setPaused] = useState(false);
  const playing = active && !reduced && !paused;

  useEffect(() => {
    if (!playing) return;
    const atEnd = index === last;
    const wait = steps[index].ms + (atEnd ? LOOP_PAUSE_MS : 0);
    const t = setTimeout(() => setIndex(atEnd ? 0 : index + 1), wait);
    return () => clearTimeout(t);
  }, [playing, index, last, steps]);

  const clamp = (i: number) => Math.min(last, Math.max(0, i));
  const goTo = useCallback((i: number) => setIndex(clamp(i)), [last]);
  const next = useCallback(() => setIndex((i) => clamp(i + 1)), [last]);
  const prev = useCallback(() => setIndex((i) => clamp(i - 1)), [last]);
  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const step = steps[index];
  return { index, step, state: step.state, playing, goTo, next, prev, pause, resume };
}
