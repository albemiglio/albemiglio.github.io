import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = process.env.DIST ? resolve(process.env.DIST) : resolve(import.meta.dirname, '../dist');
const INITIAL_LIMIT = 120 * 1024;
const LAZY_LIMIT = 300 * 1024;

const gz = (file) => gzipSync(readFileSync(file)).length;
const kb = (n) => (n / 1024).toFixed(1);

const jsRefs = (htmlPath) => [...readFileSync(htmlPath, 'utf8').matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);

const refs = jsRefs(resolve(DIST, 'index.html'));
let initial = 0;
for (const ref of new Set(refs)) {
  const size = gz(resolve(DIST, `.${ref}`));
  initial += size;
  console.log(`${ref}: ${kb(size)} KB gz`);
}
console.log(`initial JS: ${kb(initial)} KB gz (limit ${kb(INITIAL_LIMIT)} KB)`);

// Every entry HTML (main + style tile) references its own initial JS; anything not referenced by
// either is only reachable through a lazy import (SceneMount's, or a chapter object's own) and
// counts as part of the lazily-loaded scene payload.
const referenced = new Set([...refs, ...jsRefs(resolve(DIST, 'style/index.html'))]);
const allJs = readdirSync(resolve(DIST, 'assets')).filter((f) => f.endsWith('.js'));
let lazySize = 0;
for (const f of allJs) {
  if (referenced.has(`/assets/${f}`)) continue;
  const size = gz(resolve(DIST, 'assets', f));
  lazySize += size;
  console.log(`lazy: assets/${f}: ${kb(size)} KB gz`);
}
console.log(`lazy scene chunks: ${kb(lazySize)} KB gz (limit ${kb(LAZY_LIMIT)} KB)`);

if (initial > INITIAL_LIMIT || lazySize > LAZY_LIMIT) process.exit(1);
