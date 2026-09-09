import { asdSteps } from '../src/flows/asd/steps';
import { pastisSteps } from '../src/flows/pastis/steps';
import { medSteps } from '../src/flows/med/steps';

test('asd timeline: ids in order with their durations', () => {
  expect(asdSteps.map((s) => s.id)).toEqual(['list', 'form', 'family', 'fee', 'receipt']);
  expect(asdSteps.map((s) => s.ms)).toEqual([1200, 1800, 1400, 1400, 1400]);
});

test('pastis timeline: ids in order with their durations', () => {
  expect(pastisSteps.map((s) => s.id)).toEqual(['new', 'configure', 'produce', 'ready', 'pickup']);
  expect(pastisSteps.map((s) => s.ms)).toEqual([1200, 1800, 1400, 1200, 1200]);
});

test('med timeline: ids in order with their durations', () => {
  expect(medSteps.map((s) => s.id)).toEqual(['question', 'answer', 'review', 'score', 'next']);
  expect(medSteps.map((s) => s.ms)).toEqual([1600, 1000, 1800, 1200, 1000]);
});
