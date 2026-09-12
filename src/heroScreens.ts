/** A rectangle of a capture, in fractions of its own width and height. */
export type Crop = { x: number; y: number; w: number; h: number };
export type HeroScreen = { src: string; alt: string; label: string; px: [number, number]; crop: Crop };

// `label` says what the product is, not what the screenshot shows: at the top of the page nobody
// yet knows what pastis or asd are, and a crop of an interface on its own does not tell them.
// Each entry also names a region of its capture, not the whole thing: a panel can only show about
// as many source pixels as it has of its own, so a whole application scaled into one is unreadable.
export const HERO_SCREENS: HeroScreen[] = [
  // asd opens: on a phone only the first one is shown, and the chapter right under it is ipcam's.
  {
    src: '/shots/asd/tesserati.webp',
    alt: 'I tesserati di un club, con visite mediche e documenti',
    label: 'asd · members, fees and paperwork for a sports club',
    px: [1512, 982],
    crop: { x: 0.215, y: 0.262, w: 0.345, h: 0.335 },  // five members, their squad and their medical
  },
  {
    src: '/shots/ipcam/live.webp',
    alt: 'La diretta di una telecamera, con i suoi comandi',
    label: 'ipcam · self-hosted live video for home cameras',
    px: [1512, 982],
    crop: { x: 0.2, y: 0.02, w: 0.75, h: 0.71 },       // the camera's name, its live badge and the picture
  },
  {
    src: '/shots/med/domanda.webp',
    alt: "Una domanda di simulazione del test d'ammissione",
    label: 'med · admission-test practice for medical school',
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
