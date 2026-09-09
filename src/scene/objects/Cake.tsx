import { useMemo } from 'react';
import { useSceneSelector } from '../store';
import { chapterPhaseFromRect, explodeAmount, heroExit } from '../math';
import { cakePose } from './cakePose';
import { PartObject } from './PartObject';
import type { PastisState } from '../../flows/pastis/steps';

const IDLE: PastisState = { column: 'new', tiers: 1, flavour: '', lettering: '', configuring: false };

export function Cake() {
  // P3-R11 fix-round-1 F3: the hero sculpture always shows the finished cake (three tiers),
  // regardless of the pastis chapter's own step state — the chapter state only applies once the
  // hero has flown out. Boolean selector, so it only re-renders once per crossing (P2-R2).
  const inHero = useSceneSelector((s) => heroExit(s.scrollY, s.viewport.h) < 1);
  const rawState = useSceneSelector((s) => (s.stepState.pastis as PastisState | undefined) ?? IDLE);
  const state = inHero ? { ...rawState, tiers: 3 as const } : rawState;
  const phase = useSceneSelector((s) => Math.round(chapterPhaseFromRect(s.rects.pastis?.chapter, s.viewport.h) * 1000) / 1000);
  const explode = Math.round(explodeAmount(phase) * 1000) / 1000;
  const pose = useMemo(() => cakePose(state, explode), [state, explode]);
  return <PartObject name="cake" pose={pose} />;
}
