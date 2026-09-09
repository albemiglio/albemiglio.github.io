import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils, MeshStandardMaterial, type Mesh, type Object3D } from 'three';
import { useModel } from '../loaders';
import { useSceneSelector } from '../store';
import { chapterPhaseFromRect, explodeAmount } from '../math';
import { ipcamPose } from './ipcamPose';
import type { IpcamState } from '../../flows/ipcam/steps';

const IDLE: IpcamState = { view: 'grid', pan: 0, tilt: 0, rec: false, clips: 0, talk: false };

// lens/cradle/leds each carry their own local origin in the glTF (not a shared point — see
// task-6-report.md), so rotating them individually would swing each around a different pivot
// and tear the head apart. Reparent them once under a group at the cradle's own origin and
// rotate that group instead; the guard makes the reparent idempotent (StrictMode double-invokes
// this memo, and useGLTF's scene is cached across mounts).
const HEAD_NAME = 'head-pivot';
const HEAD_PARTS = ['cradle', 'leds', 'lens'];

export function IpCamera() {
  const cached = useModel('ipcam');
  // I3 (same fix as Device.tsx F1): useGLTF caches the scene per URL. The code below reparents
  // nodes into a new group and writes emissiveIntensity on a material — mutating the cached
  // scene in place would corrupt it for every other consumer sharing the cache. Clone per
  // instance; only the one material actually written to needs its own clone (see below).
  const scene = useMemo(() => cached.scene.clone(true), [cached.scene]);
  const root = useRef<Group>(null);
  const { invalidate } = useThree();

  // Reparents cradle/leds/lens into `head` on first use; idempotent via the `!head` guard above
  // (see the file-top comment) so StrictMode's double-invoke and useGLTF's cached scene are safe.
  const { parts, head } = useMemo(() => {
    const rootNode = scene.children[0];
    const map = new Map<string, Object3D>();
    for (const o of rootNode.children) map.set(o.name, o);
    let head = map.get(HEAD_NAME) as Group | undefined;
    if (!head) {
      head = new Group();
      head.name = HEAD_NAME;
      const pivot = map.get('cradle')!.position.clone();
      head.position.copy(pivot);
      rootNode.add(head);
      for (const name of HEAD_PARTS) {
        const o = map.get(name)!;
        o.position.sub(pivot);
        head.add(o);
      }
    }
    for (const o of head.children) map.set(o.name, o);
    return { parts: map, head };
  }, [scene]);
  // I3: clone status_led's material once (idempotent — see the `!head` guard above for why this
  // memo is safe to run more than once) so the emissiveIntensity write in useFrame below lands on
  // this instance's own material, not the one every other `useModel('ipcam')` consumer shares.
  useMemo(() => {
    const status = parts.get('status_led') as Mesh | undefined;
    if (status) status.material = (status.material as MeshStandardMaterial).clone();
  }, [parts]);
  // <primitive> does not dispose on unmount; the clone above is ours to free.
  useEffect(() => () => {
    const status = parts.get('status_led') as Mesh | undefined;
    (status?.material as MeshStandardMaterial | undefined)?.dispose();
  }, [parts]);
  // Captured once, before any useFrame lerp mutates these — head's own rest position is needed
  // separately since it isn't a member of `parts` (it's the group the head parts live under).
  const { rest, restHeadY } = useMemo(
    () => ({ rest: new Map([...parts].map(([n, o]) => [n, { p: o.position.clone() }])), restHeadY: head.position.y }),
    [parts, head],
  );

  const state = useSceneSelector((s) => (s.stepState.ipcam as IpcamState | undefined) ?? IDLE);
  // Round to 3 decimals inside the selector: the phase (and so `explode`) changes on every
  // scroll tick, but the pose only actually differs once it crosses a ~0.001 threshold — this
  // keeps IpCamera from even re-rendering outside the explode window (P2-R2).
  const phase = useSceneSelector((s) => Math.round(chapterPhaseFromRect(s.rects.ipcam?.chapter, s.viewport.h) * 1000) / 1000);
  const explode = Math.round(explodeAmount(phase) * 1000) / 1000;
  const target = useMemo(() => ipcamPose(state, explode), [state, explode]);
  useEffect(() => { invalidate(); }, [target, invalidate]);

  useFrame((_, dt) => {
    let moving = false;
    const k = 1 - Math.exp(-dt * 6);
    for (const [name, o] of parts) {
      // Head parts (cradle/leds/lens) stay put in local space — they rise and turn as one rigid
      // body via `head`'s own position/rotation below (P2-R8), not individually.
      if (HEAD_PARTS.includes(name)) continue;
      const base = rest.get(name);
      const t = target.parts[name];
      if (!base || !t) continue;
      const nx = MathUtils.lerp(o.position.x, base.p.x + t.offset[0], k);
      const ny = MathUtils.lerp(o.position.y, base.p.y + t.offset[1], k);
      const nz = MathUtils.lerp(o.position.z, base.p.z + t.offset[2], k);
      moving ||= Math.abs(ny - o.position.y) > 1e-4;
      o.position.set(nx, ny, nz);
    }
    const headLift = target.parts.cradle.offset[1];
    const nhy = MathUtils.lerp(head.position.y, restHeadY + headLift, k);
    moving ||= Math.abs(nhy - head.position.y) > 1e-4;
    head.position.y = nhy;
    const [pitch, yaw] = target.parts.cradle.rotation!;
    const nrx = MathUtils.lerp(head.rotation.x, pitch, k);
    const nry = MathUtils.lerp(head.rotation.y, yaw, k);
    moving ||= Math.abs(nrx - head.rotation.x) > 1e-4 || Math.abs(nry - head.rotation.y) > 1e-4;
    head.rotation.set(nrx, nry, 0);
    const status = parts.get('status_led') as Mesh | undefined;
    const mat = status?.material as MeshStandardMaterial | undefined;
    if (mat) {
      const nextEmissive = MathUtils.lerp(mat.emissiveIntensity, target.statusOn ? 3 : 0.4, 0.2);
      moving ||= Math.abs(nextEmissive - mat.emissiveIntensity) > 1e-3;
      mat.emissiveIntensity = nextEmissive;
    }
    if (moving) invalidate();
  });

  return <primitive ref={root} object={scene} />;
}
