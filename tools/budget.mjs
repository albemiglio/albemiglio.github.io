import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = process.env.DIST ? resolve(process.env.DIST) : resolve(import.meta.dirname, '../dist');
const INITIAL_LIMIT = 120 * 1024;
// Anything not referenced by the entry HTML is lazy. The four chapter Scenes
// (vite.config.ts's 'flows' group) get their own budget; nothing else should be down here.
const LAZY_LIMIT = 40 * 1024;
const FLOWS_LIMIT = 60 * 1024; // the four Scenes carry motion's layout/gesture code with them

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

// The entry HTML references its own initial JS; anything not referenced is only reachable
// through a lazy import (a chapter Scene's) and counts as lazily-loaded payload.
const referenced = new Set(refs);
const allJs = readdirSync(resolve(DIST, 'assets')).filter((f) => f.endsWith('.js'));
let lazySize = 0;
let flowsSize = 0;
for (const f of allJs) {
  if (referenced.has(`/assets/${f}`)) continue;
  const size = gz(resolve(DIST, 'assets', f));
  if (f.startsWith('flows-')) {
    flowsSize += size;
    console.log(`flows: assets/${f}: ${kb(size)} KB gz`);
    continue;
  }
  lazySize += size;
  console.log(`lazy: assets/${f}: ${kb(size)} KB gz`);
}
console.log(`other lazy chunks: ${kb(lazySize)} KB gz (limit ${kb(LAZY_LIMIT)} KB)`);
console.log(`flows chunk: ${kb(flowsSize)} KB gz (limit ${kb(FLOWS_LIMIT)} KB)`);

if (initial > INITIAL_LIMIT || lazySize > LAZY_LIMIT || flowsSize > FLOWS_LIMIT) process.exit(1);
