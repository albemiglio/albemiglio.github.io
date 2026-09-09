import { Vector3, type Camera, type Matrix4 } from 'three';
import type { Rect } from '../math';
import type { Quad } from '../store';

// Scratch state for screenCorners: 4 local-space corners reused across calls, and the Quad
// (plain {x,y} pairs) they get projected into. Device.tsx's useFrame calls this twice per
// settled frame (a scale probe, then the final quad for the store); both calls share this one
// buffer, which is safe only because each caller fully reads its result before the next call —
// the buffer is overwritten in place, not a snapshot.
const CORNER_SCRATCH = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
const QUAD_SCRATCH: Quad = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];

// Page-pixel positions of a screen plane's corners (tl, tr, br, bl) given its world matrix.
// `box` is the plane's size in the frame `matrixWorld` maps from, so any scale carried by the
// matrix applies on top of it. Returns the shared QUAD_SCRATCH buffer — consume it before calling
// this again.
export function screenCorners(box: { w: number; h: number }, matrixWorld: Matrix4, camera: Camera, viewport: { w: number; h: number }): Quad {
  const hw = box.w / 2, hh = box.h / 2;
  CORNER_SCRATCH[0].set(-hw, hh, 0);
  CORNER_SCRATCH[1].set(hw, hh, 0);
  CORNER_SCRATCH[2].set(hw, -hh, 0);
  CORNER_SCRATCH[3].set(-hw, -hh, 0);
  for (let i = 0; i < 4; i++) {
    const p = CORNER_SCRATCH[i].applyMatrix4(matrixWorld).project(camera);
    QUAD_SCRATCH[i].x = ((p.x + 1) / 2) * viewport.w;
    QUAD_SCRATCH[i].y = ((1 - p.y) / 2) * viewport.h;
  }
  return QUAD_SCRATCH;
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
