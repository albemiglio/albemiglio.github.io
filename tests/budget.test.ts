import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function fakeDist(sceneKb: number, mainKb: number) {
  const dir = mkdtempSync(join(tmpdir(), 'budget-'));
  mkdirSync(join(dir, 'assets'));
  const filler = (kb: number) => Array.from({ length: kb * 64 }, (_, i) => `const v${i}=${Math.random()};`).join('\n');
  writeFileSync(join(dir, 'assets', 'index-aaa.js'), filler(mainKb));
  writeFileSync(join(dir, 'assets', 'scene-bbb.js'), filler(sceneKb));
  writeFileSync(join(dir, 'index.html'), '<script type="module" src="/assets/index-aaa.js"></script>');
  return dir;
}

const script = resolve(import.meta.dirname, '../tools/budget.mjs');
const run = (dist: string) => execFileSync('node', [script], { env: { ...process.env, DIST: dist } }).toString();

test('passes when both budgets hold', () => {
  expect(run(fakeDist(50, 20))).toMatch(/scene chunk/);
});

test('fails when the scene chunk is over 220 KB gzip', () => {
  expect(() => run(fakeDist(400, 20))).toThrow();
});
