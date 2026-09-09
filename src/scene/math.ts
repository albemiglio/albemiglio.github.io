export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
type Quad = [Pt, Pt, Pt, Pt];

// Solve the 8 homography coefficients mapping the unit square (0,0),(1,0),(1,1),(0,1) to
// `q` (tl, tr, br, bl). Classic unit-square-to-quad projective mapping (Heckbert).
function squareToQuad(q: Quad): number[] {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  const a = p1.x - p0.x + g * p1.x, b = p3.x - p0.x + h * p3.x, c = p0.x;
  const d = p1.y - p0.y + g * p1.y, e = p3.y - p0.y + h * p3.y, f = p0.y;
  return [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1]; // column-major 4x4 with z untouched
}

function multiply(a: number[], b: number[]): number[] {
  const out = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    out[c * 4 + r] = s;
  }
  return out;
}

function translate(vx: number, vy: number): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, vx, vy, 0, 1];
}

// Maps `src` (page pixel rect) onto `dst` (page pixel quad, tl/tr/br/bl) as a CSS matrix3d
// string, for an element with `transform-origin: 0 0`.
//
// The browser does NOT apply this matrix to page points: it applies it to the element's own
// LOCAL points (top-left at local (0,0)), then places the perspective-divided result at the
// element's page position P = (src.x, src.y). So for a local point L, the browser computes
// P + M·L — not M·(P+L). H = squareToQuad(dst)∘toUnit(src) is the homography in PAGE space
// (H(P+L) = matching dst corner); to get the matrix the browser must apply to L we need
// M = T(-P)·H·T(P), so that P + M·L = H(P+L) for every local corner.
export function quadToMatrix3d(src: Rect, dst: Quad): string {
  const toUnit = [
    1 / src.w, 0, 0, 0,
    0, 1 / src.h, 0, 0,
    0, 0, 1, 0,
    -src.x / src.w, -src.y / src.h, 0, 1,
  ];
  const h = multiply(squareToQuad(dst), toUnit);
  const m = multiply(translate(-src.x, -src.y), multiply(h, translate(src.x, src.y)));
  return `matrix3d(${m.join(',')})`;
}

export function isNearIdentity(src: Rect, dst: Quad, tolPx = 0.5): boolean {
  const c: Quad = [
    { x: src.x, y: src.y }, { x: src.x + src.w, y: src.y }, { x: src.x + src.w, y: src.y + src.h }, { x: src.x, y: src.y + src.h },
  ];
  return c.every((p, i) => Math.abs(p.x - dst[i].x) <= tolPx && Math.abs(p.y - dst[i].y) <= tolPx);
}

// Where a page rect sits on the plane at distance `dist` in front of a camera that looks
// straight at the viewport centre: world x/y of its centre and the world size of its box.
export function rectToWorld(rect: Rect, viewport: { w: number; h: number }, fovDeg: number, dist: number, aspect: number) {
  const visibleH = 2 * dist * Math.tan((fovDeg * Math.PI) / 360);
  const visibleW = visibleH * aspect;
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  return {
    x: (cx / viewport.w - 0.5) * visibleW,
    y: (0.5 - cy / viewport.h) * visibleH,
    scaleW: (rect.w / viewport.w) * visibleW,
    scaleH: (rect.h / viewport.h) * visibleH,
  };
}

export function lerpKeyframes<T extends number[]>(keys: { at: number; v: T }[], t: number): T {
  if (t <= keys[0].at) return [...keys[0].v] as T;
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].at) {
      const a = keys[i - 1], b = keys[i];
      const u = (t - a.at) / (b.at - a.at);
      return a.v.map((av, j) => av + (b.v[j] - av) * u) as T;
    }
  }
  return [...keys[keys.length - 1].v] as T;
}

export function chapterPhase(progress: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

// Rises 0→1 over phase 0.05–0.25, holds, falls back to 0 by 0.45; 0 elsewhere.
export function explodeAmount(phase: number): number {
  const ease = (u: number) => 1 - Math.pow(1 - u, 3);
  if (phase <= 0.05 || phase >= 0.45) return 0;
  if (phase < 0.25) return ease((phase - 0.05) / 0.2);
  if (phase < 0.3) return 1;
  return 1 - ease((phase - 0.3) / 0.15);
}
