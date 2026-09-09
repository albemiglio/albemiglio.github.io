import { Vector3, type Camera, type Matrix4 } from 'three';
import type { Pt, Rect } from '../math';
import type { Quad } from '../store';

// Page-pixel positions of a screen plane's corners (tl, tr, br, bl) given its world matrix.
// `box` is the plane's size in the frame `matrixWorld` maps from, so any scale carried by the
// matrix applies on top of it.
export function screenCorners(box: { w: number; h: number }, matrixWorld: Matrix4, camera: Camera, viewport: { w: number; h: number }): Quad {
  const hw = box.w / 2, hh = box.h / 2;
  const local = [new Vector3(-hw, hh, 0), new Vector3(hw, hh, 0), new Vector3(hw, -hh, 0), new Vector3(-hw, -hh, 0)];
  return local.map((v) => {
    const p = v.applyMatrix4(matrixWorld).project(camera);
    return { x: ((p.x + 1) / 2) * viewport.w, y: ((1 - p.y) / 2) * viewport.h };
  }) as Quad;
}

// Where a page rect's centre sits on the world z=0 plane, for the ACTUAL camera — unlike
// `rectToWorld` (which only holds for a camera looking straight down -Z), this works for any
// camera position/orientation by unprojecting the rect's NDC centre and intersecting the ray
// from the camera with the z=0 plane (fix-round-1, F3b: the chapter camera is now pitched).
export function rectCenterOnZPlane(rect: Rect, viewport: { w: number; h: number }, camera: Camera): Pt {
  const ndcX = ((rect.x + rect.w / 2) / viewport.w) * 2 - 1;
  const ndcY = -(((rect.y + rect.h / 2) / viewport.h) * 2 - 1);
  const ray = new Vector3(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
  const t = -camera.position.z / ray.z;
  return { x: camera.position.x + ray.x * t, y: camera.position.y + ray.y * t };
}
