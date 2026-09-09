// tests/useActiveChapter.test.tsx
import { act, renderHook } from '@testing-library/react';
import { useActiveChapter } from '../src/flows/useActiveChapter';

function el(top: number, height: number): HTMLElement {
  const e = document.createElement('div');
  e.getBoundingClientRect = () => ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON() {} }) as DOMRect;
  return e;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
});

afterEach(() => {
  vi.useRealTimers();
});

test('picks the chapter closest to the viewport centre with at least half visible', () => {
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
  const { result } = renderHook(() => useActiveChapter(['a', 'b']));
  act(() => {
    result.current.register('a')(el(-100, 800));   // centre 300, visible 700/800
    result.current.register('b')(el(900, 800));    // centre 1300, visible 100/800
    window.dispatchEvent(new Event('scroll'));
  });
  act(() => vi.runAllTimers());
  expect(result.current.activeId).toBe('a');
  act(() => {
    result.current.register('a')(el(-700, 800));   // visible 100/800 -> excluded
    result.current.register('b')(el(200, 800));    // centre 600, visible 800/800
    window.dispatchEvent(new Event('scroll'));
  });
  act(() => vi.runAllTimers());
  expect(result.current.activeId).toBe('b');
});

test('is null when nothing is half visible', () => {
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
  const { result } = renderHook(() => useActiveChapter(['a']));
  act(() => {
    result.current.register('a')(el(900, 800));
    window.dispatchEvent(new Event('scroll'));
  });
  act(() => vi.runAllTimers());
  expect(result.current.activeId).toBeNull();
});

test('coalesces a burst of scroll events into a single compute per frame', () => {
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
  const { result } = renderHook(() => useActiveChapter(['a']));
  act(() => {
    result.current.register('a')(el(-700, 800)); // visible 100/800 -> excluded, still initial null
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(vi.getTimerCount()).toBe(1); // one rAF queued despite three scroll events
  });
  act(() => {
    result.current.register('a')(el(200, 800)); // centre 600, visible 800/800
  });
  act(() => vi.runAllTimers());
  expect(result.current.activeId).toBe('a');
});
