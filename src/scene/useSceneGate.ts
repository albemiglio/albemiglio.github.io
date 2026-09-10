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

// Probing creates a throwaway context; the answer never changes within a page, so ask once.
let softwareGL: boolean | undefined;
export const isSoftwareGL = () => (softwareGL ??= isSoftwareRenderer());

export function onIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(fn, { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }
  if (import.meta.env.MODE === 'test') { (globalThis as any).__idle = fn; return () => { delete (globalThis as any).__idle; }; }
  const t = setTimeout(fn, 1);
  return () => clearTimeout(t);
}

// A settle delay after load: the LCP image paints a frame or two after `load`, and any request
// that starts before that paint lands inside Lighthouse's LCP dependency graph (P3-R14). Two
// rAFs proved too short — the frame that runs them is the one that paints — so wait a real
// moment instead; the static hero snapshot covers the gap. Test mode resolves synchronously,
// same trick as onIdle above.
const SETTLE_MS = 1500;
function afterPaint(fn: () => void): () => void {
  if (import.meta.env.MODE === 'test') { fn(); return () => {}; }
  const t = setTimeout(fn, SETTLE_MS);
  return () => clearTimeout(t);
}

export function afterLoad(fn: () => void): () => void {
  if (document.readyState === 'complete') return afterPaint(fn);
  let cancelPaint = () => {};
  const onLoad = () => { cancelPaint = afterPaint(fn); };
  window.addEventListener('load', onLoad, { once: true });
  return () => { window.removeEventListener('load', onLoad); cancelPaint(); };
}

// Below this width the page has no sticky stage and the chapters show the Cycles stills of the
// objects (work.css): the realtime scene — low-poly tier, no shadows, no antialias on a 3x
// screen — would only look cheaper than those renders, so it never mounts on phones.
export const NARROW_QUERY = '(max-width: 899px)';

export function useSceneGate(): boolean {
  const { reduced } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (reduced) { setOpen(false); return; }
    const narrow = window.matchMedia(NARROW_QUERY);
    let cancelIdle = () => {};
    const cancelLoad = afterLoad(() => { cancelIdle = onIdle(() => setOpen(!narrow.matches && hasWebGL())); });
    // A phone rotating past the breakpoint, or a desktop window resized: follow the query.
    const onChange = (e: MediaQueryListEvent) => setOpen(!e.matches && hasWebGL());
    narrow.addEventListener('change', onChange);
    return () => { cancelLoad(); cancelIdle(); narrow.removeEventListener('change', onChange); };
  }, [reduced]);
  return open;
}
