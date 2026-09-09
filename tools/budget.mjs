import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = process.env.DIST ? resolve(process.env.DIST) : resolve(import.meta.dirname, '../dist');
const INITIAL_LIMIT = 120 * 1024;
const SCENE_LIMIT = 220 * 1024;

const gz = (file) => gzipSync(readFileSync(file)).length;
const kb = (n) => (n / 1024).toFixed(1);

const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
let initial = 0;
for (const ref of new Set(refs)) {
  const size = gz(resolve(DIST, `.${ref}`));
  initial += size;
  console.log(`${ref}: ${kb(size)} KB gz`);
}
console.log(`initial JS: ${kb(initial)} KB gz (limit ${kb(INITIAL_LIMIT)} KB)`);

const scene = readdirSync(resolve(DIST, 'assets')).filter((f) => /^scene-.*\.js$/.test(f));
let sceneSize = 0;
for (const f of scene) sceneSize += gz(resolve(DIST, 'assets', f));
console.log(`scene chunk: ${kb(sceneSize)} KB gz (limit ${kb(SCENE_LIMIT)} KB, ${scene.length} file(s))`);

if (initial > INITIAL_LIMIT || sceneSize > SCENE_LIMIT) process.exit(1);
