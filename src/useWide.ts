import { useSyncExternalStore } from 'react';

/** The breakpoint the layout already turns on: sticky stage, 3D scene, two columns. */
export const WIDE_QUERY = '(min-width: 900px)';

function subscribe(fn: () => void) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener('change', fn);
  return () => mq.removeEventListener('change', fn);
}

export function useWide(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(WIDE_QUERY).matches, () => true);
}
