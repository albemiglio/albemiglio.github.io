import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { ClampToEdgeWrapping, SRGBColorSpace, Vector3, type Group, type MeshBasicMaterial, type Texture } from 'three';
import { CAMERA_DIST, CAMERA_FOV } from './CameraRig';
import { rectToWorld } from './math';
import { rectCenterOnZPlane } from './anchor';
import { heroExitOf, sceneStore } from './store';
import { HERO_SCREENS, cropAspect } from '../heroScreens';

// A constant spin catches every panel mid-turn, where its own text is skewed and small. The ring
// rests with one panel square to the viewer instead, and turns to the next between rests: still a
// ring turning, but the reading happens while it is still.
const HOLD = 4.2; // seconds a panel stays square to the viewer
const TURN = 1.2; // seconds to bring the next one round
const RADIUS = 0.4; // ring radius, in hero-box half-widths
const TILT = -0.08; // the ring is seen slightly from above, so it reads as a ring and not a line
// Panels are sized by area, not by their longest side: a wide crop and a tall one given the same
// longest side read as a big screen and a small one, when they are meant to read as the same
// screen turned to a different product. MAX_W keeps the widest of them inside the hero box.
const AREA = 1.7; // in hero-box half-widths squared
const MAX_W = 1.95;
const FRAME = 0.035; // dark border around each screen
// A panel is only worth showing while it is turned far enough towards the viewer to be legible;
// below FADE_IN it is edge-on or facing away, and fades out rather than flipping to a mirrored back.
const FADE_IN = 0.35;
const FADE_FULL = 0.85;

const REDUCED = '(prefers-reduced-motion: reduce)';

/** How far the ring leans towards the pointer, in radians. */
export type HeroTilt = { x: number; y: number };

function Panel({ index, texture, aspect }: { index: number; texture: Texture; aspect: number }) {
  const w = Math.min(MAX_W, Math.sqrt(AREA * aspect));
  const h = w / aspect;
  return (
    <group>
      {/* The border, and the only part of a panel that is lit: a dark interface on a dark page has
          no silhouette of its own, and without an edge that catches the light the screen reads as
          a hole rather than as an object being turned. */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[w + FRAME * 2, h + FRAME * 2]} />
        <meshStandardMaterial color="#2b3038" roughness={0.35} metalness={0.6} transparent />
      </mesh>
      <mesh name={`screen-${index}`}>
        <planeGeometry args={[w, h]} />
        {/* An interface emits its own light: lighting it would only mean dimming it, and the one
            thing this panel has to do is stay readable. */}
        <meshBasicMaterial map={texture} toneMapped={false} transparent />
      </mesh>
    </group>
  );
}

/**
 * The hero: the products' own screens on panels turning about a common axis.
 *
 * Each panel faces outward from the ring, so the one at the front is square to the camera and
 * readable; as it turns away its opacity falls to zero before its back could ever show. The ring
 * is anchored to the hero box on the page and inherits the pointer tilt, so it belongs to the
 * layout rather than floating in front of it.
 */
export function HeroScreens({ tilt, still = false }: { tilt?: { current: HeroTilt }; still?: boolean }) {
  const ring = useRef<Group>(null);
  const { camera, invalidate, size: view } = useThree();
  const centre = useMemo(() => new Vector3(), []);
  const base = useRef({ visible: false, x: 0, y: 0, scale: 0, active: false });
  const spin = useRef(0);
  const reduced = useRef(false);

  const textures = useTexture(HERO_SCREENS.map((s) => s.src));

  useEffect(() => {
    textures.forEach((t, i) => {
      const { x, y, w, h } = HERO_SCREENS[i].crop;
      t.colorSpace = SRGBColorSpace;
      t.wrapS = t.wrapT = ClampToEdgeWrapping;
      // The crop, in texture space. V runs the other way to the crop's y, which is measured from
      // the top like every other rect on the page.
      t.repeat.set(w, h);
      t.offset.set(x, 1 - y - h);
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
    invalidate();
  }, [textures, invalidate]);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED);
    const read = () => { reduced.current = still || mq.matches; invalidate(); };
    read();
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
  }, [invalidate, still]);

  useEffect(() => {
    const apply = () => {
      const s = sceneStore.get();
      const rect = s.rects.hero?.object;
      const b = base.current;
      if (!rect || !s.viewport.w) { b.visible = false; return; }
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      rectCenterOnZPlane(rect, s.viewport, camera, centre);
      const world = rectToWorld(rect, s.viewport, CAMERA_FOV, CAMERA_DIST, view.width / view.height);
      b.scale = Math.min(world.scaleW, world.scaleH) / 2;
      b.x = centre.x;
      b.y = centre.y;
      // Past the hero there is nothing to keep turning for: the ring stops asking for frames.
      b.active = heroExitOf(s) < 1;
      b.visible = b.active;
      invalidate();
    };
    apply();
    return sceneStore.subscribe(apply);
  }, [camera, invalidate, centre, view.width, view.height]);

  useFrame((_, dt) => {
    const g = ring.current;
    if (!g) return;
    const b = base.current;
    g.visible = b.visible;
    if (!b.visible) return;
    g.position.set(b.x, b.y, 0);
    g.scale.setScalar(b.scale);
    if (!reduced.current) spin.current += dt;
    const t = tilt?.current;
    g.rotation.set(TILT + (t?.x ?? 0), t?.y ?? 0, 0);

    const step = (Math.PI * 2) / HERO_SCREENS.length;
    // Where the ring is: `rest` complete turns done, plus an eased fraction of the one in progress.
    const cycle = HOLD + TURN;
    const rest = Math.floor(spin.current / cycle);
    const p = ((spin.current % cycle) - HOLD) / TURN;
    const e = p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
    const angle = (rest + e) * step;
    for (let i = 0; i < g.children.length; i++) {
      const panel = g.children[i];
      const a = angle + i * step;
      panel.position.set(Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS);
      panel.rotation.y = a;
      // cos(a) is the panel normal's Z once it is turned by `a`: how squarely it faces the camera.
      const facing = Math.cos(a);
      const o = Math.max(0, Math.min(1, (facing - FADE_IN) / (FADE_FULL - FADE_IN)));
      panel.visible = o > 0;
      for (const child of panel.children) {
        const m = (child as { material?: MeshBasicMaterial }).material;
        if (m) m.opacity = o;
      }
    }
    if (!reduced.current) invalidate();
  });

  return (
    <group ref={ring} visible={false}>
      {HERO_SCREENS.map((s, i) => (
        <Panel key={s.src} index={i} texture={textures[i]} aspect={cropAspect(s)} />
      ))}
    </group>
  );
}
