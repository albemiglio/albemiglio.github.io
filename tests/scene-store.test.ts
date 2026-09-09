import { renderHook, act } from '@testing-library/react';
import { sceneStore, useSceneSelector } from '../src/scene/store';

test('setRect stores and clears rects per chapter and notifies subscribers', () => {
  const seen: number[] = [];
  const off = sceneStore.subscribe((s) => seen.push(Object.keys(s.rects).length));
  sceneStore.setRect('ipcam', 'frame', { x: 1, y: 2, w: 3, h: 4 });
  expect(sceneStore.get().rects.ipcam.frame).toEqual({ x: 1, y: 2, w: 3, h: 4 });
  sceneStore.setRect('ipcam', 'frame', null);
  expect(sceneStore.get().rects.ipcam.frame).toBeUndefined();
  off();
  expect(seen.length).toBe(2);
});

test('useSceneSelector re-renders on the selected slice only', () => {
  const { result } = renderHook(() => useSceneSelector((s) => s.progress));
  expect(result.current).toBe(0);
  act(() => sceneStore.set({ progress: 0.42 }));
  expect(result.current).toBe(0.42);
});

test('setQuad notifies only subscribeQuad listeners for that id, not subscribe listeners', () => {
  let subCalls = 0;
  const offSub = sceneStore.subscribe(() => { subCalls++; });

  const seenA: (import('../src/scene/store').Quad | null)[] = [];
  const seenB: (import('../src/scene/store').Quad | null)[] = [];
  const offA = sceneStore.subscribeQuad('a', (q) => seenA.push(q));
  const offB = sceneStore.subscribeQuad('b', (q) => seenB.push(q));

  const quad: import('../src/scene/store').Quad = [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 },
  ];
  sceneStore.setQuad('a', quad);

  expect(seenA).toEqual([quad]);
  expect(seenB.length).toBe(0);
  expect(subCalls).toBe(0);

  offA();
  offB();
  offSub();
});
