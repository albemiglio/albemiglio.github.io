import { expect, test } from '@playwright/test';

test.describe('scene', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('mounts the canvas for the hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.scene canvas')).toHaveCount(1, { timeout: 15_000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'e2e/screenshots/scene-hero.png' });
  });
});

test.describe('scene off', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });

  test('no canvas, and the chapters still carry the product', async ({ page }) => {
    await page.goto('/');
    // useSceneGate's worst case after `load`: the 1500ms settle plus the idle callback's own
    // 2000ms timeout. Wait past it with margin or a slow runner asserts before the gate could
    // have opened a canvas at all.
    await page.waitForTimeout(4000);
    await expect(page.locator('.scene canvas')).toHaveCount(0);
    await expect(page.locator('#work-ipcam .screen .shot')).toHaveAttribute('src', /^\/shots\/ipcam\//);
    await expect(page.locator('#work-pastis .screen .shot')).toHaveAttribute('src', /^\/shots\/pastis\//);
  });
});
