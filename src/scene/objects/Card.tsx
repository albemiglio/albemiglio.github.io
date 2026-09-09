import { useMemo } from 'react';
import { Vector3 } from 'three';
import { useModel } from '../loaders';
import { heroExitOf, useSceneSelector } from '../store';
import { chapterPhaseFromRect, explodeAmount, heroExplode } from '../math';
import { cardPose } from './cardPose';
import { PartObject } from './PartObject';
import type { Vec3 } from './pose';
import type { AsdState } from '../../flows/asd/steps';

const IDLE: AsdState = { view: 'list', typed: 0, family: false, fee: 'due', receipt: false };

export function Card() {
  // Read-only lookup on the shared cached scene (not the per-instance clone PartObject makes):
  // the plate's rest quaternion never changes, so its normal is computed once here.
  const cached = useModel('card');
  const normal = useMemo<Vec3>(() => {
    const plate = cached.scene.children[0].children.find((o) => o.name === 'plate')!;
    const n = new Vector3(0, 0, 1).applyQuaternion(plate.quaternion);
    return [n.x, n.y, n.z];
  }, [cached.scene]);
  // P3-R11 fix-round-1 F3: the hero sculpture always shows the finished card (printed receipt),
  // regardless of the asd chapter's own step state — the chapter state only applies once the
  // hero has flown out. Boolean selector, so it only re-renders once per crossing (P2-R2).
  const inHero = useSceneSelector((s) => heroExitOf(s) < 1);
  const rawState = useSceneSelector((s) => (s.stepState.asd as AsdState | undefined) ?? IDLE);
  const state = inHero ? { ...rawState, receipt: true } : rawState;
  // Rounded to 3 decimals inside the selector, same as IpCamera.tsx (P2-R2): the phase changes
  // every scroll tick but the pose only differs once it crosses a ~0.001 threshold.
  const phase = useSceneSelector((s) => Math.round(chapterPhaseFromRect(s.rects.asd?.chapter, s.viewport.h) * 1000) / 1000);
  // P3-R20/F12b: the hero fly-out explodes the sculpture on top of the chapter's own explode
  // window — rounded in the selector like `phase` above, so this only re-renders while heroExit
  // is actually moving (t in (0,1)), not on every scroll pixel outside that window.
  const heroExplodeAmt = useSceneSelector((s) => Math.round(heroExplode(heroExitOf(s)) * 1000) / 1000);
  const explode = Math.max(Math.round(explodeAmount(phase) * 1000) / 1000, heroExplodeAmt);
  const pose = useMemo(() => cardPose(state, explode, normal), [state, explode, normal]);
  return <PartObject name="card" pose={pose} />;
}
