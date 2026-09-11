import { CHAPTERS } from '../src/chapters';

test('four chapters in page order with their object and device', () => {
  expect(CHAPTERS.map((c) => c.id)).toEqual(['ipcam', 'asd', 'pastis', 'med']);
  // pastis is a desktop product and the chapter shows captures of it, so its frame is a laptop.
  expect(CHAPTERS.map((c) => c.device)).toEqual(['laptop', 'laptop', 'laptop', 'phone']);
});
