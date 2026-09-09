import { ipcamPose } from '../src/scene/objects/ipcamPose';
import { ipcamSteps } from '../src/flows/ipcam/steps';

const at = (id: string) => ipcamSteps.find((s) => s.id === id)!.state;

test('assembled at explode 0, parts spread along Y at explode 1', () => {
  const closed = ipcamPose(at('grid'), 0);
  expect(closed.parts.dome.offset).toEqual([0, 0, 0]);
  const open = ipcamPose(at('grid'), 1);
  expect(open.parts.dome.offset[1]).toBeGreaterThan(open.parts.ring.offset[1]);
  expect(open.parts.ring.offset[1]).toBeGreaterThan(open.parts.body.offset[1]);
  expect(open.parts.base.offset).toEqual([0, 0, 0]);
});

test('pan and tilt rotate the lens and cradle', () => {
  const p = ipcamPose(at('ptz'), 0);
  expect(p.parts.lens.rotation![1]).toBeCloseTo(0.35);   // pan +1 → yaw
  expect(p.parts.lens.rotation![0]).toBeCloseTo(-0.2);   // tilt -1 → pitch
  expect(p.parts.cradle.rotation).toEqual(p.parts.lens.rotation);
});

test('rec lights the status led; talk keeps it', () => {
  expect(ipcamPose(at('live'), 0).statusOn).toBe(false);
  expect(ipcamPose(at('rec'), 0).statusOn).toBe(true);
  expect(ipcamPose(at('talk'), 0).ledOn).toBe(true);
});
