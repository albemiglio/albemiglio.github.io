import type { Step } from '../types';

export type AsdState = { view: 'list' | 'form'; typed: number; family: boolean; fee: 'due' | 'paid'; receipt: boolean };

const idle: AsdState = { view: 'list', typed: 0, family: false, fee: 'due', receipt: false };

export const asdSteps: Step<AsdState>[] = [
  { id: 'list', label: 'Members', ms: 1200, state: { ...idle } },
  { id: 'form', label: 'Sign-up', ms: 1800, state: { ...idle, view: 'form', typed: 1 } },
  { id: 'family', label: 'Family', ms: 1400, state: { ...idle, view: 'form', typed: 1, family: true } },
  { id: 'fee', label: 'Fee', ms: 1400, state: { ...idle, view: 'form', typed: 1, family: true, fee: 'paid' } },
  { id: 'receipt', label: 'Receipt', ms: 1400, state: { ...idle, view: 'form', typed: 1, family: true, fee: 'paid', receipt: true } },
];
