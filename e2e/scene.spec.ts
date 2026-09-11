import { expect, test, type Locator, type Page } from '@playwright/test';

// Scrolls so the #work-<id> article sits at `phase` through its own entering/frontal/leaving
// window: phase 0 is the article's bottom edge reaching the viewport top (about to enter from
// below), phase 0.5 centers the article in the viewport (frontal), phase 1 is its bottom edge
// passing the viewport top (fully left). The `vh` buffer on each side mirrors useSceneProgress's
// useScroll offset (['start end', 'end start']), just anchored to this one article instead of
// the whole #work section.
// Hovering the frame pauses the chapter's player, so the 3D poses stop changing and the software
// rasteriser in CI gets a still frame to capture instead of chasing a moving one.
async function settle(page: Page, frame: Locator) {
  await frame.hover();
  await page.waitForTimeout(1500);
}

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
      await settle(page, frame);
      await page.screenshot({ path: `e2e/screenshots/scene-${id}-enter.png` });
      // frontal: identity. Under SwiftShader the device's yaw/scale lerp converges slowly — CI
      // runs on SwiftShader and is roughly 3x slower than a local GPU, so this needs a longer
      // timeout than the default 5s to poll all the way to convergence without flaking
      // (fix-round-1, F3).
      await scrollToPhase(page, id, 0.5);
      await expect(frame).toHaveCSS('transform', 'none', { timeout: 15_000 });
      await settle(page, frame);
      await page.screenshot({ path: `e2e/screenshots/scene-${id}-front.png` });
      // leaving: rotated the other way
      await scrollToPhase(page, id, 0.85);
      await expect(frame).toHaveCSS('transform', /matrix3d/);
      await settle(page, frame);
      await page.screenshot({ path: `e2e/screenshots/scene-${id}-leave.png` });
    }
  });
});

test.describe('scene off', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  test('no canvas and the picture fallback under reduced motion', async ({ page }) => {
    await page.goto('/');
    // F3/M3: useSceneGate's worst case after `load` (which page.goto already waits for) is the
    // 1500ms afterPaint settle plus the requestIdleCallback(..., { timeout: 2000 }) gate itself
    // — 3500ms — so wait past that with margin, or a slow runner could assert "no canvas" before
    // the gate had a chance to open one.
    await page.waitForTimeout(4000);
    await expect(page.locator('.scene canvas')).toHaveCount(0);
    // With no scene there is no 3D device to hand the frame to, so the frame has to stand on its
    // own — and what has to be in it is the product, not a placeholder.
    await expect(page.locator('#work-ipcam .device .shot')).toHaveAttribute('src', /^\/shots\/ipcam\//);
    await expect(page.locator('#work-pastis .device .shot')).toHaveAttribute('src', /^\/shots\/pastis\//);
  });
});
