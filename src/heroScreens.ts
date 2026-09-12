/** A rectangle of a capture, in fractions of its own width and height. */
export type Crop = { x: number; y: number; w: number; h: number };
export type HeroScreen = { src: string; alt: string; label: string; px: [number, number]; crop: Crop };

// Each entry names a region of its capture, not the whole thing: a panel can only show about as
// many source pixels as it has of its own, so a whole application scaled into one is unreadable.
export const HERO_SCREENS: HeroScreen[] = [
  {
    src: '/shots/pastis/produzione.webp',
    alt: 'Le lavorazioni pianificate di un laboratorio di pasticceria',
    label: 'pastis · today\u2019s production',
    px: [1512, 982],
    crop: { x: 0.175, y: 0.16, w: 0.435, h: 0.275 },   // the production table: header and four rows
  },
  {
    src: '/shots/asd/tesserati.webp',
    alt: 'I tesserati di un club, con visite mediche e documenti',
    label: 'asd · members and medicals',
    px: [1512, 982],
    crop: { x: 0.215, y: 0.262, w: 0.345, h: 0.335 },  // five members, their squad and their medical
  },
  {
    src: '/shots/med/domanda.webp',
    alt: "Una domanda di simulazione del test d'ammissione",
    label: 'med · a question, timed',
    px: [804, 1748],
    crop: { x: 0.05, y: 0.17, w: 0.9, h: 0.43 },       // the question and the first answers
  },
];

export const cropAspect = ({ px, crop }: HeroScreen) => (crop.w * px[0]) / (crop.h * px[1]);

// The crop as plain box offsets, for the still in the DOM: blown up until the crop's width fills
// the box, then pulled into place. Percentages of the box, so nothing depends on its rendered size.
export function cropStyle(screen: HeroScreen) {
  const { x, y, w, h } = screen.crop;
  return {
    width: `${round(100 / w)}%`,
    left: `${round((-x / w) * 100)}%`,
    top: `${round((-y / h) * 100)}%`,
  };
}

const round = (n: number) => Math.round(n * 100) / 100;
