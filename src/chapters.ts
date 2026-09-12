export type ChapterMeta = { id: 'ipcam' | 'asd' | 'med'; device: 'laptop' | 'phone'; color: string };

// Page order. The DOM (Work.tsx) and the scene (ChapterDevices) both read this list, so a
// chapter exists in exactly one place.
export const CHAPTERS: readonly ChapterMeta[] = [
  { id: 'ipcam', device: 'laptop', color: '#F0B24A' },
  { id: 'asd', device: 'laptop', color: '#6CCB8A' },
  { id: 'med', device: 'phone', color: '#5BC8C4' },
];
export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);
