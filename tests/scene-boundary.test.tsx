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
  sceneStore.setQuad('ipcam', [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]);
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

  expect(() => render(<SceneBoundary><Boom /></SceneBoundary>)).not.toThrow();

  expect(sceneStore.get().sceneOpen).toBe(false);
  expect(sceneStore.getQuad('ipcam')).toBeNull();
  spy.mockRestore();
});
