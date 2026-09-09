import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { lerpKeyframes } from './math';
import { sceneStore } from './store';

export const CAMERA_FOV = 35;
export const CAMERA_DIST = 8;

// Position and look-at per progress along the Work section. Part 2 has one chapter, so the
// camera only drifts slightly on the way in; Part 3 adds a keyframe per chapter.
const POSITION = [
  { at: 0, v: [0, 0.6, CAMERA_DIST + 1.5] },
  { at: 0.2, v: [0, 0, CAMERA_DIST] },
  { at: 1, v: [0, 0, CAMERA_DIST] },
];
const TARGET = [
  { at: 0, v: [0, 0.4, 0] },
  { at: 0.2, v: [0, 0, 0] },
  { at: 1, v: [0, 0, 0] },
];

export function CameraRig() {
  const { camera, invalidate } = useThree();
  const lastProgress = useRef<number | null>(null);
  useEffect(() => {
    const apply = (p: number) => {
      // P2-R2: the store emits for reasons other than progress (rects, activeId, …); re-applying
      // the keyframes and invalidating on every emit would loop the render, so bail unless
      // progress itself moved.
      if (p === lastProgress.current) return;
      lastProgress.current = p;
      camera.position.fromArray(lerpKeyframes(POSITION, p));
      camera.lookAt(new Vector3().fromArray(lerpKeyframes(TARGET, p)));
      invalidate();
    };
    apply(sceneStore.get().progress);
    return sceneStore.subscribe((s) => apply(s.progress));
  }, [camera, invalidate]);
  return null;
}
