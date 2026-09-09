import type { PastisState } from '../../flows/pastis/steps';
import { HIDDEN, type Pose } from './pose';

const LIFT: Record<string, number> = { stand: 0, tier1: 0, cream1: 0, tier2: 0.35, cream2: 0.35, tier3: 0.7, cream3: 0.7, berries: 0.7, topper: 1.1 };

export function cakePose(state: PastisState, explode: number): Pose {
  const parts: Pose['parts'] = {};
  for (const [name, lift] of Object.entries(LIFT)) {
    parts[name] = { offset: [0, lift * explode, 0] };
  }
  for (const name of ['tier2', 'cream2']) parts[name].scale = state.tiers < 2 ? HIDDEN : 1;
  for (const name of ['tier3', 'cream3', 'berries', 'topper']) parts[name].scale = state.tiers < 3 ? HIDDEN : 1;
  return { parts };
}
