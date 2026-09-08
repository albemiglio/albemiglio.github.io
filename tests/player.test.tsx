import { act, renderHook } from '@testing-library/react';
import { LOOP_PAUSE_MS, useFlowPlayer } from '../src/flows/player';

const steps = [
  { id: 'a', label: 'A', ms: 1000, state: { v: 1 } },
  { id: 'b', label: 'B', ms: 500, state: { v: 2 } },
  { id: 'c', label: 'C', ms: 700, state: { v: 3 } },
];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('advances through the steps and loops after the pause', () => {
  const { result } = renderHook(() => useFlowPlayer(steps, { active: true, reduced: false }));
  expect(result.current.index).toBe(0);
  expect(result.current.playing).toBe(true);
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.index).toBe(1);
  act(() => vi.advanceTimersByTime(500));
  expect(result.current.index).toBe(2);
  act(() => vi.advanceTimersByTime(700));
  expect(result.current.index).toBe(2);
  act(() => vi.advanceTimersByTime(LOOP_PAUSE_MS));
  expect(result.current.index).toBe(0);
});

test('does not advance while inactive, resumes when active', () => {
  const { result, rerender } = renderHook(({ active }) => useFlowPlayer(steps, { active, reduced: false }), { initialProps: { active: false } });
  act(() => vi.advanceTimersByTime(5000));
  expect(result.current.index).toBe(0);
  expect(result.current.playing).toBe(false);
  rerender({ active: true });
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.index).toBe(1);
});

test('pause and resume, goTo, next and prev clamp', () => {
  const { result } = renderHook(() => useFlowPlayer(steps, { active: true, reduced: false }));
  act(() => result.current.pause());
  act(() => vi.advanceTimersByTime(3000));
  expect(result.current.index).toBe(0);
  act(() => result.current.resume());
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.index).toBe(1);
  act(() => result.current.goTo(2));
  expect(result.current.state).toEqual({ v: 3 });
  act(() => result.current.next());
  expect(result.current.index).toBe(2);
  act(() => result.current.prev());
  act(() => result.current.prev());
  act(() => result.current.prev());
  expect(result.current.index).toBe(0);
});

test('reduced motion starts on the last step and never autoplays', () => {
  const { result } = renderHook(() => useFlowPlayer(steps, { active: true, reduced: true }));
  expect(result.current.index).toBe(2);
  expect(result.current.playing).toBe(false);
  act(() => vi.advanceTimersByTime(10000));
  expect(result.current.index).toBe(2);
  act(() => result.current.goTo(0));
  expect(result.current.index).toBe(0);
});
