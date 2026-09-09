import { useRef } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useRectRegistration } from '../src/scene/useRectRegistration';
import { sceneStore } from '../src/scene/store';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
});

afterEach(() => {
  vi.useRealTimers();
});

const FLAT = { x: 10, y: 20, width: 100, height: 50, top: 20, left: 10, right: 110, bottom: 70, toJSON() {} } as DOMRect;
const SKEWED = { x: 999, y: 999, width: 999, height: 999, top: 999, left: 999, right: 999, bottom: 999, toJSON() {} } as DOMRect;

function makeEl(): HTMLDivElement {
  const el = document.createElement('div');
  // Mirrors the real handoff element: a matrix3d transform is present while off-frontal, so the
  // measured box would otherwise be the projected (skewed) one rather than the layout box. The
  // hook clears the transform to the literal string 'none' (not ''), so that counts as cleared.
  el.getBoundingClientRect = () => (el.style.transform && el.style.transform !== 'none' ? SKEWED : FLAT);
  return el;
}

// F5 / M5: `kind: 'frame'` must clear its inline transform before measuring (so it reads the
// layout box, not its own projected output) and put the transform back afterwards.
test('kind "frame" measures the untransformed box and restores the inline transform', () => {
  const el = makeEl();
  const inline = 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,5,5,0,1)';
  el.style.transform = inline;
  renderHook(() => {
    const ref = useRef<HTMLElement | null>(el);
    useRectRegistration('t-frame', 'frame', ref);
  });
  act(() => { window.dispatchEvent(new Event('resize')); });
  act(() => vi.runAllTimers());

  expect(sceneStore.get().rects['t-frame'].frame).toEqual({ x: 10, y: 20, w: 100, h: 50 });
  expect(el.style.transform).toBe(inline);
});

// F5: `kind: 'object'` elements never carry that inline transform, so the hook must not touch it.
test('kind "object" leaves the inline transform alone', () => {
  const el = makeEl();
  const inline = 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,5,5,0,1)';
  el.style.transform = inline;
  renderHook(() => {
    const ref = useRef<HTMLElement | null>(el);
    useRectRegistration('t-object', 'object', ref);
  });
  act(() => { window.dispatchEvent(new Event('resize')); });
  act(() => vi.runAllTimers());

  // The transform was never cleared, so getBoundingClientRect saw (and reported) the skewed box.
  expect(sceneStore.get().rects['t-object'].object).toEqual({ x: 999, y: 999, w: 999, h: 999 });
  expect(el.style.transform).toBe(inline);
});
