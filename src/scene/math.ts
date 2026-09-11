export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Vec3 = [number, number, number];

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

// How far a chapter's <article> has travelled through the viewport: 0 when its top is at the
// bottom edge, 1 when its bottom has left the top edge. The device is frontal around 0.5.
export function chapterPhaseFromRect(rect: Rect | undefined, vh: number): number {
  if (!rect || rect.h + vh <= 0) return 0;
  return Math.min(1, Math.max(0, (vh - rect.y) / (rect.h + vh)));
}

// Continuous chapter index 0..N: chapters above the viewport count 1, the current one its
// phase. Drives the camera's lateral drift so it never jumps between chapters.
export function chapterIndex(rects: Record<string, { chapter?: Rect }>, ids: readonly string[], vh: number): number {
  let c = 0;
  for (const id of ids) c += chapterPhaseFromRect(rects[id]?.chapter, vh);
  return c;
}

// P3-R8: how far the hero sculpture has exited towards the chapters — 0 at the top of the page,
// 1 once the visitor has scrolled half a viewport (P3-R3: the fly-out spans that first half).
// How far the visitor has scrolled the hero sculpture out: 0 while its box still sits below 20 %
// of the viewport height, 1 once the box top has climbed another half viewport. Keyed on the
// box rather than scrollY so the objects never leave while the sculpture is still in view — on
// phones the box sits below the text, far from the top. No box registered = already gone.
export function heroExitFromRect(heroTop: number | undefined, vh: number): number {
  if (heroTop === undefined || vh <= 0) return 1;
  return Math.min(1, Math.max(0, (0.2 * vh - heroTop) / (0.5 * vh)));
}

// P3-R12 fix-round-1 F1: while flying out of the hero (t < 1), blending toward a chapter's REAL
// rect sends far-below-the-fold chapters thousands of px off-screen in the first few px of
// scroll — the object appears to vanish rather than fly. Clamp the target's y instead; at t >= 1
// (today's behaviour) both endpoints are already off-screen, so the switch back to the real rect
// is invisible. Mutates and returns `out` (default a fresh rect, for tests) so callers on a hot

