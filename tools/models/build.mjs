import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';

const BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender';
const ROOT = resolve(import.meta.dirname, '../..');
const BUDGET_BYTES = 2.5 * 1024 * 1024;

const objects = [
  { name: 'ipcam', color: '#F0B24A', fallback: true },
  { name: 'card', color: '#6CCB8A', fallback: true },
  { name: 'cake', color: '#F3A9B9', fallback: true },
  { name: 'capsule', color: '#5BC8C4', fallback: true },
  { name: 'laptop', color: '#E8E0D0', fallback: false },
  { name: 'phone', color: '#E8E0D0', fallback: false },
];

function blender(script, extra) {
  execFileSync(BLENDER, ['-b', '--python', resolve(import.meta.dirname, script), '--', ...extra], { stdio: 'inherit' });
}

function optimize(file) {
  // --join and --flatten default to true and merge/rename the per-part nodes
  // (dome, lens, tier1, shell_a, ...) that the exploded views move by name, so
  // they are disabled here; everything else (meshopt, simplify, prune) applies.
  // --palette also defaults to true and bakes the named PBR materials into
  // generic PaletteMaterial textures, breaking the material-name contract and
  // merging colors, so it is disabled too.
  execFileSync('npx', ['gltf-transform', 'optimize', file, file, '--compress', 'meshopt', '--texture-size', '1024', '--join', 'false', '--flatten', 'false', '--palette', 'false'], { stdio: 'inherit' });
}

let total = 0;
for (const o of objects) {
  const high = resolve(ROOT, `public/models/${o.name}.glb`);
  const low = resolve(ROOT, `public/models/${o.name}.low.glb`);
  blender(`${o.name}.py`, ['--out', high]);
  blender(`${o.name}.py`, ['--out', low, '--lod', 'low']);
  optimize(high);
  optimize(low);
  // Only the objects the site shows as a static image need the Cycles pass; the
  // devices are always drawn by the 3D scene, so rendering them would just cost
  // build time and ship a PNG nothing loads.
  if (o.fallback) {
    blender('render_fallback.py', ['--glb', high, '--color', o.color, '--out', resolve(ROOT, `public/fallback/${o.name}.png`)]);
  }
  total += statSync(high).size + statSync(low).size;
  console.log(`${o.name}: ${(statSync(high).size / 1024).toFixed(1)} KB high, ${(statSync(low).size / 1024).toFixed(1)} KB low`);
}
console.log(`models total: ${(total / 1024).toFixed(1)} KB`);
if (total > BUDGET_BYTES) {
  console.error(`models exceed the ${BUDGET_BYTES / 1024 / 1024} MB budget`);
  process.exit(1);
}
