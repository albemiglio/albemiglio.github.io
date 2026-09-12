import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, render } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { Hero } from '../src/sections/Hero';
import { HERO_SCREENS, cropAspect, cropStyle } from '../src/heroScreens';

const css = readFileSync(resolve(import.meta.dirname, '../src/sections/sections.css'), 'utf-8');

const renderHero = () => render(<MotionProvider forceReduced><Hero /></MotionProvider>);

test('the ring carries every hero screen, each cropped to its own region', () => {
  const { container } = renderHero();
  const imgs = [...container.querySelectorAll('.hero__ring img')];
  expect(imgs.map((i) => i.getAttribute('src'))).toEqual(HERO_SCREENS.map((s) => s.src));
  // The crop is the whole point: an uncropped capture at this size is a thumbnail.
  imgs.forEach((img, i) => expect(img).toHaveStyle(cropStyle(HERO_SCREENS[i])));
});

// Each panel is sized from its crop's own aspect, so a wide region and a tall one stay the same
// screen seen from two angles. Get this wrong and the image inside letterboxes or squeezes.
test('every panel box has the proportions of the region it frames', () => {
  const { container } = renderHero();
  const panels = [...container.querySelectorAll<HTMLElement>('.hero__panel')];
  expect(panels).toHaveLength(HERO_SCREENS.length);
  panels.forEach((panel, i) => {
    const w = Number(panel.style.width.replace('cqw', ''));
    const h = Number(panel.style.height.replace('cqw', ''));
    expect(w / h).toBeCloseTo(cropAspect(HERO_SCREENS[i]), 2);
  });
});

test('one panel is square to the viewer at a time, and the caption names it', () => {
  const { container } = renderHero();
  const lit = [...container.querySelectorAll<HTMLElement>('.hero__panel')].filter((p) => p.style.opacity === '1');
  expect(lit).toHaveLength(1);
  expect(container.querySelector('.hero__caption')?.textContent).toBe(HERO_SCREENS[0].label);
});

test('the ring rests, then turns — and the caption follows it round', () => {
  vi.useFakeTimers();
  const { container } = renderHero();
  const ring = () => container.querySelector<HTMLElement>('.hero__ring')!.style.transform;
  expect(ring()).toBe('rotateY(0deg)');

  // forceReduced only pins the motion tokens; the ring's own timer reads the media query, which
  // jsdom reports as "no preference", so it turns here.
  act(() => { vi.advanceTimersByTime(5400); });

  const step = 360 / HERO_SCREENS.length;
  expect(ring()).toBe(`rotateY(-${step}deg)`);
  // The ring has left but not arrived: the caption still names the panel on screen.
  expect(container.querySelector('.hero__caption')?.textContent).toBe(HERO_SCREENS[0].label);

  act(() => { vi.advanceTimersByTime(1200); });
  expect(container.querySelector('.hero__caption')?.textContent).toBe(HERO_SCREENS[1].label);
  vi.useRealTimers();
});

// The turn's length lives in two places by necessity — the timer in TS, the transition in CSS.
// If they drift, the ring starts its next rest before the last one has finished arriving.
test('the CSS turn lasts as long as the gap the timer leaves for it', () => {
  const declared = css.match(/\.hero__ring\s*\{[^}]*transition:\s*transform\s+(\d+)ms/)?.[1];
  expect(Number(declared)).toBe(1200);
});

// The still's box carries the crop's proportions in CSS while the crop itself lives in
// heroScreens.ts. Two places, one number: change the crop and the box silently letterboxes or
// squeezes the region it is supposed to frame.
test('the still box aspect in CSS is the first screen crop own aspect', () => {
  const declared = css.match(/\.hero__still\s*\{[^}]*aspect-ratio:\s*([\d.]+)/)?.[1];
  expect(declared).toBeDefined();
  expect(Number(declared)).toBeCloseTo(cropAspect(HERO_SCREENS[0]), 2);
});
