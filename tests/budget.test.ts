import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function fakeDist(lazyKb: number, mainKb: number) {
  const dir = mkdtempSync(join(tmpdir(), 'budget-'));
  mkdirSync(join(dir, 'assets'));
  mkdirSync(join(dir, 'style'));
  const filler = (kb: number) => Array.from({ length: kb * 64 }, (_, i) => `const v${i}=${Math.random()};`).join('\n');
  writeFileSync(join(dir, 'assets', 'index-aaa.js'), filler(mainKb));
  writeFileSync(join(dir, 'assets', 'style-ccc.js'), filler(mainKb));
  // Two lazy chunks (as a real build would split scene/gltf work), neither referenced by either
  // entry HTML — both count toward the lazy total tools/budget.mjs sums.
  writeFileSync(join(dir, 'assets', 'scene-bbb.js'), filler(lazyKb / 2));
  writeFileSync(join(dir, 'assets', 'other-ddd.js'), filler(lazyKb / 2));
  writeFileSync(join(dir, 'index.html'), '<script type="module" src="/assets/index-aaa.js"></script>');
  writeFileSync(join(dir, 'style', 'index.html'), '<script type="module" src="/assets/style-ccc.js"></script>');
  return dir;
}

const script = resolve(import.meta.dirname, '../tools/budget.mjs');
const run = (dist: string) => execFileSync('node', [script], { env: { ...process.env, DIST: dist } }).toString();

test('passes when both budgets hold', () => {
  expect(run(fakeDist(50, 20))).toMatch(/lazy scene chunks:/);
});

test('fails when the lazy chunks total is over 260 KB gzip', () => {
  expect(() => run(fakeDist(2000, 20))).toThrow();
});
