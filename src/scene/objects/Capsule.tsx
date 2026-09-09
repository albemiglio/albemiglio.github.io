import { useMemo } from 'react';
import { useSceneSelector } from '../store';
import { chapterPhaseFromRect, explodeAmount } from '../math';
import { capsulePose } from './capsulePose';
import { PartObject } from './PartObject';
import type { MedState } from '../../flows/med/steps';

const IDLE: MedState = { question: 1, selected: null, review: false, score: 7, timer: false };

export function Capsule() {
  const state = useSceneSelector((s) => (s.stepState.med as MedState | undefined) ?? IDLE);
  const phase = useSceneSelector((s) => Math.round(chapterPhaseFromRect(s.rects.med?.chapter, s.viewport.h) * 1000) / 1000);
  const explode = Math.round(explodeAmount(phase) * 1000) / 1000;
  const pose = useMemo(() => capsulePose(state, explode), [state, explode]);
  return <PartObject name="capsule" pose={pose} />;
}
