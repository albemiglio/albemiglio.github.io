import { Matrix4, PerspectiveCamera } from 'three';
import { screenCorners } from '../src/scene/devices/screenAnchor';

test('a centred screen facing the camera projects to a centred axis-aligned quad', () => {
  const cam = new PerspectiveCamera(35, 2, 0.1, 50);
  cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const q = screenCorners({ w: 2, h: 1 }, new Matrix4(), cam, { w: 1000, h: 500 });
  expect(q[0].x).toBeCloseTo(1000 - q[1].x, 3);      // symmetric left/right
  expect(q[0].y).toBeCloseTo(q[1].y, 3);             // top edge horizontal
  expect(q[0].y).toBeLessThan(q[3].y);               // tl above bl
  expect(q[1].x - q[0].x).toBeCloseTo(2 * (q[3].y - q[0].y), 1); // aspect 2:1 preserved
});

test('a yawed screen becomes a trapezoid', () => {
  const cam = new PerspectiveCamera(35, 2, 0.1, 50);
  cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const m = new Matrix4().makeRotationY(0.6);
  const q = screenCorners({ w: 2, h: 1 }, m, cam, { w: 1000, h: 500 });
  expect(Math.abs(q[0].y - q[3].y)).not.toBeCloseTo(Math.abs(q[1].y - q[2].y), 1);
});
