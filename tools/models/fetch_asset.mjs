// Pulls a Poly Haven CC0 model (glTF + its PBR maps) into the Blender cache. The site never
// ships these files: they are the source the render pipeline photographs, like the procedural
// scripts next door. CC0 means no attribution is required, so nothing about them reaches the page.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CACHE = resolve(import.meta.dirname, '.blender-cache/assets');

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

async function download(url, to) {
  if (existsSync(to)) return false;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, Buffer.from(await r.arrayBuffer()));
  return true;
}

export async function fetchAsset(name, res = '4k') {
  const files = await json(`https://api.polyhaven.com/files/${name}`);
  const entry = files.gltf?.[res]?.gltf;
  if (!entry) throw new Error(`${name}: no ${res} glTF (have ${Object.keys(files.gltf ?? {})})`);
  const dir = resolve(CACHE, name);
  const main = resolve(dir, entry.url.split('/').pop());
  let fetched = (await download(entry.url, main)) ? 1 : 0;
  for (const [rel, info] of Object.entries(entry.include ?? {})) {
    if (await download(info.url, resolve(dir, rel))) fetched++;
  }
  return { path: main, fetched };
}

if (import.meta.filename === process.argv[1]) {
  const [name, res = '4k'] = process.argv.slice(2);
  const { path, fetched } = await fetchAsset(name, res);
  console.log(`${name}: ${fetched} new file(s) → ${path}`);
}
