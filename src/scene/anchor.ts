import { Vector3, type Camera } from 'three';
import type { Rect } from './math';

// Unlike rectToWorld, this holds for a camera that is not looking straight down -Z.
// Writes into `target` rather than allocating, so callers keep one scratch Vector3.
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
