import type { Step } from '../types';
import type { Shot } from '../ShotScene';

/**
 * Captures of the running client (its public `/demo` route).
 *
 * This one needed more care than the other three: the product watches the owner's house, so a
 * capture of it running normally would put his front door on a public page. The demo route runs
 * the real markup and the real modules — an import map swaps only the API layer for fixtures —
 * against four invented cameras whose video is drawn, not filmed. A check in that repo fails the
 * build if anything on the path can reach a camera route, and the captures below were taken with
 * every request intercepted and logged: none went to `/api`, `/hls`, `/media`, `/recordings` or
 * `/stills`.
 *
 * `focus` names the region that carries the step's meaning, in fractions of the capture: it is
 * what a phone gets.
 */
export const ipcamShots: Step<Shot>[] = [
  { id: 'grid', label: 'Cameras', ms: 2400, state: { src: '/shots/ipcam/grid.webp', alt: 'Le telecamere di casa, tutte in diretta nella stessa griglia', focus: { x: 0.19, y: 0.02, w: 0.45 } } },
  { id: 'live', label: 'Live', ms: 2600, state: { src: '/shots/ipcam/live.webp', alt: 'La diretta di una telecamera', focus: { x: 0.2, y: 0.02, w: 0.55 } } },
  { id: 'ptz', label: 'Pan / tilt', ms: 2400, state: { src: '/shots/ipcam/ptz.webp', alt: "I comandi che muovono l'obiettivo", focus: { x: 0.2, y: 0.58, w: 0.42 } } },
  { id: 'talk', label: 'Talk', ms: 2200, state: { src: '/shots/ipcam/talk.webp', alt: 'Il canale audio a due vie aperto verso la telecamera', focus: { x: 0.24, y: 0.58, w: 0.42 } } },
  { id: 'recording', label: 'Recordings', ms: 2600, state: { src: '/shots/ipcam/recording.webp', alt: 'Una registrazione riletta sulla linea del tempo', focus: { x: 0.02, y: 0.38, w: 0.55 } } },
];
