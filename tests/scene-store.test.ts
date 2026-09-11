import { renderHook, act } from '@testing-library/react';
import { heroExitOf, sceneStore, useSceneSelector } from '../src/scene/store';

test('setRect stores and clears rects per chapter and notifies subscribers', () => {
  const seen: number[] = [];
  const off = sceneStore.subscribe((s) => seen.push(Object.keys(s.rects).length));
  sceneStore.setRect('ipcam', 'object', { x: 1, y: 2, w: 3, h: 4 });
  expect(sceneStore.get().rects.ipcam.object).toEqual({ x: 1, y: 2, w: 3, h: 4 });
  sceneStore.setRect('ipcam', 'object', null);
  expect(sceneStore.get().rects.ipcam.object).toBeUndefined();
  off();
  expect(seen.length).toBe(2);
});

test('useSceneSelector re-renders on the selected slice only', () => {
  const { result } = renderHook(() => useSceneSelector((s) => s.progress));
  expect(result.current).toBe(0);
  act(() => sceneStore.set({ progress: 0.42 }));
  expect(result.current).toBe(0.42);
});


test('heroExitOf: phones never enter hero mode; wide viewports follow the sculpture box', () => {
  sceneStore.set({ viewport: { w: 390, h: 844 } });
  sceneStore.setRect('hero', 'object', { x: 0, y: 400, w: 260, h: 260 });
  expect(heroExitOf(sceneStore.get())).toBe(1);
  sceneStore.set({ viewport: { w: 1440, h: 900 } });
  sceneStore.setRect('hero', 'object', { x: 0, y: 225, w: 420, h: 420 });
  expect(heroExitOf(sceneStore.get())).toBe(0);
  sceneStore.setRect('hero', 'object', null);
  expect(heroExitOf(sceneStore.get())).toBe(1);
});
