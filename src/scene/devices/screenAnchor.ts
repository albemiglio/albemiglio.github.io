import { Vector3, type Camera, type Matrix4 } from 'three';
import type { Rect } from '../math';
import type { Quad } from '../store';

// Scratch state for screenCorners: 4 local-space corners reused across calls. Fully consumed
// (projected and copied into the caller's `out` buffer) before the function returns, so sharing
// this module-level buffer across calls and across Device instances is safe — nothing ever reads
// it after a later call has overwritten it.
const CORNER_SCRATCH = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];

// Page-pixel positions of a screen plane's corners (tl, tr, br, bl) given its world matrix.
// `box` is the plane's size in the frame `matrixWorld` maps from, so any scale carried by the
// matrix applies on top of it. Fills and returns the caller-supplied `out` buffer (fix-round-1,
// F1) instead of a shared module-level one: `sceneStore.setQuad` stores the returned quad by
// reference, so a shared buffer would let a second Device instance's frame clobber the corners a
// first instance's chapter still points to. Each Device keeps one `out` buffer for its own
// lifetime (see Device.tsx) — still allocation-free per frame.
export function screenCorners(box: { w: number; h: number }, matrixWorld: Matrix4, camera: Camera, viewport: { w: number; h: number }, out: Quad): Quad {
  const hw = box.w / 2, hh = box.h / 2;
  CORNER_SCRATCH[0].set(-hw, hh, 0);
  CORNER_SCRATCH[1].set(hw, hh, 0);
  CORNER_SCRATCH[2].set(hw, -hh, 0);
  CORNER_SCRATCH[3].set(-hw, -hh, 0);
  for (let i = 0; i < 4; i++) {
    const p = CORNER_SCRATCH[i].applyMatrix4(matrixWorld).project(camera);
    out[i].x = ((p.x + 1) / 2) * viewport.w;
    out[i].y = ((1 - p.y) / 2) * viewport.h;
  }
  return out;
}

// Where a page rect's centre sits on the world z=0 plane, for the ACTUAL camera — unlike
// `rectToWorld` (which only holds for a camera looking straight down -Z), this works for any
// camera position/orientation by unprojecting the rect's NDC centre and intersecting the ray
// from the camera with the z=0 plane (fix-round-1, F3b: the chapter camera is now pitched).
// Writes into and returns `target` (three.js's own getXTarget(target) convention) instead of
// allocating a fresh point, so callers keep one scratch Vector3 across frames.
export function rectCenterOnZPlane(rect: Rect, viewport: { w: number; h: number }, camera: Camera, target: Vector3): Vector3 {
  const ndcX = ((rect.x + rect.w / 2) / viewport.w) * 2 - 1;
  const ndcY = -(((rect.y + rect.h / 2) / viewport.h) * 2 - 1);
  target.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
  const t = -camera.position.z / target.z;
  const rx = target.x, ry = target.y;
  target.x = camera.position.x + rx * t;
  target.y = camera.position.y + ry * t;
  target.z = 0;
  return target;
}
