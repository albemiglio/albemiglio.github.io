import { expect, test, type Page } from '@playwright/test';

// The DOM frame rides the 3D screen through a matrix3d built from the frame's layout box and the
// screen's projected corners. If those two are measured a frame apart — which is what happens on
// an engine that scrolls asynchronously, Safari above all — the UI slides off the device while
// the page is moving, even though every still frame looks right. So this scrolls CONTINUOUSLY and
// checks the invariant at every step: the corners the scene published must be where the browser
// actually painted the frame.
async function alignmentError(page: Page, id: string): Promise<number | null> {
  return page.evaluate((chapter) => {
    const el = document.querySelector<HTMLElement>(`#work-${chapter} .device`);
    if (!el) return null;
    const quad = el.dataset.quad;
    if (!quad) return null; // frontal: no matrix, nothing to check
    const pts = quad.split(' ').map((p) => p.split(',').map(Number));
    const box = el.getBoundingClientRect();
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return Math.max(
      Math.abs(Math.min(...xs) - box.left), Math.abs(Math.max(...xs) - box.right),
      Math.abs(Math.min(...ys) - box.top), Math.abs(Math.max(...ys) - box.bottom),
    );
  }, id);
}

test.describe('device handoff', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the frame stays glued to the 3D screen through a continuous scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.scene canvas')).toHaveCount(1, { timeout: 20_000 });
    const article = page.locator('#work-ipcam');
    const { top, height } = await article.evaluate((el) => ({ top: el.getBoundingClientRect().top + window.scrollY, height: el.getBoundingClientRect().height }));
    // Start just before the chapter and wheel through it in small steps, like a trackpad.
    await page.evaluate((y) => window.scrollTo(0, y), top + (height + 900) * 0.15 - 900);
    await page.waitForTimeout(1500);

    const errors: number[] = [];
    const transforms = new Set<string>();
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 45);
      // A beat for the compositor to hand the new scroll position to the page: without it the
      // sample races the scroll itself rather than measuring the handoff.
      await page.waitForTimeout(120);
      const e = await alignmentError(page, 'ipcam');
      if (e !== null) errors.push(e);
      transforms.add(await page.locator('#work-ipcam .device').evaluate((el) => getComputedStyle(el).transform));
    }
    expect(errors.length, 'the matrix path never ran during the scroll').toBeGreaterThan(5);
    expect(transforms.size, 'the scene never followed the scroll').toBeGreaterThan(5);
    // 2 px covers sub-pixel rounding in data-quad; a stale layout box misses by tens of pixels.
    expect(Math.max(...errors), `worst misalignment across ${errors.length} samples`).toBeLessThanOrEqual(2);
  });

  test('the frame is glued at rest, entering and leaving', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.scene canvas')).toHaveCount(1, { timeout: 20_000 });
    const article = page.locator('#work-ipcam');
    const { top, height } = await article.evaluate((el) => ({ top: el.getBoundingClientRect().top + window.scrollY, height: el.getBoundingClientRect().height }));
    for (const phase of [0.2, 0.8]) {
      await page.evaluate((y) => window.scrollTo(0, y), top + (height + 900) * phase - 900);
      await page.waitForTimeout(2000);
      const e = await alignmentError(page, 'ipcam');
      expect(e, `phase ${phase} published no quad`).not.toBeNull();
      expect(e!, `phase ${phase} misalignment`).toBeLessThanOrEqual(2);
    }
  });
});
