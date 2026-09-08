import type { Step } from '../types';

export type IpcamState = { view: 'grid' | 'live'; pan: -1 | 0 | 1; tilt: -1 | 0 | 1; rec: boolean; clips: number; talk: boolean };

const idle: IpcamState = { view: 'live', pan: 0, tilt: 0, rec: false, clips: 0, talk: false };

export const ipcamSteps: Step<IpcamState>[] = [
  { id: 'grid', label: 'Cameras', ms: 1200, state: { ...idle, view: 'grid' } },
  { id: 'live', label: 'Live', ms: 1600, state: { ...idle } },
  { id: 'ptz', label: 'Pan / tilt', ms: 1800, state: { ...idle, pan: 1, tilt: -1 } },
  { id: 'rec', label: 'REC', ms: 1400, state: { ...idle, pan: 1, tilt: -1, rec: true, clips: 1 } },
  { id: 'talk', label: 'Talk', ms: 1400, state: { ...idle, pan: 1, tilt: -1, rec: true, clips: 1, talk: true } },
];
