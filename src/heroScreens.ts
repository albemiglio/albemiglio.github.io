/** A rectangle of a capture, in fractions of its own width and height. */
export type Crop = { x: number; y: number; w: number; h: number };
export type HeroScreen = { src: string; alt: string; px: [number, number]; crop: Crop };

/**
 * What the hero shows: real screens of the real products, turning slowly.
 *
 * Each entry names a region of its capture rather than the whole thing, because a panel this size
 * can only show about as many source pixels as it has of its own — a whole desktop application
 * scaled into it is a grey thumbnail, and an interface nobody can read is decoration. The regions
 * are chosen to be legible at close to actual size: a few rows of a table, one question and its
 * answers. The crop's own proportions are the panel's, so nothing is squeezed to fit.
 */
export const HERO_SCREENS: HeroScreen[] = [
  {
    src: '/shots/pastis/produzione.webp',
    alt: 'Le lavorazioni pianificate di un laboratorio di pasticceria',
    px: [1512, 982],
    crop: { x: 0.175, y: 0.16, w: 0.435, h: 0.275 },   // the production table: header and four rows
  },
  {
    src: '/shots/asd/tesserati.webp',
    alt: 'I tesserati di un club, con visite mediche e documenti',
    px: [1512, 982],
    crop: { x: 0.215, y: 0.262, w: 0.345, h: 0.335 },  // five members, their squad and their medical
  },
  {
    src: '/shots/med/domanda.webp',
    alt: "Una domanda di simulazione del test d'ammissione",
    px: [804, 1748],
    crop: { x: 0.05, y: 0.17, w: 0.9, h: 0.43 },       // the question and the first answers
  },
];

/** The panel's proportions: the crop's, in pixels. */
export const cropAspect = ({ px, crop }: HeroScreen) => (crop.w * px[0]) / (crop.h * px[1]);

/**
 * The same crop as plain box offsets, for the still in the DOM.
 *
 * The image is blown up until the crop's width fills the box and then pulled into place; both
 * offsets are percentages of the box, so nothing here depends on the box's rendered size. A
 * transform would do the same job, but its percentages and its order of operations are two more
 * things to get wrong in the copy of this markup that lives in index.html.
 */
export function cropStyle(screen: HeroScreen) {
  const { x, y, w, h } = screen.crop;
  return {
    width: `${round(100 / w)}%`,
    left: `${round((-x / w) * 100)}%`,
    top: `${round((-y / h) * 100)}%`,
  };
}

const round = (n: number) => Math.round(n * 100) / 100;
