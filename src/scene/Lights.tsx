import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, type DirectionalLight } from 'three';
import { useSceneSelector } from './store';

const CHAPTER_KEY: Record<string, string> = { ipcam: '#F0B24A', asd: '#6CCB8A', pastis: '#F3A9B9', med: '#5BC8C4' };
const NEUTRAL = '#E8E0D0';

// THREE.Color has no distanceTo (that's Vector3/Vector2 only) — plain r/g/b distance instead.
function colorDistance(a: Color, b: Color): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

export function Lights({ shadows }: { shadows: boolean }) {
  const key = useRef<DirectionalLight>(null);
  const { invalidate } = useThree();
  const activeId = useSceneSelector((s) => s.activeId);
  const target = useMemo(() => new Color(CHAPTER_KEY[activeId ?? ''] ?? NEUTRAL), [activeId]);
  useFrame((_, dt) => {
    if (!key.current) return;
    key.current.color.lerp(target, Math.min(1, dt * 4));
    // P2-R3: frameloop="demand" only re-renders on invalidate(), so keep nudging it while the
    // tint is still converging toward the chapter color.
    if (colorDistance(key.current.color, target) > 1e-3) invalidate();
  });
  return (
    <>
      <directionalLight ref={key} position={[4, 6, 5]} intensity={2.0} castShadow={shadows} shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 2, 3]} intensity={0.8} color="#dbe4f0" />
      <directionalLight position={[-2, 4, -6]} intensity={1.2} color="#ffffff" />
      <ambientLight intensity={0.25} />
    </>
  );
}
