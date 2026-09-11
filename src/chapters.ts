export type ChapterMeta = { id: 'ipcam' | 'asd' | 'pastis' | 'med'; device: 'laptop' | 'phone'; color: string };

// Page order. The DOM (Work.tsx) and the scene (ChapterDevices) both read this list, so a
// chapter exists in exactly one place.
export const CHAPTERS: readonly ChapterMeta[] = [
  { id: 'ipcam', device: 'laptop', color: '#F0B24A' },
  { id: 'asd', device: 'laptop', color: '#6CCB8A' },
  { id: 'pastis', device: 'laptop', color: '#F3A9B9' },
  { id: 'med', device: 'phone', color: '#5BC8C4' },
];
export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);
