import { Vector3, type Camera, type Matrix4 } from 'three';
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
