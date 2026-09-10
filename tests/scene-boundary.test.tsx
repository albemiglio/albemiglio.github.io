import { render } from '@testing-library/react';
import { SceneBoundary } from '../src/scene/SceneMount';
import { sceneStore } from '../src/scene/store';

function Boom(): null {
  throw new Error('boom');
}

// C1: a render error inside the 3D tree (404'd GLB, missing mesh, ...) must not take the whole
// app down with it — the boundary should swallow it, flip the scene closed, and clear any quad
// a chapter might still be holding a stale transform for.
test('falls back to the DOM path and clears quads when the scene throws', () => {
  sceneStore.set({ sceneOpen: true });
  sceneStore.setQuad('ipcam', { quad: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], rect: { x: 0, y: 0, w: 1, h: 1 } });
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

  expect(() => render(<SceneBoundary><Boom /></SceneBoundary>)).not.toThrow();

  expect(sceneStore.get().sceneOpen).toBe(false);
  expect(sceneStore.getQuad('ipcam')).toBeNull();
  spy.mockRestore();
});

// I2: when the store closes the scene on its own (WebGL context lost), SceneMount must unmount
// the canvas — that unmount is what clears the device quad and drops the DOM transform.
test('SceneMount unmounts the scene once the store closes it', async () => {
  const { SceneMount } = await import('../src/scene/SceneMount');
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = (() => ({})) as any;
  vi.doMock('../src/scene/SceneCanvas', () => ({ default: () => <div data-testid="canvas" /> }));
  const { act, screen } = await import('@testing-library/react');
  const { unmount } = render(<SceneMount />);
  act(() => { (globalThis as any).__idle?.(); });
  await screen.findByTestId('canvas');
  expect(sceneStore.get().sceneOpen).toBe(true);

  act(() => { sceneStore.set({ sceneOpen: false }); });
  expect(screen.queryByTestId('canvas')).toBeNull();

  unmount();
  HTMLCanvasElement.prototype.getContext = orig;
  vi.doUnmock('../src/scene/SceneCanvas');
});
