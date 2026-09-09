import type { AsdState } from '../../flows/asd/steps';
import { HIDDEN, type Pose, type Vec3 } from './pose';

const LIFT: Record<string, number> = { plate: 0, hologram: 0.12, logo: 0.12, qr: 0.24, text: 0.24, stripe: 0.36, chip: 0.6, photo: 0.85 };

export function cardPose(state: AsdState, explode: number, normal: Vec3): Pose {
  const parts: Pose['parts'] = {};
  for (const [name, lift] of Object.entries(LIFT)) {
    const d = lift * explode;
    parts[name] = { offset: [normal[0] * d, normal[1] * d, normal[2] * d] };
  }
  const printed = state.receipt ? 1 : HIDDEN;
  parts.photo.scale = printed;
  parts.text.scale = printed;
  return { parts };
}
