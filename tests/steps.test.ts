import { asdSteps } from '../src/flows/asd/steps';
import { medSteps } from '../src/flows/med/steps';

test('asd timeline: ids in order with their durations', () => {
  expect(asdSteps.map((s) => s.id)).toEqual(['list', 'form', 'family', 'fee', 'receipt']);
  expect(asdSteps.map((s) => s.ms)).toEqual([1200, 1800, 1400, 1400, 1400]);
});

test('med timeline: ids in order with their durations', () => {
  expect(medSteps.map((s) => s.id)).toEqual(['question', 'answer', 'review', 'score', 'next']);
  expect(medSteps.map((s) => s.ms)).toEqual([1600, 1000, 1800, 1200, 1000]);
});
