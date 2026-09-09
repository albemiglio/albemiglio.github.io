import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { MathUtils, Vector3, type Group } from 'three';
import { CAMERA_DIST, CAMERA_FOV } from './CameraRig';
import { flightTarget, heroExit, rectToWorld, type Rect, type Vec3 } from './math';
import { rectCenterOnZPlane } from './devices/screenAnchor';
import { sceneStore } from './store';

export type HeroSlot = { position: Vec3; rotation: Vec3; scale: number };
export type HeroTilt = { x: number; y: number };

// Fixed rotation axes for tilting the slot offset — never mutated, so sharing them across every
// ObjectAnchor instance (and every frame) is safe; only `slotVec` below is written into.
const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Y = new Vector3(0, 1, 0);

type Signature = {
  x: number; y: number; w: number; h: number; vw: number; vh: number;
  hx: number; hy: number; hw: number; hh: number; t: number;
};

// The camera-projection numbers (expensive: unproject + matrix invert) only change when a rect,
// the viewport, or heroExit's `t` actually moves — cached here and refreshed by the store-driven
// effect below. The per-frame `useFrame` blends these with the live pointer tilt, which changes
// far more often than any of that and costs nothing to recompute every rendered frame.
type Base = {
  visible: boolean; haveChapter: boolean; haveHero: boolean; t: number;
  heroX: number; heroY: number; heroScale: number;
  chapterX: number; chapterY: number; chapterScale: number;
};

