import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { ClampToEdgeWrapping, SRGBColorSpace, Vector3, type Group, type MeshBasicMaterial, type Texture } from 'three';
import { CAMERA_DIST, CAMERA_FOV } from './CameraRig';
import { rectToWorld } from './math';
import { rectCenterOnZPlane } from './anchor';
import { heroExitOf, sceneStore } from './store';
import { HERO_SCREENS, cropAspect } from '../heroScreens';

// The ring rests, then turns: a constant spin catches every panel mid-turn, where its text is skewed.
const HOLD = 4.2; // seconds a panel stays square to the viewer
const TURN = 1.2; // seconds to bring the next one round
const RADIUS = 0.4; // ring radius, in hero-box half-widths
const TILT = -0.08; // the ring is seen slightly from above, so it reads as a ring and not a line
// Sized by area, not longest side: otherwise a wide crop and a tall one read as different screens.
const AREA = 1.7; // in hero-box half-widths squared
const MAX_W = 1.95;
const FRAME = 0.035; // dark border around each screen
// Below FADE_IN the panel is edge-on or facing away: it fades rather than showing a mirrored back.
const FADE_IN = 0.35;
const FADE_FULL = 0.85;

const REDUCED = '(prefers-reduced-motion: reduce)';

export type HeroTilt = { x: number; y: number };

function Panel({ index, texture, aspect }: { index: number; texture: Texture; aspect: number }) {
  const w = Math.min(MAX_W, Math.sqrt(AREA * aspect));
  const h = w / aspect;
  return (
    <group>
      {/* The border, and the only lit part: a dark interface on a dark page has no silhouette. */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[w + FRAME * 2, h + FRAME * 2]} />
        <meshStandardMaterial color="#2b3038" roughness={0.35} metalness={0.6} transparent />
      </mesh>
      <mesh name={`screen-${index}`}>
        <planeGeometry args={[w, h]} />
        {/* Unlit on purpose: an interface emits its own light, so lighting it only dims it. */}
        <meshBasicMaterial map={texture} toneMapped={false} transparent />
      </mesh>
    </group>
  );
}

export function HeroScreens({ tilt, still = false }: { tilt?: { current: HeroTilt }; still?: boolean }) {
  const ring = useRef<Group>(null);
  const { camera, invalidate, size: view } = useThree();
  const centre = useMemo(() => new Vector3(), []);
  const base = useRef({ visible: false, x: 0, y: 0, scale: 0, active: false });
  const spin = useRef(0);
  const shown = useRef(0);
  const reduced = useRef(false);

  const textures = useTexture(HERO_SCREENS.map((s) => s.src));

  useEffect(() => {
    textures.forEach((t, i) => {
      const { x, y, w, h } = HERO_SCREENS[i].crop;
      t.colorSpace = SRGBColorSpace;
      t.wrapS = t.wrapT = ClampToEdgeWrapping;
      // V runs the other way to the crop's y, which is measured from the top.
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
      // Half the box's WIDTH, not its smaller side: the panels are sized in these units, so
      // tying them to the height too would shrink them whenever the box gets shorter — and the
      // box is only as tall as the tallest panel plus its caption.
      b.scale = world.scaleW / 2;
      b.x = centre.x;
      b.y = centre.y;
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
    const cycle = HOLD + TURN;
    const rest = Math.floor(spin.current / cycle);
    const p = ((spin.current % cycle) - HOLD) / TURN;
    const e = p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
    const angle = (rest + e) * step;
    // Which panel is square to the viewer, for the caption in the DOM to name.
    const front = ((-rest % HERO_SCREENS.length) + HERO_SCREENS.length) % HERO_SCREENS.length;
    if (front !== shown.current) { shown.current = front; sceneStore.set({ heroIndex: front }); }
    for (let i = 0; i < g.children.length; i++) {
      const panel = g.children[i];
      const a = angle + i * step;
      panel.position.set(Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS);
      panel.rotation.y = a;
      // cos(a) is the panel normal's Z once turned by `a`: how squarely it faces the camera.
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
