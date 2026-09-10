import type { Step } from '../types';
import type { Shot } from '../ShotScene';

/**
 * Captures of the running product (med.albemiglio.it/demo — the real components on invented
 * questions, with no database behind them), taken at the width of the phone that frames them,
 * so the interface is the one a candidate actually uses rather than a desktop layout squeezed
 * into a phone. Nothing is cropped, so every step's focus is the whole screen.
 */
const whole = { x: 0, y: 0, w: 1 };

export const medShots: Step<Shot>[] = [
  { id: 'domanda', label: 'Domanda', ms: 2600, state: { src: '/shots/med/domanda.webp', alt: 'Una domanda della simulazione, con il tempo che scorre', focus: whole } },
  { id: 'risposta', label: 'Risposta', ms: 2200, state: { src: '/shots/med/risposta.webp', alt: 'La risposta scelta', focus: whole } },
  { id: 'spiegazione', label: 'Spiegazione', ms: 2800, state: { src: '/shots/med/spiegazione.webp', alt: 'Correzione immediata con la spiegazione', focus: whole } },
  { id: 'punteggio', label: 'Punteggio', ms: 2600, state: { src: '/shots/med/punteggio.webp', alt: 'Il risultato della simulazione per materia', focus: whole } },
];
