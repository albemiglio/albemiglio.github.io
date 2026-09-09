import { act, render } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { Hero } from '../src/sections/Hero';
import { sceneStore } from '../src/scene/store';

beforeEach(() => {
  // The store is module-level and can carry state across tests — pin it explicitly (see Work.test.tsx).
  sceneStore.set({ sceneOpen: false });
});

test('registers the sculpture box on the hero rect', () => {
  render(<MotionProvider forceReduced><Hero /></MotionProvider>);
  expect(sceneStore.get().rects.hero?.object).toBeDefined();
});

test('shows the fallback sculpture image while the scene is closed', () => {
  const { container } = render(<MotionProvider forceReduced><Hero /></MotionProvider>);
  const img = container.querySelector('.hero__sculpture img');
  expect(img).toHaveAttribute('src', '/fallback/hero.png');
  const source = container.querySelector('.hero__sculpture source');
  expect(source).toHaveAttribute('srcSet', '/fallback/hero.webp');
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
  const { container } = render(<MotionProvider forceReduced><Hero /></MotionProvider>);
  expect(container.querySelector('.hero__sculpture img')).not.toBeNull();
});
