import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Vector3, type Group } from 'three';
import { CAMERA_DIST, CAMERA_FOV } from './CameraRig';
import { rectToWorld, type Vec3 } from './math';
import { rectCenterOnZPlane } from './devices/screenAnchor';
import { sceneStore } from './store';

type Signature = { x: number; y: number; w: number; h: number; vw: number; vh: number };

// The camera-projection numbers (expensive: unproject + matrix invert) only change when the rect
// or the viewport actually moves — cached here and refreshed by the store-driven effect below,
// so the per-frame `useFrame` only has to copy them onto the group.
type Base = { visible: boolean; x: number; y: number; scale: number };

// Places its children where the chapter's `.chapter__object` box is on the page, in the
// three-quarter presentation pose the fallback stills were rendered from (P2-R9).
export function ObjectAnchor({
  id, size = 0.8, pose = [-0.35, 0.5, 0], shadows = true, children,
}: {
  id: string; size?: number; pose?: Vec3; shadows?: boolean; children: ReactNode;
}) {
  const g = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const { camera, invalidate, size: view } = useThree();
  const last = useRef<Signature | null>(null);
  const centre = useMemo(() => new Vector3(), []);
  const base = useRef<Base>({ visible: false, x: 0, y: 0, scale: 0 });

  useEffect(() => {
    const apply = () => {
      const s = sceneStore.get();
      const rect = s.rects[id]?.object;
      if (!g.current || !s.viewport.w || !rect) {
        base.current.visible = false;
        return;
      }
      // P2-R2: the store emits for reasons unrelated to this chapter's rect (progress, other
      // chapters' stepState, …); bail unless a rect or the viewport actually moved, so we don't
      // redo the projection math and invalidate() on every scroll frame.
      const sig: Signature = { x: rect.x, y: rect.y, w: rect.w, h: rect.h, vw: s.viewport.w, vh: s.viewport.h };
      const prev = last.current;
      if (
        prev && prev.x === sig.x && prev.y === sig.y && prev.w === sig.w && prev.h === sig.h &&
        prev.vw === sig.vw && prev.vh === sig.vh
      ) return;
      last.current = sig;
      // F3b: `rectToWorld` assumes a camera looking straight down -Z, which no longer holds once
      // the chapter camera pitches; the position comes from unprojecting through the real camera
      // instead. The FOV/distance scale formula is left as-is — a decorative object's size isn't
      // held to the DOM-handoff's identity tolerance.
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      rectCenterOnZPlane(rect, s.viewport, camera, centre);
      const w = rectToWorld(rect, s.viewport, CAMERA_FOV, CAMERA_DIST, view.width / view.height);
      const b = base.current;
      b.visible = true;
      b.scale = (Math.min(w.scaleW, w.scaleH) * size) / 2; // models are ~2 units wide
      b.x = centre.x;
      b.y = centre.y;
      invalidate();
    };
    apply();
    // M4: no separate scroll listener — the rect this reads only ever changes via
    // useRectRegistration's rAF-scheduled `setRect`, and scrollY via useSceneProgress's own
    // rAF-scheduled listener; both already go through the store subscription below.
    const off = sceneStore.subscribe(apply);
    return () => { off(); };
  }, [id, size, camera, invalidate, view.width, view.height, centre]);

  // Runs on every rendered frame (R3F only renders one on demand — via the store-driven
  // invalidate() above, or the hero's own pointer-convergence loop).
  useFrame(() => {
    const grp = g.current, innerGrp = inner.current;
    if (!grp) return;
    const b = base.current;
    grp.visible = b.visible;
    if (!b.visible) return;
    grp.position.set(b.x, b.y, 0);
    grp.scale.setScalar(b.scale);
    if (innerGrp) innerGrp.rotation.set(pose[0], pose[1], pose[2]);
  });

  return (
    <group ref={g} visible={false}>
      <group ref={inner} rotation={pose}>{children}</group>
      {/* Inside the anchor, so it rides along with the object's page position and scale. F2:
          skipped on small viewports, matching SceneCanvas's own shadow gate. */}
      {shadows && <ContactShadows position={[0, -1.1, 0]} opacity={0.35} scale={4} blur={2.2} far={2.5} />}
    </group>
  );
}