// Places its children where the chapter's `.chapter__object` box is on the page, in the
// three-quarter presentation pose the fallback stills were rendered from (P2-R9). When `heroSlot`
// is given, the object starts life at that offset inside the hero sculpture box and blends into
// the chapter placement as the visitor scrolls past heroExit (P3-R3/R8).
export function ObjectAnchor({
  id, size = 0.8, pose = [-0.35, 0.5, 0], shadows = true, heroSlot, heroTilt, children,
}: {
  id: string; size?: number; pose?: Vec3; shadows?: boolean;
  heroSlot?: HeroSlot; heroTilt?: { current: HeroTilt }; children: ReactNode;
}) {
  const g = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const { camera, invalidate, size: view } = useThree();
  const last = useRef<Signature | null>(null);
  const centre = useMemo(() => new Vector3(), []);
  const heroCentre = useMemo(() => new Vector3(), []);
  const slotVec = useMemo(() => new Vector3(), []);
  const targetRect = useMemo<Rect>(() => ({ x: 0, y: 0, w: 0, h: 0 }), []);
  const base = useRef<Base>({
    visible: false, haveChapter: false, haveHero: false, t: 1,
    heroX: 0, heroY: 0, heroScale: 0, chapterX: 0, chapterY: 0, chapterScale: 0,
  });

  useEffect(() => {
    const apply = () => {
      const s = sceneStore.get();
      const rect = s.rects[id]?.object;
      const heroRect = heroSlot ? s.rects.hero?.object : undefined;
      const haveChapter = !!rect;
      const haveHero = !!heroSlot && !!heroRect;
      if (!g.current || !s.viewport.w || (!haveChapter && !haveHero)) {
        base.current.visible = false;
        return;
      }
      const t = heroSlot ? heroExit(s.scrollY, s.viewport.h) : 1;
      // P2-R2: the store emits for reasons unrelated to this chapter's rect (progress, other
      // chapters' stepState, …); bail unless a rect, the viewport or heroExit actually moved, so
      // we don't redo the projection math and invalidate() on every scroll frame.
      const sig: Signature = {
        x: rect?.x ?? 0, y: rect?.y ?? 0, w: rect?.w ?? 0, h: rect?.h ?? 0,
        vw: s.viewport.w, vh: s.viewport.h,
        hx: heroRect?.x ?? 0, hy: heroRect?.y ?? 0, hw: heroRect?.w ?? 0, hh: heroRect?.h ?? 0,
        t,
      };
      const prev = last.current;
      if (
        prev && prev.x === sig.x && prev.y === sig.y && prev.w === sig.w && prev.h === sig.h &&
        prev.vw === sig.vw && prev.vh === sig.vh && prev.hx === sig.hx && prev.hy === sig.hy &&
        prev.hw === sig.hw && prev.hh === sig.hh && prev.t === sig.t
      ) return;
      last.current = sig;
      // F3b: `rectToWorld` assumes a camera looking straight down -Z, which no longer holds once
      // the chapter camera pitches; the position comes from unprojecting through the real camera
      // instead. The FOV/distance scale formula is left as-is — a decorative object's size isn't
      // held to the DOM-handoff's identity tolerance.
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const b = base.current;
      b.visible = true;
      b.haveChapter = haveChapter;
      b.haveHero = haveHero;
      b.t = t;
      if (haveChapter) {
        // P3-R12 fix-round-1 F1: clamp how far below the fold the blend target can be while
        // still mid-flight (t < 1) — see flightTarget in math.ts. At t >= 1 this is a no-op copy.
        const target = flightTarget(rect!, s.viewport.h, t, targetRect);
        rectCenterOnZPlane(target, s.viewport, camera, centre);
        const w = rectToWorld(target, s.viewport, CAMERA_FOV, CAMERA_DIST, view.width / view.height);
        b.chapterScale = (Math.min(w.scaleW, w.scaleH) * size) / 2; // models are ~2 units wide
        b.chapterX = centre.x;
        b.chapterY = centre.y;
      }
      if (haveHero) {
        rectCenterOnZPlane(heroRect!, s.viewport, camera, heroCentre);
        const w = rectToWorld(heroRect!, s.viewport, CAMERA_FOV, CAMERA_DIST, view.width / view.height);
        // F1/P3-R17: no `size` here — heroSlots.json (position/rotation/scale) is the only
        // authority for the hero slot, matching tools/models/hero.py verbatim. `size` only
        // scales the chapter placement above.
        b.heroScale = Math.min(w.scaleW, w.scaleH) / 2;
        b.heroX = heroCentre.x;
        b.heroY = heroCentre.y;
      }
      invalidate();
    };
    apply();
    // M4: no separate scroll listener — the rect this reads only ever changes via
    // useRectRegistration's rAF-scheduled `setRect`, and scrollY via useSceneProgress's own
    // rAF-scheduled listener; both already go through the store subscription below.
    const off = sceneStore.subscribe(apply);
    return () => { off(); };
  }, [id, size, camera, invalidate, view.width, view.height, heroSlot, centre, heroCentre, targetRect]);

  // Runs on every rendered frame (R3F only renders one on demand — via the store-driven
  // invalidate() above, or HeroSculpture's own pointer-convergence loop), blending the cached
  // hero/chapter numbers with the live pointer tilt. No allocations: `slotVec` and the two axis
  // constants are reused every call.
  useFrame(() => {
    const grp = g.current, innerGrp = inner.current;
    if (!grp) return;
    const b = base.current;
    grp.visible = b.visible;
    if (!b.visible) return;
    if (!heroSlot || !b.haveHero) {
      grp.position.set(b.chapterX, b.chapterY, 0);
      grp.scale.setScalar(b.chapterScale);
      if (innerGrp) innerGrp.rotation.set(pose[0], pose[1], pose[2]);
      return;
    }
    const tilt = heroTilt?.current;
    const tx = tilt?.x ?? 0, ty = tilt?.y ?? 0;
    slotVec.set(heroSlot.position[0], heroSlot.position[1], heroSlot.position[2]);
    slotVec.applyAxisAngle(AXIS_Y, ty).applyAxisAngle(AXIS_X, tx);
    const heroX = b.heroX + slotVec.x * b.heroScale;
    const heroY = b.heroY + slotVec.y * b.heroScale;
    const heroZ = slotVec.z * b.heroScale;
    const heroObjScale = b.heroScale * heroSlot.scale;
    const t = b.haveChapter ? b.t : 0;
    grp.position.set(
      MathUtils.lerp(heroX, b.chapterX, t),
      MathUtils.lerp(heroY, b.chapterY, t),
      MathUtils.lerp(heroZ, 0, t),
    );
    grp.scale.setScalar(MathUtils.lerp(heroObjScale, b.chapterScale, t));
    if (innerGrp) {
      innerGrp.rotation.set(
        MathUtils.lerp(heroSlot.rotation[0] + tx, pose[0], t),
        MathUtils.lerp(heroSlot.rotation[1] + ty, pose[1], t),
        MathUtils.lerp(heroSlot.rotation[2], pose[2], t),
      );
    }
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
