import { expect, test } from '@playwright/test';

const chapters = [
  { id: 'ipcam', shots: [0, 2, 4] },
  { id: 'asd', shots: [0, 1, 3] },
  { id: 'pastis', shots: [1, 2, 4] },
  { id: 'med', shots: [0, 2, 3] },
];

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const c of chapters) {
    test(`chapter ${c.id} renders its key steps`, async ({ page }) => {
      await page.goto('/');
      await page.locator(`#work-${c.id}`).scrollIntoViewIfNeeded();
      const steps = page.locator(`#work-${c.id} .step`);
      const stepCount = await steps.count();
      for (let i = 0; i < stepCount; i++) {
        const box = await steps.nth(i).boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
      const tracks = page.locator(`#work-${c.id} .step__track`);
      const trackCount = await tracks.count();
      const ys: number[] = [];
      for (let i = 0; i < trackCount; i++) {
        const box = await tracks.nth(i).boundingBox();
        ys.push(Math.round(box?.y ?? 0));
      }
      expect(new Set(ys).size).toBe(1);
      for (const i of c.shots) {
        await steps.nth(i).click();
        await expect(steps.nth(i)).toHaveAttribute('aria-current', 'step');
        await page.waitForTimeout(700);
        await page.locator(`#work-${c.id}`).screenshot({ path: `e2e/screenshots/${c.id}-desktop-${i}.png` });
      }
    });
  }
});

test.describe('mobile 390', () => {
  test('no horizontal scroll and every chapter renders', async ({ page }) => {
    await page.setContent('<style>html,body{margin:0;background:#0B0D10}</style><iframe id="f" src="http://127.0.0.1:4173/" style="width:390px;height:844px;border:0"></iframe>');
    const frame = page.frameLocator('#f');
    await expect(frame.locator('#work-ipcam')).toBeVisible();
    let inner = page.frame({ url: /127\.0\.0\.1:4173/ });
    if (!inner) {
      await frame.locator('#work-ipcam').waitFor();
      inner = page.frame({ url: /127\.0\.0\.1:4173/ });
    }
    if (!inner) throw new Error('iframe for 127.0.0.1:4173 not found');
    // Checked once for the whole page: layout width doesn't vary per chapter.
    const [scrollWidth, innerWidth] = await inner.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    for (const c of chapters) {
      await frame.locator(`#work-${c.id}`).scrollIntoViewIfNeeded();
      const steps = frame.locator(`#work-${c.id} .step`);
      const stepCount = await steps.count();
      for (let i = 0; i < stepCount; i++) {
        const box = await steps.nth(i).boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
      const tracks = frame.locator(`#work-${c.id} .step__track`);
      const trackCount = await tracks.count();
      const ys: number[] = [];
      for (let i = 0; i < trackCount; i++) {
        const box = await tracks.nth(i).boundingBox();
        ys.push(Math.round(box?.y ?? 0));
      }
      expect(new Set(ys).size).toBe(1);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `e2e/screenshots/${c.id}-mobile.png` });
    }
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  test('shows the last step without autoplay', async ({ page }) => {
    await page.goto('/');
    for (const c of chapters) {
      await page.locator(`#work-${c.id}`).scrollIntoViewIfNeeded();
      await expect(page.locator(`#work-${c.id} .step`).last()).toHaveAttribute('aria-current', 'step');
      await page.waitForTimeout(2500);
      await expect(page.locator(`#work-${c.id} .step`).last()).toHaveAttribute('aria-current', 'step');
      if (c.id === 'ipcam') {
        const waveSpan = page.locator('#work-ipcam .ipcam__wave span').first();
        const anim = await waveSpan.evaluate((el) => {
          const cs = getComputedStyle(el);
          return { name: cs.animationName, duration: parseFloat(cs.animationDuration) };
        });
        expect(anim.name === 'none' || anim.duration <= 0.001).toBe(true);
      }
      await page.locator(`#work-${c.id}`).screenshot({ path: `e2e/screenshots/${c.id}-reduced.png` });
    }
  });
});
