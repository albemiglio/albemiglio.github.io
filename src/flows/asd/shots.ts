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
  { id: 'iscrizione', label: 'Iscrizione', ms: 2600, state: { src: '/shots/asd/iscrizione.webp', alt: "Il modulo d'iscrizione compilato dalla famiglia", focus: { x: 0.02, y: 0.02, w: 0.6 } } },
  { id: 'famiglia', label: 'Famiglia', ms: 2400, state: { src: '/shots/asd/famiglia.webp', alt: 'Il portale della famiglia: quote, appuntamenti, bacheca', focus: { x: 0.02, y: 0.02, w: 0.6 } } },
  { id: 'quote', label: 'Quote', ms: 2400, state: { src: '/shots/asd/quote.webp', alt: 'Le quote e il loro incasso', focus: { x: 0.21, y: 0.2, w: 0.5 } } },
  { id: 'scadenze', label: 'Scadenze', ms: 2400, state: { src: '/shots/asd/scadenze.webp', alt: 'Visite, pagamenti e documenti in scadenza, in un elenco solo', focus: { x: 0.21, y: 0.2, w: 0.5 } } },
  { id: 'sponsor', label: 'Sponsor', ms: 2400, state: { src: '/shots/asd/sponsor.webp', alt: "Un contratto di sponsorizzazione, con le tranche e l'IVA da versare", focus: { x: 0.22, y: 0.4, w: 0.5 } } },
  { id: 'materiale', label: 'Materiale', ms: 2400, state: { src: '/shots/asd/materiale.webp', alt: 'Il magazzino del vestiario, capo per capo', focus: { x: 0.21, y: 0.42, w: 0.5 } } },
  { id: 'documenti', label: 'Documenti', ms: 2400, state: { src: '/shots/asd/documenti.webp', alt: "L'archivio dei documenti, raggruppato per sezione", focus: { x: 0.21, y: 0.25, w: 0.5 } } },
  // La grafica generata sta nella colonna di destra: su telefono la regione è quella, non il modulo.
  { id: 'grafiche', label: 'Grafiche', ms: 2600, state: { src: '/shots/asd/grafiche.webp', alt: 'Il post per i social generato dai dati della società', focus: { x: 0.53, y: 0.135, w: 0.47 } } },
];
