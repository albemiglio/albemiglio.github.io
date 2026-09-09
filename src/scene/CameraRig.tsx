import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { CHAPTER_IDS } from '../chapters';
import { chapterIndex, lerpKeyframes } from './math';
import { sceneStore, type SceneState } from './store';

export const CAMERA_FOV = 35;
export const CAMERA_DIST = 8;
const DRIFT_X = 0.35;

// Position and look-at per progress along the Work section. Part 2 has one chapter, so the
// camera only drifts slightly on the way in; Part 3 adds a keyframe per chapter.
const POSITION = [
  { at: 0, v: [0, 0.6, CAMERA_DIST + 1.5] },
  { at: 0.2, v: [0, 1.6, CAMERA_DIST] },
  { at: 1, v: [0, 1.6, CAMERA_DIST] },
];
const TARGET = [
  { at: 0, v: [0, 0.4, 0] },
  { at: 0.2, v: [0, -0.2, 0] },
  { at: 1, v: [0, -0.2, 0] },
];

export function CameraRig() {
  const { camera, invalidate } = useThree();
  const last = useRef<string | null>(null);
  const lookTarget = useMemo(() => new Vector3(), []);
  useEffect(() => {
    const apply = (s: SceneState) => {
      const p = s.progress;
      // Continuous chapter index drives a lateral drift so the camera glides between chapters
      // instead of jumping; the store emits for reasons unrelated to either (rects, activeId,
      // …), so bail unless progress or the chapter index actually moved.
      const c = chapterIndex(s.rects, CHAPTER_IDS, s.viewport.h);
      const sig = `${p}:${c.toFixed(3)}`;
      if (sig === last.current) return;
      last.current = sig;
      const pos = lerpKeyframes(POSITION, p);
      pos[0] += DRIFT_X * Math.sin(Math.PI * c);
      camera.position.fromArray(pos);
      const tgt = lerpKeyframes(TARGET, p);
      tgt[0] += DRIFT_X * 0.5 * Math.sin(Math.PI * c);
      lookTarget.fromArray(tgt);
      camera.lookAt(lookTarget);
      invalidate();
    };
    apply(sceneStore.get());
    return sceneStore.subscribe(apply);
  }, [camera, invalidate, lookTarget]);
  return null;
}
