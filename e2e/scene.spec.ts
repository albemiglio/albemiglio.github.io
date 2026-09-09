import { expect, test } from '@playwright/test';

test.describe('scene', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('mounts the canvas and hands the screen to the frame', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.scene canvas')).toHaveCount(1, { timeout: 15_000 });
    // useSceneProgress tracks #work (not #work-ipcam): the section wraps the "Work" title above
    // the chapter and useScroll's offset ['start end', 'end start'] adds a viewport-height buffer
    // on each side, so the entering/frontal/leaving windows land relative to #work's own box.
    const work = page.locator('#work');
    const top = await work.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const height = await work.evaluate((el) => el.getBoundingClientRect().height);
    const frame = page.locator('#work-ipcam .device');
    // entering: rotated, matrix applied. toHaveCSS already polls up to its timeout, so no fixed
    // wait is needed before it (fix-round-1, F4).
    await page.evaluate((y) => window.scrollTo(0, y), top - height * 0.3);
    await expect(frame).toHaveCSS('transform', /matrix3d/);
    await page.screenshot({ path: 'e2e/screenshots/scene-enter.png' });
    // frontal: identity. Under SwiftShader the device's yaw/scale lerp converges slowly — CI runs
    // on SwiftShader and is roughly 3x slower than a local GPU, so this needs a longer timeout
    // than the default 5s to poll all the way to convergence without flaking (fix-round-1, F3).
    await page.evaluate((y) => window.scrollTo(0, y), top + height * 0.05);
    await expect(frame).toHaveCSS('transform', 'none', { timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/scene-front.png' });
    // leaving: rotated the other way
    await page.evaluate((y) => window.scrollTo(0, y), top + height * 0.7);
    await expect(frame).toHaveCSS('transform', /matrix3d/);
    await page.screenshot({ path: 'e2e/screenshots/scene-leave.png' });
  });
});

test.describe('scene off', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  test('no canvas and the picture fallback under reduced motion', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await expect(page.locator('.scene canvas')).toHaveCount(0);
    await expect(page.locator('#work-ipcam .chapter__object img')).toHaveAttribute('src', '/fallback/ipcam.png');
  });
});
