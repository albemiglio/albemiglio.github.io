import { chapterPhase, explodeAmount, isNearIdentity, lerpKeyframes, quadToMatrix3d, rectToWorld } from '../src/scene/math';

const rect = { x: 100, y: 50, w: 400, h: 250 };
const corners = (r: typeof rect) => [
  { x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h },
] as [any, any, any, any];

function apply(m: string, p: { x: number; y: number }) {
  const v = m.replace(/^matrix3d\(|\)$/g, '').split(',').map(Number); // column-major 4x4
  const X = v[0] * p.x + v[4] * p.y + v[12];
  const Y = v[1] * p.x + v[5] * p.y + v[13];
  const W = v[3] * p.x + v[7] * p.y + v[15];
  return { x: X / W, y: Y / W };
}

test('identity when the quad equals the rect corners', () => {
  const m = quadToMatrix3d(rect, corners(rect));
  for (const c of corners(rect)) {
    const p = apply(m, c);
    expect(p.x).toBeCloseTo(c.x, 3);
    expect(p.y).toBeCloseTo(c.y, 3);
  }
  expect(isNearIdentity(rect, corners(rect))).toBe(true);
});

test('maps the corners onto a perspective quad', () => {
  const dst = [{ x: 120, y: 80 }, { x: 460, y: 60 }, { x: 470, y: 300 }, { x: 110, y: 280 }] as [any, any, any, any];
  const m = quadToMatrix3d(rect, dst);
  corners(rect).forEach((c, i) => {
    const p = apply(m, c);
    expect(p.x).toBeCloseTo(dst[i].x, 2);
    expect(p.y).toBeCloseTo(dst[i].y, 2);
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

test('chapterPhase and explodeAmount', () => {
  expect(chapterPhase(0.2, 0.2, 0.6)).toBe(0);
  expect(chapterPhase(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
  expect(chapterPhase(0.9, 0.2, 0.6)).toBe(1);
  expect(explodeAmount(0)).toBe(0);
  expect(explodeAmount(0.25)).toBeGreaterThan(0.9);
  expect(explodeAmount(0.5)).toBe(0);
  expect(explodeAmount(1)).toBe(0);
});
