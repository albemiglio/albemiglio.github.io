import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, type Object3D } from 'three';
import { useModel } from '../loaders';
import type { Pose } from './pose';

type Props = { name: 'card' | 'cake' | 'capsule'; pose: Pose };

// Same discipline as IpCamera.tsx: clone per instance, rest pose captured on the clone, lerp
// with k = 1 − exp(−dt·6), invalidate() only while moving, no allocations inside useFrame. Unlike
// IpCamera this object has no rigid sub-group (every part just offsets/scales from its own rest
// position), so one generic loop over the pose's named parts covers card/cake/capsule alike.
export function PartObject({ name, pose }: Props) {
  const cached = useModel(name);
  const scene = useMemo(() => cached.scene.clone(true), [cached.scene]);
  const { invalidate } = useThree();
  const parts = useMemo(() => {
    const m = new Map<string, Object3D>();
    for (const o of scene.children[0].children) m.set(o.name, o);
    return m;
  }, [scene]);
  const rest = useMemo(
    () => new Map([...parts].map(([n, o]) => [n, { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.x }])),
    [parts],
  );
  useEffect(() => { invalidate(); }, [pose, invalidate]);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 6);
    let moving = false;
    for (const [n, o] of parts) {
      const base = rest.get(n)!;
      const t = pose.parts[n];
      if (!t) continue;
      const tx = base.p.x + t.offset[0], ty = base.p.y + t.offset[1], tz = base.p.z + t.offset[2];
      const ts = base.s * (t.scale ?? 1);
      // `moving` measures the step taken this frame, not the remaining gap: with dt = 0 (coarse
      // timestamps, throttled tabs) k is 0 and nothing moves — a gap-based check would then
      // invalidate forever. Same discipline as IpCamera.
      const nx = MathUtils.lerp(o.position.x, tx, k), ny = MathUtils.lerp(o.position.y, ty, k), nz = MathUtils.lerp(o.position.z, tz, k);
      const ns = MathUtils.lerp(o.scale.x, ts, k);
      moving ||= Math.abs(nx - o.position.x) + Math.abs(ny - o.position.y) + Math.abs(nz - o.position.z) > 1e-4 || Math.abs(ns - o.scale.x) > 1e-4;
      o.position.set(nx, ny, nz);
      o.scale.setScalar(ns);
      if (t.rotation) {
        const rx = base.r.x + t.rotation[0], ry = base.r.y + t.rotation[1], rz = base.r.z + t.rotation[2];
        const nrx = MathUtils.lerp(o.rotation.x, rx, k), nry = MathUtils.lerp(o.rotation.y, ry, k), nrz = MathUtils.lerp(o.rotation.z, rz, k);
        moving ||= Math.abs(nrx - o.rotation.x) + Math.abs(nry - o.rotation.y) + Math.abs(nrz - o.rotation.z) > 1e-4;
        o.rotation.set(nrx, nry, nrz);
      }
    }
    if (moving) invalidate();
  });
  return <primitive object={scene} />;
}
