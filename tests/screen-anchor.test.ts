import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { rectToWorld } from '../src/scene/math';
import type { Quad } from '../src/scene/store';
import { rectCenterOnZPlane, screenCorners } from '../src/scene/devices/screenAnchor';

function emptyQuad(): Quad {
  return [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
}

test('a centred screen facing the camera projects to a centred axis-aligned quad', () => {
  const cam = new PerspectiveCamera(35, 2, 0.1, 50);
  cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const q = screenCorners({ w: 2, h: 1 }, new Matrix4(), cam, { w: 1000, h: 500 }, emptyQuad());
  expect(q[0].x).toBeCloseTo(1000 - q[1].x, 3);      // symmetric left/right
  expect(q[0].y).toBeCloseTo(q[1].y, 3);             // top edge horizontal
  expect(q[0].y).toBeLessThan(q[3].y);               // tl above bl
  expect(q[1].x - q[0].x).toBeCloseTo(2 * (q[3].y - q[0].y), 1); // aspect 2:1 preserved
});

test('a yawed screen becomes a trapezoid', () => {
  const cam = new PerspectiveCamera(35, 2, 0.1, 50);
  cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const m = new Matrix4().makeRotationY(0.6);
  const q = screenCorners({ w: 2, h: 1 }, m, cam, { w: 1000, h: 500 }, emptyQuad());
  expect(Math.abs(q[0].y - q[3].y)).not.toBeCloseTo(Math.abs(q[1].y - q[2].y), 1);
});

// fix-round-1, F1: screenCorners used to project into one shared module-level buffer, so a second
// Device instance's call would overwrite the corners a first instance's chapter still points to
// (sceneStore.setQuad stores the returned quad by reference). Each call must fill only the
// `out` buffer it's given.
test('fills the caller-supplied out buffer, leaving other buffers untouched', () => {
  const cam = new PerspectiveCamera(35, 2, 0.1, 50);
  cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();

  const bufA = emptyQuad();
  const bufB = emptyQuad();
  const qA = screenCorners({ w: 2, h: 1 }, new Matrix4(), cam, { w: 1000, h: 500 }, bufA);
  // A second call, with different inputs, into a different buffer.
  const qB = screenCorners({ w: 4, h: 2 }, new Matrix4().makeRotationY(0.6), cam, { w: 1000, h: 500 }, bufB);

  expect(qA).toBe(bufA); // fills and returns the caller's own buffer, not a shared one
  expect(qB).toBe(bufB);
  // A shared-scratch implementation would have both calls converge on bufB's (last-written)
  // values; bufA must still hold the first call's own result.
  expect(bufA[0]).toEqual(qA[0]);
  expect(bufA[0]).not.toEqual(bufB[0]);
});

// fix-round-1, F3b
test('rectCenterOnZPlane matches rectToWorld for a camera looking straight down -Z', () => {
  const cam = new PerspectiveCamera(40, 2, 0.1, 50);
  cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const viewport = { w: 1000, h: 500 };
  const rect = { x: 750, y: 0, w: 250, h: 125 };
  const world = rectToWorld(rect, viewport, 40, 10, 2);
  const p = rectCenterOnZPlane(rect, viewport, cam, new Vector3());
  expect(p.x).toBeCloseTo(world.x, 3);
  expect(p.y).toBeCloseTo(world.y, 3);
});

test('rectCenterOnZPlane finds the z=0 point that re-projects onto the rect centre, even off-axis and pitched', () => {
  const cam = new PerspectiveCamera(35, 1.6, 0.1, 50);
  cam.position.set(0, 1.6, 8); cam.lookAt(0, -0.2, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const viewport = { w: 1440, h: 900 };
  const rect = { x: 800, y: 300, w: 200, h: 150 };
  const p = rectCenterOnZPlane(rect, viewport, cam, new Vector3());
  const ndc = new Vector3(p.x, p.y, 0).project(cam);
  const px = ((ndc.x + 1) / 2) * viewport.w;
  const py = ((1 - ndc.y) / 2) * viewport.h;
  expect(px).toBeCloseTo(rect.x + rect.w / 2, 3);
  expect(py).toBeCloseTo(rect.y + rect.h / 2, 3);
});
