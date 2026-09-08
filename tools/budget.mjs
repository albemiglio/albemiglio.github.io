import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = resolve(import.meta.dirname, '../dist');
const LIMIT = 120 * 1024;
const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
let total = 0;
for (const ref of new Set(refs)) {
  const size = gzipSync(readFileSync(resolve(DIST, `.${ref}`))).length;
  total += size;
  console.log(`${ref}: ${(size / 1024).toFixed(1)} KB gz`);
}
console.log(`initial JS: ${(total / 1024).toFixed(1)} KB gz (limit ${LIMIT / 1024} KB)`);
if (total > LIMIT) process.exit(1);
