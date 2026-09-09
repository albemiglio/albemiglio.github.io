import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { useSceneGate, isSoftwareRenderer } from '../src/scene/useSceneGate';

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

const fakeGL = (renderer: string, unmasked?: string) => ({
  RENDERER: 0x1f01,
  getParameter: (p: number) => (p === 0x1f01 ? renderer : unmasked ?? ''),
  getExtension: () => (unmasked === undefined ? null : { UNMASKED_RENDERER_WEBGL: 0x9246 }),
}) as unknown as WebGLRenderingContext;

test('isSoftwareRenderer spots SwiftShader and llvmpipe, not a GPU', () => {
  expect(isSoftwareRenderer(fakeGL('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))'))).toBe(true);
  expect(isSoftwareRenderer(fakeGL('WebKit WebGL', 'Mesa llvmpipe (LLVM 15.0.7, 256 bits)'))).toBe(true);
  expect(isSoftwareRenderer(fakeGL('ANGLE (Apple, ANGLE Metal Renderer: Apple M2)'))).toBe(false);
  expect(isSoftwareRenderer(null)).toBe(false);
});
