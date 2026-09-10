import type { Step } from '../types';
import type { Shot } from '../ShotScene';

/**
 * Captures of the running product (asd.albemiglio.it/demo — the club's own screens on invented
 * members, with no database behind them, so nothing of the thirty-six real clubs is on show).
 *
 * `focus` names the region that carries the step's meaning, in fractions of the capture: it is
 * what a phone gets, since a club's dense tables are unreadable shrunk whole.
 */
export const asdShots: Step<Shot>[] = [
  { id: 'tesserati', label: 'Tesserati', ms: 2600, state: { src: '/shots/asd/tesserati.webp', alt: 'I tesserati del club, con visite mediche e documenti', focus: { x: 0.21, y: 0.26, w: 0.5 } } },
  { id: 'iscrizione', label: 'Iscrizione', ms: 2600, state: { src: '/shots/asd/iscrizione.webp', alt: "Il modulo d'iscrizione compilato dalla famiglia", focus: { x: 0.3, y: 0.1, w: 0.42 } } },
  { id: 'famiglia', label: 'Famiglia', ms: 2400, state: { src: '/shots/asd/famiglia.webp', alt: 'Il portale della famiglia: quote, appuntamenti, bacheca', focus: { x: 0.28, y: 0.08, w: 0.45 } } },
  { id: 'quote', label: 'Quote', ms: 2400, state: { src: '/shots/asd/quote.webp', alt: 'Le quote e il loro incasso', focus: { x: 0.21, y: 0.2, w: 0.5 } } },
];
