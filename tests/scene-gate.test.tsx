import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { useSceneGate } from '../src/scene/useSceneGate';

const wrap = (reduced: boolean) => ({ children }: { children: ReactNode }) => <MotionProvider forceReduced={reduced}>{children}</MotionProvider>;

test('stays closed when reduced motion is on', () => {
  const { result } = renderHook(() => useSceneGate(), { wrapper: wrap(true) });
  act(() => { (globalThis as any).__idle?.(); });
  expect(result.current).toBe(false);
});

test('stays closed without WebGL (jsdom has none)', () => {
  const { result } = renderHook(() => useSceneGate(), { wrapper: wrap(false) });
  act(() => { (globalThis as any).__idle?.(); });
  expect(result.current).toBe(false);
});

test('opens after idle when WebGL is available', () => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = (() => ({})) as any;
  const { result } = renderHook(() => useSceneGate(), { wrapper: wrap(false) });
  act(() => { (globalThis as any).__idle?.(); });
  expect(result.current).toBe(true);
  HTMLCanvasElement.prototype.getContext = orig;
});
