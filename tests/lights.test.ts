import { chapterKeyColor } from '../src/scene/Lights';

// P2-R3 fix round 2: the key-light target for a chapter is its hue lerped 60% toward white, so a
// fully saturated amber reads as a cast on the metal, not a repaint. Values verified against
// three.js's own Color (ColorManagement enabled, this project's default — Color.lerp interpolates
// in the linear working space, not a naive per-channel blend of the sRGB hex digits).
test('ipcam key light target is the chapter hue lerped 60% toward white', () => {
  const c = chapterKeyColor('#F0B24A');
  expect(c.r).toBeCloseTo(0.9485, 3);
  expect(c.g).toBeCloseTo(0.7781, 3);
  expect(c.b).toBeCloseTo(0.6274, 3);
});
