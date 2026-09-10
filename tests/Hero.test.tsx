import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, render } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { Hero } from '../src/sections/Hero';
import { sceneStore } from '../src/scene/store';
import { HERO_SCREENS, cropAspect, cropStyle } from '../src/heroScreens';

beforeEach(() => {
  // The store is module-level and can carry state across tests — pin it explicitly (see Work.test.tsx).
  sceneStore.set({ sceneOpen: false });
});

test('registers the sculpture box on the hero rect', () => {
  render(<MotionProvider forceReduced><Hero /></MotionProvider>);
  expect(sceneStore.get().rects.hero?.object).toBeDefined();
});

test('shows the first hero screen, cropped, while the scene is closed', () => {
  const { container } = render(<MotionProvider forceReduced><Hero /></MotionProvider>);
  const img = container.querySelector('.hero__sculpture img');
  expect(img).toHaveAttribute('src', HERO_SCREENS[0].src);
  // The crop is the whole point of the still: an uncropped capture at this size is a thumbnail.
  expect(img).toHaveStyle(cropStyle(HERO_SCREENS[0]));
});

test('fades the fallback out and unmounts it once the scene opens', () => {
  vi.useFakeTimers();
  const { container } = render(<MotionProvider forceReduced><Hero /></MotionProvider>);
  expect(container.querySelector('.hero__sculpture img')).not.toBeNull();

  act(() => { sceneStore.set({ sceneOpen: true }); });
  act(() => { vi.advanceTimersByTime(1000); });

  expect(container.querySelector('.hero__sculpture img')).toBeNull();
  vi.useRealTimers();
});

test('does not remount the fallback while the scene stays closed', () => {
  const { container, rerender } = render(<MotionProvider forceReduced><Hero /></MotionProvider>);
  const img = container.querySelector('.hero__sculpture img');
  expect(img).not.toBeNull();

  // An unrelated store emit with sceneOpen unchanged, then a forced re-render: the fallback
  // must keep the same <img> instance, not tear down and recreate it.
  act(() => { sceneStore.set({ sceneOpen: false }); });
  rerender(<MotionProvider forceReduced><Hero /></MotionProvider>);

  expect(container.querySelector('.hero__sculpture img')).toBe(img);
});

// The still's box carries the crop's proportions in CSS while the crop itself lives in
// heroScreens.ts. Two places, one number: change the crop and the box silently letterboxes or
// squeezes the region it is supposed to frame.
test('the still box aspect in CSS is the first screen crop own aspect', () => {
  const css = readFileSync(resolve(import.meta.dirname, '../src/sections/sections.css'), 'utf-8');
  const declared = css.match(/\.hero__still\s*\{[^}]*aspect-ratio:\s*([\d.]+)/)?.[1];
  expect(declared).toBeDefined();
  expect(Number(declared)).toBeCloseTo(cropAspect(HERO_SCREENS[0]), 2);
});
