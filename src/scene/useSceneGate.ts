import { useEffect, useState } from 'react';
import { useMotionPrefs } from '../MotionProvider';

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function onIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(fn, { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }
  if (import.meta.env.MODE === 'test') { (globalThis as any).__idle = fn; return () => { delete (globalThis as any).__idle; }; }
  const t = setTimeout(fn, 1);
  return () => clearTimeout(t);
}

export function useSceneGate(): boolean {
  const { reduced } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (reduced) { setOpen(false); return; }
    return onIdle(() => setOpen(hasWebGL()));
  }, [reduced]);
  return open;
}
