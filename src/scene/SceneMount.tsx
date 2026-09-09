import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react';
import { useSceneGate } from './useSceneGate';
import { sceneStore, useSceneSelector } from './store';

const SceneCanvas = lazy(() => import('./SceneCanvas'));

// C1: R3F's <Canvas> rethrows render errors (a 404'd GLB, or one missing a mesh a device/object
// expects) into this parent tree — without a boundary that unmounts the whole app. Catching it
// here instead flips the scene closed and clears every quad, so Chapter's own `!sceneOpen`
// branch takes over and the page falls back to its static <picture>.
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    sceneStore.set({ sceneOpen: false });
    sceneStore.clearQuads();
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SceneMount() {
  const open = useSceneGate();
  // P2-R4: mirror the gate into the store so other components read `sceneOpen` from there
  // instead of each calling useSceneGate() themselves.
  useEffect(() => { sceneStore.set({ sceneOpen: open }); }, [open]);
  // I2: the store can close the scene on its own (context loss, boundary) — unmounting the canvas
  // here is what makes Device clear its quad and Chapter drop the transform.
  const storeOpen = useSceneSelector((s) => s.sceneOpen);
  if (!open || !storeOpen) return null;
  return (
    <SceneBoundary>
      <Suspense fallback={null}>
        <SceneCanvas />
      </Suspense>
    </SceneBoundary>
  );
}
