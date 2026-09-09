import { lazy, Suspense, useEffect } from 'react';
import { useSceneGate } from './useSceneGate';
import { sceneStore } from './store';

const SceneCanvas = lazy(() => import('./SceneCanvas'));

export function SceneMount() {
  const open = useSceneGate();
  // P2-R4: mirror the gate into the store so other components read `sceneOpen` from there
  // instead of each calling useSceneGate() themselves.
  useEffect(() => { sceneStore.set({ sceneOpen: open }); }, [open]);
  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <SceneCanvas />
    </Suspense>
  );
}
