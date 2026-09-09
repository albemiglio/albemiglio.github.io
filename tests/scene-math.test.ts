import { chapterIndex, chapterPhaseFromRect, explodeAmount, flightTarget, heroExit, heroExplode, isNearIdentity, lerpKeyframes, quadToMatrix3d, rectToWorld } from '../src/scene/math';

const rect = { x: 100, y: 50, w: 400, h: 250 };
const corners = (r: typeof rect) => [
  { x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h },
] as [any, any, any, any];

// Local corners of the element itself (transform-origin: 0 0), as the browser sees them.
const localCorners = (r: typeof rect) => [
  { x: 0, y: 0 }, { x: r.w, y: 0 }, { x: r.w, y: r.h }, { x: 0, y: r.h },
] as [any, any, any, any];

// Mirrors what a browser does: apply the matrix3d to a LOCAL point, then place the
// (already-perspective-divided) result at the element's page position P.
function applyLocal(m: string, P: { x: number; y: number }, L: { x: number; y: number }) {
  const v = m.replace(/^matrix3d\(|\)$/g, '').split(',').map(Number); // column-major 4x4
  const X = v[0] * L.x + v[4] * L.y + v[12];
  const Y = v[1] * L.x + v[5] * L.y + v[13];
  const W = v[3] * L.x + v[7] * L.y + v[15];
  return { x: P.x + X / W, y: P.y + Y / W };
}

test('identity when the quad equals the rect corners', () => {
  const m = quadToMatrix3d(rect, corners(rect));
  const P = { x: rect.x, y: rect.y };
  localCorners(rect).forEach((L, i) => {
    const p = applyLocal(m, P, L);
    const c = corners(rect)[i];
    expect(p.x).toBeCloseTo(c.x, 3);
    expect(p.y).toBeCloseTo(c.y, 3);
  });
  expect(isNearIdentity(rect, corners(rect))).toBe(true);
});

test('maps the corners onto a perspective quad', () => {
  const dst = [{ x: 120, y: 80 }, { x: 460, y: 60 }, { x: 470, y: 300 }, { x: 110, y: 280 }] as [any, any, any, any];
  const m = quadToMatrix3d(rect, dst);
  const P = { x: rect.x, y: rect.y };
  localCorners(rect).forEach((L, i) => {
    const p = applyLocal(m, P, L);
    expect(Math.abs(p.x - dst[i].x)).toBeLessThanOrEqual(1e-3);
    expect(Math.abs(p.y - dst[i].y)).toBeLessThanOrEqual(1e-3);
  });
  expect(isNearIdentity(rect, dst)).toBe(false);
});

test('rectToWorld centres a full-viewport rect at the origin with the visible size', () => {
  const vp = { w: 1000, h: 500 };
  const r = rectToWorld({ x: 0, y: 0, w: 1000, h: 500 }, vp, 40, 10, 2);
  const visibleH = 2 * 10 * Math.tan((40 * Math.PI) / 360);
  expect(r.x).toBeCloseTo(0);
  expect(r.y).toBeCloseTo(0);
  expect(r.scaleH).toBeCloseTo(visibleH);
  expect(r.scaleW).toBeCloseTo(visibleH * 2);
  const q = rectToWorld({ x: 750, y: 0, w: 250, h: 125 }, vp, 40, 10, 2);
  expect(q.x).toBeGreaterThan(0);
  expect(q.y).toBeGreaterThan(0);
});

test('lerpKeyframes interpolates and clamps', () => {
  const keys = [{ at: 0, v: [0, 0, 10] }, { at: 0.5, v: [2, 0, 10] }, { at: 1, v: [2, 4, 6] }];
  expect(lerpKeyframes(keys, -1)).toEqual([0, 0, 10]);
  expect(lerpKeyframes(keys, 0.25)).toEqual([1, 0, 10]);
  expect(lerpKeyframes(keys, 0.75)).toEqual([2, 2, 8]);
  expect(lerpKeyframes(keys, 2)).toEqual([2, 4, 6]);
});

test('explodeAmount', () => {
  expect(explodeAmount(0)).toBe(0);
  expect(explodeAmount(0.25)).toBeGreaterThan(0.9);
  expect(explodeAmount(0.5)).toBe(0);
  expect(explodeAmount(1)).toBe(0);
});

test('chapterPhaseFromRect: 0 below the viewport, 0.5 centred, 1 above', () => {
  const vh = 900;
  expect(chapterPhaseFromRect({ x: 0, y: 900, w: 1, h: 1350 }, vh)).toBe(0);
  expect(chapterPhaseFromRect({ x: 0, y: (vh - 1350) / 2 - 0 + 0, w: 1, h: 1350 }, vh)).toBeCloseTo(0.5, 5);
  expect(chapterPhaseFromRect({ x: 0, y: -1350, w: 1, h: 1350 }, vh)).toBe(1);
  expect(chapterPhaseFromRect(undefined, vh)).toBe(0);
});

test('chapterIndex sums the phases of chapters in order', () => {
  const rects = { a: { chapter: { x: 0, y: -1350, w: 1, h: 1350 } }, b: { chapter: { x: 0, y: -225, w: 1, h: 1350 } }, c: { chapter: { x: 0, y: 2000, w: 1, h: 1350 } } };
  expect(chapterIndex(rects, ['a', 'b', 'c'], 900)).toBeCloseTo(1.5, 5);
});

test('heroExit: 0 at the top, 0.5 a quarter viewport down, 1 by half a viewport (P3-R8)', () => {
  expect(heroExit(0, 900)).toBe(0);
  expect(heroExit(225, 900)).toBeCloseTo(0.5, 5);
  expect(heroExit(900, 900)).toBe(1);
  expect(heroExit(1800, 900)).toBe(1);
  expect(heroExit(0, 0)).toBe(0);
});

test('heroExplode: 0 at the top and end of the fly-out, 1 at the midpoint (P3-R20/F12b)', () => {
  expect(heroExplode(0)).toBe(0);
  expect(heroExplode(1)).toBeCloseTo(0, 10);
  expect(heroExplode(0.5)).toBeCloseTo(1, 10);
});

test('flightTarget: clamps y mid-flight, leaves near rects and the t=1 case alone (P3-R12)', () => {
  const rect = { x: 10, y: 5000, w: 100, h: 200 };
  expect(flightTarget(rect, 900, 0.5)).toEqual({ x: 10, y: 1260, w: 100, h: 200 });
  expect(flightTarget(rect, 900, 1)).toEqual({ x: 10, y: 5000, w: 100, h: 200 });
  expect(flightTarget({ ...rect, y: 300 }, 900, 0.5)).toEqual({ x: 10, y: 300, w: 100, h: 200 });
});
