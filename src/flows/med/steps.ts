import type { Step } from '../types';

export type MedState = { question: 1 | 2; selected: 'A' | 'B' | 'C' | 'D' | null; review: boolean; score: number; timer: boolean };

const idle: MedState = { question: 1, selected: null, review: false, score: 7, timer: false };

export const medSteps: Step<MedState>[] = [
  { id: 'question', label: 'Question', ms: 1600, state: { ...idle, timer: true } },
  { id: 'answer', label: 'Answer', ms: 1000, state: { ...idle, timer: true, selected: 'B' } },
  { id: 'review', label: 'Review', ms: 1800, state: { ...idle, selected: 'B', review: true } },
  // ponytail: brief has `review: true` here too, but that leaves the capsule pose open at
  // "score" (state.review drives shell separation) contradicting the pose test's own intent
  // ("closed again on score") — review closes back to its idle false once the score is shown.
  { id: 'score', label: 'Score', ms: 1200, state: { ...idle, selected: 'B', score: 8 } },
  { id: 'next', label: 'Next', ms: 1000, state: { ...idle, question: 2, score: 8 } },
];
