import { cakePose } from '../src/scene/objects/cakePose';
import { pastisSteps } from '../src/flows/pastis/steps';

const at = (id: string) => pastisSteps.find((s) => s.id === id)!.state;

test('tiers appear with the configured count', () => {
  const one = cakePose({ ...at('new'), tiers: 1 }, 0);
  expect(one.parts.tier2.scale).toBeCloseTo(0.001);
  expect(one.parts.tier3.scale).toBeCloseTo(0.001);
  expect(one.parts.topper.scale).toBeCloseTo(0.001);
  const three = cakePose(at('configure'), 0);
  expect(three.parts.tier3.scale).toBe(1);
  expect(three.parts.topper.scale).toBe(1);
});

test('exploded view lifts the tiers one above the other', () => {
  const p = cakePose(at('configure'), 1);
  expect(p.parts.stand.offset[1]).toBe(0);
  expect(p.parts.tier1.offset[1]).toBe(0);
  expect(p.parts.tier2.offset[1]).toBeGreaterThan(0);
  expect(p.parts.tier3.offset[1]).toBeGreaterThan(p.parts.tier2.offset[1]);
  expect(p.parts.topper.offset[1]).toBeGreaterThan(p.parts.tier3.offset[1]);
  expect(p.parts.cream2.offset).toEqual(p.parts.tier2.offset);
});
