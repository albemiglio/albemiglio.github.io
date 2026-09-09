import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, type DirectionalLight } from 'three';
import { useSceneSelector } from './store';

const CHAPTER_KEY: Record<string, string> = { ipcam: '#F0B24A', asd: '#6CCB8A', pastis: '#F3A9B9', med: '#5BC8C4' };
const NEUTRAL = '#E8E0D0';

// THREE.Color has no distanceTo (that's Vector3/Vector2 only) — plain r/g/b distance instead.
function colorDistance(a: Color, b: Color): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

// A fully saturated chapter color reads as a paint on the metallic PBR device materials (see
// fix-device-front.png — brushed aluminium reads as gold). Lerping 60% toward white keeps the
// hue as a cast on the metal rather than a full repaint.
export function chapterKeyColor(hex: string): Color {
  return new Color(hex).lerp(new Color('#ffffff'), 0.6);
}

export function Lights({ shadows }: { shadows: boolean }) {
  const key = useRef<DirectionalLight>(null);
  const { invalidate } = useThree();
  const activeId = useSceneSelector((s) => s.activeId);
  const target = useMemo(() => chapterKeyColor(CHAPTER_KEY[activeId ?? ''] ?? NEUTRAL), [activeId]);
  // M1: frameloop="demand" only renders on invalidate(). A chapter change with the scroll
  // position otherwise unchanged (e.g. a click on a StepBar step) never invalidates on its own,
  // so the tint lerp above would never get a frame to run in.
  useEffect(() => { invalidate(); }, [target, invalidate]);
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
