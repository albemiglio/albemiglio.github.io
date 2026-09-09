import { expect, test, type Page } from '@playwright/test';

// Scrolls so the #work-<id> article sits at `phase` through its own entering/frontal/leaving
// window: phase 0 is the article's bottom edge reaching the viewport top (about to enter from
// below), phase 0.5 centers the article in the viewport (frontal), phase 1 is its bottom edge
// passing the viewport top (fully left). The `vh` buffer on each side mirrors useSceneProgress's
// useScroll offset (['start end', 'end start']), just anchored to this one article instead of
// the whole #work section.
async function scrollToPhase(page: Page, id: string, phase: number) {
  const article = page.locator(`#work-${id}`);
  const top = await article.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const height = await article.evaluate((el) => el.getBoundingClientRect().height);
  const vh = await page.evaluate(() => window.innerHeight);
  await page.evaluate((y) => window.scrollTo(0, y), top + (height + vh) * phase - vh);
}

test.describe('scene', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('mounts the canvas and hands the screen to the frame', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.scene canvas')).toHaveCount(1, { timeout: 15_000 });
    // Frontal identity (P3-R7) is checked on ipcam (laptop) and pastis (phone) — one of each
    // device kind is enough to prove the handoff pose works for both, without paying CI time to
    // repeat it across all four chapters.
    for (const id of ['ipcam', 'pastis']) {
      const frame = page.locator(`#work-${id} .device`);
      // entering: rotated, matrix applied. toHaveCSS already polls up to its timeout, so no fixed
      // wait is needed before it (fix-round-1, F4).
      await scrollToPhase(page, id, 0.15);
      await expect(frame).toHaveCSS('transform', /matrix3d/);
      await page.screenshot({ path: `e2e/screenshots/scene-${id}-enter.png` });
      // frontal: identity. Under SwiftShader the device's yaw/scale lerp converges slowly — CI
      // runs on SwiftShader and is roughly 3x slower than a local GPU, so this needs a longer
      // timeout than the default 5s to poll all the way to convergence without flaking
      // (fix-round-1, F3).
      await scrollToPhase(page, id, 0.5);
      await expect(frame).toHaveCSS('transform', 'none', { timeout: 15_000 });
      await page.screenshot({ path: `e2e/screenshots/scene-${id}-front.png` });
      // leaving: rotated the other way
      await scrollToPhase(page, id, 0.85);
      await expect(frame).toHaveCSS('transform', /matrix3d/);
      await page.screenshot({ path: `e2e/screenshots/scene-${id}-leave.png` });
    }
  });
});

test.describe('scene off', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  test('no canvas and the picture fallback under reduced motion', async ({ page }) => {
    await page.goto('/');
    // M3: matches useSceneGate's worst-case onIdle gate (requestIdleCallback(..., { timeout:
    // 2000 })) plus margin; 1500ms was shorter than that and could assert "no canvas" on a slow
    // runner before the gate had a chance to open one.
    await page.waitForTimeout(2500);
    await expect(page.locator('.scene canvas')).toHaveCount(0);
    await expect(page.locator('#work-ipcam .chapter__object img')).toHaveAttribute('src', '/fallback/ipcam.png');
    await expect(page.locator('#work-pastis .chapter__object img')).toHaveAttribute('src', '/fallback/cake.png');
  });
});
