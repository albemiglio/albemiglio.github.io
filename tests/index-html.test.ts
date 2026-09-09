import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { content } from '../src/content';

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
