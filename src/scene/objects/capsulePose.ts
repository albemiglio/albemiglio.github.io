import type { MedState } from '../../flows/med/steps';
import type { Pose } from './pose';

export function capsulePose(state: MedState, explode: number): Pose {
  const open = state.review ? 0.35 : 0;
  const sep = Math.max(explode * 0.6, open);
  const parts: Pose['parts'] = {
    shell_a: { offset: [sep, 0, 0] },
    label: { offset: [sep, 0, 0] },
    shell_b: { offset: [-sep, 0, 0] },
    seam: { offset: [0, 0, 0] },
  };
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    parts[`bead${i + 1}`] = { offset: [-0.1 * i * explode, Math.cos(angle) * 0.35 * explode, Math.sin(angle) * 0.35 * explode] };
  }
  return { parts };
}
