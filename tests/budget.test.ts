import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function fakeDist(lazyKb: number, mainKb: number, flowsKb = 0) {
  const dir = mkdtempSync(join(tmpdir(), 'budget-'));
  mkdirSync(join(dir, 'assets'));
  const filler = (kb: number) => Array.from({ length: kb * 64 }, (_, i) => `const v${i}=${Math.random()};`).join('\n');
  writeFileSync(join(dir, 'assets', 'index-aaa.js'), filler(mainKb));
  // Two lazy chunks neither referenced by the entry HTML — both count toward the lazy total
  // tools/budget.mjs sums.
  writeFileSync(join(dir, 'assets', 'lazy-bbb.js'), filler(lazyKb / 2));
  writeFileSync(join(dir, 'assets', 'other-ddd.js'), filler(lazyKb / 2));
  // F8: a `flows-*.js` chunk is tallied separately from the lazy total (FLOWS_LIMIT), so an
  // oversized one needs its own fixture file to exercise that branch.
  if (flowsKb > 0) writeFileSync(join(dir, 'assets', 'flows-ccc.js'), filler(flowsKb));
  writeFileSync(join(dir, 'index.html'), '<script type="module" src="/assets/index-aaa.js"></script>');
  return dir;
}

const script = resolve(import.meta.dirname, '../tools/budget.mjs');
const run = (dist: string) => execFileSync('node', [script], { env: { ...process.env, DIST: dist } }).toString();

test('passes when both budgets hold', () => {
  expect(run(fakeDist(20, 20))).toMatch(/other lazy chunks:/);
});

test('fails when the lazy chunks total is over its budget', () => {
  expect(() => run(fakeDist(2000, 20))).toThrow();
});

test('fails when the flows chunk is over 60 KB gzip and prints the flows line', () => {
  const dist = fakeDist(20, 20, 800);
  let error: (Error & { status?: number; stdout?: Buffer }) | undefined;
  try {
    run(dist);
  } catch (err) {
    error = err as typeof error;
  }
  expect(error).toBeDefined();
  expect(error!.status).toBe(1);
  expect(error!.stdout?.toString()).toMatch(/flows chunk:/);
});
