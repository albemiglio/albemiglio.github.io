import { sceneTier } from '../src/scene/tier';

test('a software renderer runs at quarter resolution with the low models and no shadows', () => {
  expect(sceneTier(1440, true, 2)).toEqual({ dpr: 0.5, shadows: false, antialias: false, lod: 'low' });
});

test('small screens keep DPR 1 and the low models', () => {
  expect(sceneTier(390, false, 3)).toEqual({ dpr: 1, shadows: false, antialias: false, lod: 'low' });
});

test('a desktop GPU gets shadows, antialias and DPR capped at 1.5', () => {
  expect(sceneTier(1440, false, 2)).toEqual({ dpr: [1, 1.5], shadows: true, antialias: true, lod: 'high' });
});
