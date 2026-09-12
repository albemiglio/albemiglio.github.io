import { CHAPTERS } from '../src/chapters';

test('three chapters in page order with their device', () => {
  expect(CHAPTERS.map((c) => c.id)).toEqual(['ipcam', 'asd', 'med']);
  // med is the only one whose product is used on a phone.
  expect(CHAPTERS.map((c) => c.device)).toEqual(['laptop', 'laptop', 'phone']);
});
