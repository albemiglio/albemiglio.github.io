import { cardPose } from '../src/scene/objects/cardPose';
import { asdSteps } from '../src/flows/asd/steps';

const at = (id: string) => asdSteps.find((s) => s.id === id)!.state;
const N: [number, number, number] = [0, 0, 1];

test('layers stack at explode 0 and fan out along the normal at explode 1', () => {
  const closed = cardPose(at('list'), 0, N);
  expect(closed.parts.photo.offset).toEqual([0, 0, 0]);
  const open = cardPose(at('list'), 1, N);
  expect(open.parts.plate.offset[2]).toBe(0);
  expect(open.parts.stripe.offset[2]).toBeGreaterThan(0);
  expect(open.parts.chip.offset[2]).toBeGreaterThan(open.parts.stripe.offset[2]);
  expect(open.parts.photo.offset[2]).toBeGreaterThan(open.parts.chip.offset[2]);
});

test('photo and text are printed only at receipt', () => {
  expect(cardPose(at('fee'), 0, N).parts.photo.scale).toBeCloseTo(0.001);
  expect(cardPose(at('receipt'), 0, N).parts.photo.scale).toBe(1);
  expect(cardPose(at('receipt'), 0, N).parts.text.scale).toBe(1);
});
