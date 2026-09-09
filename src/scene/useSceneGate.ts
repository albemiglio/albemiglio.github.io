import { useEffect, useState } from 'react';
import { useMotionPrefs } from '../MotionProvider';

function probeContext(): WebGLRenderingContext | null {
  try {
    const c = document.createElement('canvas');
    return (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
  } catch { return null; }
}

const hasWebGL = () => probeContext() !== null;

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software/i;

// A software rasteriser (VMs, remote desktops, CI) renders a frame in seconds,
// so the canvas runs the same lite tier as small screens: no shadows, DPR 1.
export function isSoftwareRenderer(gl: WebGLRenderingContext | null = probeContext()): boolean {
  if (!gl) return false;
  const info = gl.getExtension('WEBGL_debug_renderer_info') as { UNMASKED_RENDERER_WEBGL: number } | null;
  const names = [gl.getParameter(gl.RENDERER), info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL)];
  return names.some((n) => SOFTWARE_RENDERER.test(String(n ?? '')));
}

export function onIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(fn, { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }
  if (import.meta.env.MODE === 'test') { (globalThis as any).__idle = fn; return () => { delete (globalThis as any).__idle; }; }
  const t = setTimeout(fn, 1);
  return () => clearTimeout(t);
}

// Two rAFs = one full paint has happened, so the scene chunk's fetch never lands inside
// Lantern's LCP dependency graph (P3-R14/F1). jsdom's rAF is a macrotask with nothing driving
// the clock in these tests, so test mode resolves synchronously, same trick as onIdle above.
function afterPaint(fn: () => void): () => void {
  if (import.meta.env.MODE === 'test') { fn(); return () => {}; }
  let raf2 = 0;
  const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(fn); });
  return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
}

export function afterLoad(fn: () => void): () => void {
  if (document.readyState === 'complete') return afterPaint(fn);
  let cancelPaint = () => {};
  const onLoad = () => { cancelPaint = afterPaint(fn); };
  window.addEventListener('load', onLoad, { once: true });
  return () => { window.removeEventListener('load', onLoad); cancelPaint(); };
}

export function useSceneGate(): boolean {
  const { reduced } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (reduced) { setOpen(false); return; }
    let cancelIdle = () => {};
    const cancelLoad = afterLoad(() => { cancelIdle = onIdle(() => setOpen(hasWebGL())); });
    return () => { cancelLoad(); cancelIdle(); };
  }, [reduced]);
  return open;
}
