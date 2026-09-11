import { render } from '@testing-library/react';
import { SceneBoundary } from '../src/scene/SceneMount';
import { sceneStore } from '../src/scene/store';

function Boom(): null {
  throw new Error('boom');
}

// C1: a render error inside the 3D tree must not take the whole app down with it — the boundary
// swallows it and flips the scene closed, which is what leaves the page as plain DOM.
test('falls back to the DOM path when the scene throws', () => {
  sceneStore.set({ sceneOpen: true });
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

  expect(() => render(<SceneBoundary><Boom /></SceneBoundary>)).not.toThrow();

  expect(sceneStore.get().sceneOpen).toBe(false);
  spy.mockRestore();
});

// I2: when the store closes the scene on its own (WebGL context lost), SceneMount must unmount
// the canvas rather than leave a dead one in the page.
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
