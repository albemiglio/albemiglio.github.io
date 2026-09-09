import type { IpcamState } from '../../flows/ipcam/steps';

type Vec3 = [number, number, number];
export type Pose = { parts: Record<string, { offset: Vec3; rotation?: Vec3 }>; ledOn: boolean; statusOn: boolean };

// Exploded-view heights per part (Y, glTF up), scaled by `explode` 0..1.
const LIFT: Record<string, number> = { base: 0, screws: 0.25, body: 0.45, board: 0.7, ring: 0.95, cradle: 1.2, leds: 1.35, lens: 1.5, status_led: 0.45, dome: 2.0 };

export function ipcamPose(state: IpcamState, explode: number): Pose {
  const yaw = state.pan * 0.35;
  const pitch = state.tilt * 0.2;
  const parts: Pose['parts'] = {};
  for (const [name, lift] of Object.entries(LIFT)) parts[name] = { offset: [0, lift * explode, 0] };
  parts.lens.rotation = [pitch, yaw, 0];
  parts.cradle.rotation = [pitch, yaw, 0];
  parts.leds.rotation = [pitch, yaw, 0];
  return { parts, ledOn: state.view === 'live', statusOn: state.rec };
}
