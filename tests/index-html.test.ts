import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { content } from '../src/content';
import { Hero } from '../src/sections/Hero';
import { MotionProvider } from '../src/MotionProvider';

// index.html carries a static snapshot of the Hero section (P3-R13/F5) so the LCP image and
// hero text paint before React mounts. This guards it against drifting out of sync with
// src/content.ts, which is where a real content edit would land first.
const html = readFileSync(resolve(import.meta.dirname, '../index.html'), 'utf-8');
const decoded = html.replace(/&amp;/g, '&');

test('static hero snapshot has the current name, title and sub', () => {
  expect(decoded).toContain(content.hero.name);
  expect(decoded).toContain(content.hero.title);
  expect(decoded).toContain(content.hero.sub);
});

test('static hero snapshot has every CTA label and href', () => {
  for (const cta of content.hero.ctas) {
    expect(decoded).toContain(cta.label);
    expect(decoded).toContain(`href="${cta.href}"`);
  }
});

// F7: a text-substring check can't catch a dropped/renamed attribute — createRoot().render()
// replaces this markup with <Hero/> wholesale on mount (P3-R13/F5), so the two need to match
// attribute-for-attribute, not just contain the same words. This renders the real component and
// diffs it against the static snapshot's own <img>/<source>/CTA-anchor attributes.
const PICTURE_ATTRS = ['src', 'loading', 'fetchpriority', 'decoding', 'width', 'height'];
// Style through the CSSOM, not the raw attribute: React's serialiser writes `a:1;b:2` and the
// hand-written snapshot the same, but a browser reads both back as `a: 1; b: 2` — comparing the
// strings would fail on spacing alone.
const styleOf = (el: Element) => (el as HTMLElement).style.cssText;
function attrMap(el: Element): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const name of PICTURE_ATTRS) map[name] = el.getAttribute(name);
  map.style = styleOf(el);
  return map;
}

function renderHero() {
  return render(createElement(MotionProvider, { forceReduced: true, children: createElement(Hero) }));
}

test('static hero snapshot matches every rendered <img>, attribute for attribute', () => {
  const { container } = renderHero();
  const rendered = [...container.querySelectorAll('img')];
  expect(rendered.length).toBeGreaterThan(0);

  const staticDoc = new DOMParser().parseFromString(html, 'text/html');
  const snapshot = [...staticDoc.querySelectorAll('#root img')];

  expect(snapshot.map(attrMap)).toEqual(rendered.map(attrMap));
});

// The ring's boxes and turns are computed (panelBox, the transform per panel), so the snapshot
// carries numbers no substring check would notice going stale. Compare the panels themselves.
test('static hero snapshot has the same ring panels as the component', () => {
  const { container } = renderHero();
  const rendered = [...container.querySelectorAll('.hero__panel')].map(styleOf);
  const staticDoc = new DOMParser().parseFromString(html, 'text/html');
  const snapshot = [...staticDoc.querySelectorAll('#root .hero__panel')].map(styleOf);
  expect(snapshot).toEqual(rendered);
});

test('the static hero names the same screen the component does', () => {
  const { container } = renderHero();
  const rendered = container.querySelector('.hero__caption')?.textContent;
  const staticDoc = new DOMParser().parseFromString(html, 'text/html');
  const snapshot = staticDoc.querySelector('#root .hero__caption')?.textContent;
  expect(rendered).toBeTruthy();
  expect(snapshot).toBe(rendered);
});

test('the preloaded LCP image is the one the static hero actually shows', () => {
  const staticDoc = new DOMParser().parseFromString(html, 'text/html');
  const preload = staticDoc.querySelector('link[rel="preload"][as="image"]');
  expect(preload?.getAttribute('href')).toBe(staticDoc.querySelector('#root img')?.getAttribute('src'));
});

test('static hero snapshot matches the rendered CTA anchors exactly', () => {
  const { container } = renderHero();
  const renderedCtas = Array.from(container.querySelectorAll('.hero__cta a'));

  const staticDoc = new DOMParser().parseFromString(html, 'text/html');
  const staticCtas = Array.from(staticDoc.querySelectorAll('#root .hero__cta a'));

  expect(renderedCtas.length).toBeGreaterThan(0);
  expect(renderedCtas.length).toBe(staticCtas.length);
  renderedCtas.forEach((a, i) => {
    const s = staticCtas[i];
    expect(a.getAttribute('href')).toBe(s.getAttribute('href'));
    expect(a.getAttribute('target')).toBe(s.getAttribute('target'));
    expect(a.getAttribute('rel')).toBe(s.getAttribute('rel'));
  });
});
