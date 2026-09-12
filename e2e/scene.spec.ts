import { expect, test } from '@playwright/test';

test.describe('hero ring', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('turns from one screen to the next, and names the one it stops on', async ({ page }) => {
    await page.goto('/');
    const ring = page.locator('.hero__ring');
    const caption = page.locator('.hero__caption');
    await expect(ring).toBeVisible();
    const first = await caption.textContent();

    // Wait on the caption, not the clock: it only changes once the turn has landed, so this is
    // also how we know the ring has arrived rather than being caught mid-turn.
    await expect(caption).not.toHaveText(first!, { timeout: 15_000 });
    // Every distance in the ring is written in `cqw` against .hero__sculpture. Where container
    // units are missing or the container is not one, the panels fall back to auto and collapse —
    // so measure the front panel against its box rather than only checking it is on screen.
    const fit = await page.evaluate(() => {
      const box = document.querySelector('.hero__sculpture')!.getBoundingClientRect();
      // The lit one: the other two are turned away, so their boxes are foreshortened to nothing.
      const front = [...document.querySelectorAll<HTMLElement>('.hero__panel')].find((p) => p.style.opacity === '1')!;
      const panel = front.getBoundingClientRect();
      return { w: panel.width / box.width, h: panel.height / box.height };
    });
    expect(fit.w).toBeGreaterThan(0.6);
    expect(fit.w).toBeLessThan(1.05);
    expect(fit.h).toBeGreaterThan(0.3);
    // The DOM has arrived by here; give the compositor a moment so the shot isn't mid-turn.
    await page.waitForTimeout(400);
    await page.locator('#hero').screenshot({ path: 'e2e/screenshots/hero-ring.png' });
  });

  test('no WebGL: the ring is plain DOM', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toHaveCount(0);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });

  test('the ring stands still, and the chapters still carry the product', async ({ page }) => {
    await page.goto('/');
    const caption = page.locator('.hero__caption');
    const first = await caption.textContent();
    await page.waitForTimeout(6200);
    await expect(caption).toHaveText(first!);
    await expect(page.locator('#work-ipcam .screen .shot')).toHaveAttribute('src', /^\/shots\/ipcam\//);
    await expect(page.locator('#work-med .screen .shot')).toHaveAttribute('src', /^\/shots\/med\//);
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the still carries the hero, and the ring is not in the way', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero__still img')).toBeVisible();
    await expect(page.locator('.hero__ring-stage')).toBeHidden();
  });
});
