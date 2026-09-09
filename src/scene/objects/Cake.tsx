import { useMemo } from 'react';
import { useSceneSelector } from '../store';
import { chapterPhaseFromRect, explodeAmount } from '../math';
import { cakePose } from './cakePose';
import { PartObject } from './PartObject';
import type { PastisState } from '../../flows/pastis/steps';

const IDLE: PastisState = { column: 'new', tiers: 1, flavour: '', lettering: '', configuring: false };

export function Cake() {
  const state = useSceneSelector((s) => (s.stepState.pastis as PastisState | undefined) ?? IDLE);
  const phase = useSceneSelector((s) => Math.round(chapterPhaseFromRect(s.rects.pastis?.chapter, s.viewport.h) * 1000) / 1000);
  const explode = Math.round(explodeAmount(phase) * 1000) / 1000;
  const pose = useMemo(() => cakePose(state, explode), [state, explode]);
  return <PartObject name="cake" pose={pose} />;
}
