import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Matrix4, Quaternion, Vector3, type Group, type Mesh, type Object3D } from 'three';
import { useModel } from '../loaders';
import { CAMERA_DIST, CAMERA_FOV } from '../CameraRig';
import { chapterPhase, rectToWorld } from '../math';
import { sceneStore } from '../store';
import { screenCorners } from './screenAnchor';

const CHAPTER = { start: 0.1, end: 0.6 };
const YAW = MathUtils.degToRad(35);

function yawFor(phase: number) {
  if (phase < 0.35) return YAW * (1 - phase / 0.35);
  if (phase > 0.65) return -YAW * ((phase - 0.65) / 0.35);
  return 0;
}

export function Device({ id, kind }: { id: string; kind: 'laptop' | 'phone' }) {
  const { scene } = useModel(kind);
  const pivot = useRef<Group>(null);
  const { camera, invalidate, size: view } = useThree();
  const screen = useMemo(() => scene.getObjectByName('screen') as Mesh, [scene]);

  // Where the screen sits inside the model, and the plane's own size in the frame its
  // `matrixWorld` maps from. Composed from the local matrices up to `scene` rather than read off
  // `matrixWorld`: the model is not in the rendered tree yet when this runs, and re-running must
  // not fold in the offsets set below (useGLTF caches the scene across mounts, StrictMode
  // double-invokes).
  const fit = useMemo(() => {
    const rel = new Matrix4();
    for (let o: Object3D | null = screen; o && o !== scene; o = o.parent) { o.updateMatrix(); rel.premultiply(o.matrix); }
    const pos = new Vector3(), quat = new Quaternion(), scl = new Vector3();
    rel.decompose(pos, quat, scl);
    if (!screen.geometry.boundingBox) screen.geometry.computeBoundingBox();
    const size = screen.geometry.boundingBox!.getSize(new Vector3());
    return { pos, align: quat.invert().toArray() as [number, number, number, number], box: { w: size.x, h: size.y }, modelW: size.x * scl.x };
  }, [scene, screen]);

  // Sit the screen's centre on the pivot's origin and square its plane to the camera: the yaw
  // then swings the device around the screen, and the frontal pose projects to an exact identity
  // on the DOM frame. Without this the laptop's lid — modelled 10 degrees back, like a real one —
  // would keep the handoff matrix perspective-warped even at rest.
  useEffect(() => { scene.position.copy(fit.pos).negate(); scene.quaternion.identity(); }, [scene, fit]);
  useEffect(() => () => sceneStore.setQuad(id, null), [id]);

  // P2-R2: the store emits for reasons unrelated to this device (other chapters' stepState,
  // activeId, …). Ask for a frame only when something the device actually reads has moved; the
  // work itself happens in useFrame, which `frameloop="demand"` would otherwise never run.
  useEffect(() => {
    let last = '';
    const check = () => {
      const s = sceneStore.get();
      const r = s.rects[id]?.frame;
      const sig = `${r?.x},${r?.y},${r?.w},${r?.h},${s.viewport.w},${s.viewport.h},${Math.round(s.progress * 1000)}`;
      if (sig === last) return;
      last = sig;
      invalidate();
    };
    check();
    return sceneStore.subscribe(check);
  }, [id, invalidate]);

  useFrame(() => {
    const s = sceneStore.get();
    const rect = s.rects[id]?.frame;
    const p = pivot.current;
    if (!p || !rect || !s.viewport.w) { if (p) p.visible = false; sceneStore.setQuad(id, null); return; }
    const w = rectToWorld(rect, s.viewport, CAMERA_FOV, CAMERA_DIST, view.width / view.height);
    p.visible = true;
    p.position.set(w.x, w.y, 0);
    p.scale.setScalar(w.scaleW / fit.modelW);
    const targetYaw = yawFor(chapterPhase(s.progress, CHAPTER.start, CHAPTER.end));
    p.rotation.y = MathUtils.lerp(p.rotation.y, targetYaw, 0.25);
    p.updateMatrixWorld(true);
    sceneStore.setQuad(id, screenCorners(fit.box, screen.matrixWorld, camera, s.viewport));
    // P2-R2: only while the yaw is still converging — an unconditional invalidate() here would
    // spin the render loop forever.
    if (Math.abs(p.rotation.y - targetYaw) > 1e-3) invalidate();
  });

  return (
    <group ref={pivot}>
      <group quaternion={fit.align}><primitive object={scene} /></group>
    </group>
  );
}
