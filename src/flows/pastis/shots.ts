import type { Step } from '../types';
import type { Shot } from '../ShotScene';

/**
 * Captures of the running product (pastis.albemiglio.it, guest entrance), one per step of the
 * story the chapter tells: what the lab has to do today, what is in production, what the stock
 * says, what to buy, what customers ordered.
 *
 * `focus` names the region that carries the step's meaning, in fractions of the capture. It is
 * what a phone shows; a wide screen shows the whole screen (see ShotScene).
 */
export const pastisShots: Step<Shot>[] = [
  { id: 'oggi', label: 'Oggi', ms: 2600, state: { src: '/shots/pastis/oggi.webp', alt: 'La giornata del laboratorio: cosa è in lavorazione e cosa manca', focus: { x: 0.17, y: 0.06, w: 0.48 } } },
  { id: 'produzione', label: 'Produzione', ms: 2400, state: { src: '/shots/pastis/produzione.webp', alt: 'Le lavorazioni pianificate', focus: { x: 0.17, y: 0.06, w: 0.48 } } },
  { id: 'magazzino', label: 'Magazzino', ms: 2400, state: { src: '/shots/pastis/magazzino.webp', alt: 'Le materie prime e le scorte', focus: { x: 0.17, y: 0.06, w: 0.48 } } },
  { id: 'acquisti', label: 'Acquisti', ms: 2400, state: { src: '/shots/pastis/acquisti.webp', alt: 'Cosa ordinare e da chi', focus: { x: 0.17, y: 0.06, w: 0.48 } } },
  { id: 'ordini', label: 'Ordini', ms: 2400, state: { src: '/shots/pastis/ordini.webp', alt: 'Gli ordini dei clienti', focus: { x: 0.17, y: 0.06, w: 0.48 } } },
];
