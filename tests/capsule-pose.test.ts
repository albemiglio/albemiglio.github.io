import { capsulePose } from '../src/scene/objects/capsulePose';
import { medSteps } from '../src/flows/med/steps';

const at = (id: string) => medSteps.find((s) => s.id === id)!.state;

test('closed on question, open on review, closed again on score', () => {
  expect(capsulePose(at('question'), 0).parts.shell_a.offset[0]).toBe(0);
  const open = capsulePose(at('review'), 0);
  expect(open.parts.shell_a.offset[0]).toBeGreaterThan(0);
  expect(open.parts.shell_b.offset[0]).toBeLessThan(0);
  expect(open.parts.label.offset).toEqual(open.parts.shell_a.offset);
  expect(capsulePose(at('score'), 0).parts.shell_a.offset[0]).toBe(0);
});

test('exploded view spreads the beads radially', () => {
  const p = capsulePose(at('question'), 1);
  const r = (n: string) => Math.hypot(p.parts[n].offset[1], p.parts[n].offset[2]);
  expect(r('bead1')).toBeCloseTo(0.35, 5);
  expect(r('bead4')).toBeCloseTo(0.35, 5);
  expect(p.parts.bead1.offset).not.toEqual(p.parts.bead2.offset);
  expect(p.parts.shell_a.offset[0]).toBeCloseTo(0.6, 5);
});
