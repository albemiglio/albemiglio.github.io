import type { Step } from '../types';

export type PastisState = { column: 'new' | 'production' | 'ready' | 'picked'; tiers: 1 | 2 | 3; flavour: string; lettering: string; configuring: boolean };

const idle: PastisState = { column: 'new', tiers: 1, flavour: '', lettering: '', configuring: false };

export const pastisSteps: Step<PastisState>[] = [
  { id: 'new', label: 'New order', ms: 1200, state: { ...idle } },
  { id: 'configure', label: 'Configure', ms: 1800, state: { ...idle, configuring: true, tiers: 3, flavour: 'Pistachio', lettering: 'Happy 30th, Giulia' } },
  { id: 'produce', label: 'In production', ms: 1400, state: { ...idle, column: 'production', tiers: 3, flavour: 'Pistachio', lettering: 'Happy 30th, Giulia' } },
  { id: 'ready', label: 'Ready', ms: 1200, state: { ...idle, column: 'ready', tiers: 3, flavour: 'Pistachio', lettering: 'Happy 30th, Giulia' } },
  { id: 'pickup', label: 'Pick-up', ms: 1200, state: { ...idle, column: 'picked', tiers: 3, flavour: 'Pistachio', lettering: 'Happy 30th, Giulia' } },
];
