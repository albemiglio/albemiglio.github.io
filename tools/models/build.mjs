import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';

const BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender';
const ROOT = resolve(import.meta.dirname, '../..');
const BUDGET_BYTES = 2.5 * 1024 * 1024;

// The two devices the scene places on the chapters' frames. There used to be four more — a
// camera, a card, a cake, a capsule — each rendered to a still as well, for the chapters to show
// while the scene was closed. Those were ornaments beside captures of the real products, so they
// went, and the Cycles pass went with them: nothing here is drawn as a picture any more.
const objects = [
  { name: 'laptop' },
  { name: 'phone' },
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
  total += statSync(high).size + statSync(low).size;
  console.log(`${o.name}: ${(statSync(high).size / 1024).toFixed(1)} KB high, ${(statSync(low).size / 1024).toFixed(1)} KB low`);
}
console.log(`models total: ${(total / 1024).toFixed(1)} KB`);
if (total > BUDGET_BYTES) {
  console.error(`models exceed the ${BUDGET_BYTES / 1024 / 1024} MB budget`);
  process.exit(1);
}
