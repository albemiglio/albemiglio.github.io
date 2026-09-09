import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Matrix4, Quaternion, Vector3, type Group, type Mesh, type Object3D } from 'three';
import { useModel } from '../loaders';
import { chapterPhase } from '../math';
import { sceneStore } from '../store';
import { rectCenterOnZPlane, screenCorners } from './screenAnchor';

const CHAPTER = { start: 0.1, end: 0.6 };
const YAW = MathUtils.degToRad(35);

function yawFor(phase: number) {
  if (phase < 0.35) return YAW * (1 - phase / 0.35);
  if (phase > 0.65) return -YAW * ((phase - 0.65) / 0.35);
  return 0;
}

export function Device({ id, kind }: { id: string; kind: 'laptop' | 'phone' }) {
  const cached = useModel(kind);
  // F1: useGLTF caches the scene per URL, so two Devices sharing `kind` would otherwise fight
  // over one Object3D's transform. Clone per instance; materials stay shared (not mutated here).
  const scene = useMemo(() => cached.scene.clone(true), [cached.scene]);
  const pivot = useRef<Group>(null);
  const yaw = useRef(YAW);
  const { camera, invalidate } = useThree();
  const screen = useMemo(() => scene.getObjectByName('screen') as Mesh, [scene]);

  // Where the screen sits inside the model, and the plane's own size in the frame its
  // `matrixWorld` maps from. Composed from the local matrices up to `scene` rather than read off
  // `matrixWorld`: the model is not in the rendered tree yet when this runs, and re-running must
  // not fold in the offsets set below (idempotent under StrictMode's double-invoke).
  const fit = useMemo(() => {
    const rel = new Matrix4();
    for (let o: Object3D | null = screen; o && o !== scene; o = o.parent) { o.updateMatrix(); rel.premultiply(o.matrix); }
    const pos = new Vector3(), quat = new Quaternion(), scl = new Vector3();
    rel.decompose(pos, quat, scl);
    if (!screen.geometry.boundingBox) screen.geometry.computeBoundingBox();
    const size = screen.geometry.boundingBox!.getSize(new Vector3());
    return { pos, align: quat.invert().toArray() as [number, number, number, number], box: { w: size.x, h: size.y } };
  }, [scene, screen]);

  // Sit the screen's centre on the pivot's origin and square its plane to the pivot's own +Z
  // (see the alignment group below): at yaw 0 with the pivot's +Z aligned to the camera's view
  // direction, the screen plane sits exactly parallel to the image plane and the handoff matrix
  // reaches identity.
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

  const forward = useMemo(() => new Vector3(), []);
  const lookTarget = useMemo(() => new Vector3(), []);

  useFrame(() => {
    // F4: the renderer only refreshes the camera's view matrix once per render; CameraRig moves
    // the camera synchronously on a store emit before that happens, so project/unproject here
    // would otherwise read a one-frame-stale matrix.
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

    const s = sceneStore.get();
    const rect = s.rects[id]?.frame;
    const p = pivot.current;
    if (!p || !rect || !s.viewport.w) { if (p) p.visible = false; sceneStore.setQuad(id, null); return; }

    // F3b: the chapter keyframes now pitch the camera, so `rectToWorld` (which assumes a camera
    // looking straight down -Z) can no longer place the device. Unproject the rect's centre
    // through the real camera onto the z=0 plane instead.
    const centre = rectCenterOnZPlane(rect, s.viewport, camera);
    p.visible = true;
    p.position.set(centre.x, centre.y, 0);

    // Face the pivot's +Z back along the camera's actual viewing direction — not at the camera's
    // position, which for an off-centre device would tilt the plane relative to the image plane
    // and reintroduce a residual perspective skew even at yaw 0. Aligning to the (fixed) view
    // direction keeps the frontal projection undistorted regardless of how far off-centre the
    // chapter's frame rect is, exactly like the old fixed-camera version. `Object3D.lookAt` points
    // the object's local +Z axis AT the target, so the target sits behind the plane relative to
    // the camera's line of sight — i.e. in the direction opposite `forward`.
    camera.getWorldDirection(forward);
    lookTarget.copy(p.position).sub(forward);
    p.lookAt(lookTarget);

    const targetYaw = yawFor(chapterPhase(s.progress, CHAPTER.start, CHAPTER.end));
    yaw.current = MathUtils.lerp(yaw.current, targetYaw, 0.25);
    p.rotateY(yaw.current);

    // The old FOV/distance scale formula only held for a camera looking straight down -Z; seed a
    // scale, read back the projected width it produces, and correct once. Exact when the plane is
    // square to the camera (frontal — all four corners then share one depth), a close
    // approximation otherwise.
    p.scale.setScalar(1);
    p.updateMatrixWorld(true);
    const probe = screenCorners(fit.box, screen.matrixWorld, camera, s.viewport);
    const probeW = Math.hypot(probe[1].x - probe[0].x, probe[1].y - probe[0].y);
    if (probeW > 1e-6) {
      p.scale.setScalar(rect.w / probeW);
      p.updateMatrixWorld(true);
    }
    sceneStore.setQuad(id, screenCorners(fit.box, screen.matrixWorld, camera, s.viewport));
    // P2-R2: only while the yaw is still converging — an unconditional invalidate() here would
    // spin the render loop forever.
    if (Math.abs(yaw.current - targetYaw) > 1e-3) invalidate();
  });

  return (
    <group ref={pivot}>
      <group quaternion={fit.align}><primitive object={scene} /></group>
    </group>
  );
}
