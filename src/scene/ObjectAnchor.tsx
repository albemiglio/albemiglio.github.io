import { useEffect, useRef, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { CAMERA_DIST, CAMERA_FOV } from './CameraRig';
import { rectToWorld } from './math';
import { sceneStore } from './store';

type Signature = { x: number; y: number; w: number; h: number; vw: number; vh: number };

// Places its children where the chapter's `.chapter__object` box is on the page.
export function ObjectAnchor({ id, size = 0.8, children }: { id: string; size?: number; children: ReactNode }) {
  const g = useRef<Group>(null);
  const { invalidate, size: view } = useThree();
  const last = useRef<Signature | null>(null);
  useEffect(() => {
    const apply = () => {
      const s = sceneStore.get();
      const rect = s.rects[id]?.object;
      if (!g.current || !rect || !s.viewport.w) { if (g.current) g.current.visible = false; return; }
      // P2-R2: the store emits for reasons unrelated to this chapter's rect (progress, other
      // chapters' stepState, …); bail unless the rect or viewport actually moved, so we don't
      // re-set the same transform and invalidate() on every scroll frame.
      const sig: Signature = { x: rect.x, y: rect.y, w: rect.w, h: rect.h, vw: s.viewport.w, vh: s.viewport.h };
      const prev = last.current;
      if (prev && prev.x === sig.x && prev.y === sig.y && prev.w === sig.w && prev.h === sig.h && prev.vw === sig.vw && prev.vh === sig.vh) return;
      last.current = sig;
      const w = rectToWorld(rect, s.viewport, CAMERA_FOV, CAMERA_DIST, view.width / view.height);
      const scale = (Math.min(w.scaleW, w.scaleH) * size) / 2; // models are ~2 units wide
      g.current.position.set(w.x, w.y, 0);
      g.current.scale.setScalar(scale);
      g.current.visible = true;
      invalidate();
    };
    apply();
    const off = sceneStore.subscribe(apply);
    window.addEventListener('scroll', apply, { passive: true });
    return () => { off(); window.removeEventListener('scroll', apply); };
  }, [id, size, invalidate, view.width, view.height]);
  return <group ref={g}>{children}</group>;
}
