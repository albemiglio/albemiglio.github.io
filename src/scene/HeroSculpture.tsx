import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Suspense } from 'react';
import { HeroScreens, type HeroTilt } from './HeroScreens';
import { heroExitOf, sceneStore } from './store';

const YAW = 0.15; // rotation.y per unit of normalised pointer x
const PITCH = 0.1; // rotation.x per unit of normalised pointer y (inverted: up tilts back)
const CONVERGE = 5; // k = 1 - exp(-dt * CONVERGE)

// Owns the hero's pointer tilt: while the visitor hasn't started exiting the hero (heroExit < 1,
// P3-R8), the ring of screens leans towards the pointer with inertia. The listener comes off
// entirely once heroExit reaches 1, and the tilt relaxes back to 0 rather than snapping.
export function HeroSculpture() {
  const { invalidate } = useThree();
  const heroTilt = useRef<HeroTilt>({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const listening = useRef(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    const sync = () => {
      const s = sceneStore.get();
      const exiting = heroExitOf(s) < 1;
      if (exiting === listening.current) return;
      listening.current = exiting;
      if (exiting) window.addEventListener('pointermove', onMove, { passive: true });
      else window.removeEventListener('pointermove', onMove);
      invalidate();
    };
    sync();
    const off = sceneStore.subscribe(sync);
    return () => { off(); window.removeEventListener('pointermove', onMove); };
  }, [invalidate]);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * CONVERGE);
    const targetX = listening.current ? -pointer.current.y * PITCH : 0;
    const targetY = listening.current ? pointer.current.x * YAW : 0;
    const tilt = heroTilt.current;
    const nx = tilt.x + (targetX - tilt.x) * k;
    const ny = tilt.y + (targetY - tilt.y) * k;
    const moving = Math.abs(nx - tilt.x) + Math.abs(ny - tilt.y) > 1e-3;
    tilt.x = nx;
    tilt.y = ny;
    if (moving) invalidate();
  });

  return (
    <Suspense fallback={null}>
      <HeroScreens tilt={heroTilt} />
    </Suspense>
  );
}
