import type { Step } from '../types';
import type { Shot } from '../ShotScene';

/**
 * Captures of the running client's public /demo route: the real markup and modules, with an
 * import map swapping only the API layer for fixtures, against four invented cameras whose video
 * is drawn rather than filmed. Every request was logged while capturing; none reached a camera.
 *
 * `focus` names the region that carries the step's meaning, in fractions of the capture.
 */
export const ipcamShots: Step<Shot>[] = [
  { id: 'live', label: 'Live', ms: 2600, state: { src: '/shots/ipcam/live.webp', alt: 'La diretta di una telecamera', focus: { x: 0.2, y: 0.02, w: 0.55 } } },
  { id: 'ptz', label: 'Pan / tilt', ms: 2400, state: { src: '/shots/ipcam/ptz.webp', alt: "I comandi che muovono l'obiettivo", focus: { x: 0.2, y: 0.58, w: 0.42 } } },
  { id: 'talk', label: 'Talk', ms: 2200, state: { src: '/shots/ipcam/talk.webp', alt: 'Il canale audio a due vie aperto verso la telecamera', focus: { x: 0.24, y: 0.58, w: 0.42 } } },
  { id: 'recordings', label: 'Recordings', ms: 2800, state: { src: '/shots/ipcam/recordings.webp', alt: "L'archivio del giorno: quanto è registrato, a che ore, e dov'è il diretta", focus: { x: 0.13, y: 0.01, w: 0.58 } } },
];
