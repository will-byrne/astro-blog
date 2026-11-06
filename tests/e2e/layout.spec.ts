import { expect, test } from '@playwright/test';
import { PAGES } from './helpers';

test.describe('layout', () => {
  for (const path of PAGES) {
    test(`${path} fits the screen without sideways scrolling`, async ({ page }) => {
      await page.goto(path);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});

test.describe('fonts', () => {
  test('text uses Atkinson Hyperlegible, never a serif fallback', async ({ page }) => {
    await page.goto('/posts/site-colours/');
    await page.evaluate(() => document.fonts.ready);

    const fontOf = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).fontFamily);
    for (const selector of ['body', 'h1', '.prose h2', '.prose p', '.meta']) {
      expect(await fontOf(selector), selector).toMatch(/^"?Atkinson Hyperlegible Next/);
    }
    expect(await fontOf('.prose pre code'), 'code').toMatch(/^"?Atkinson Hyperlegible Mono/);
    for (const family of await Promise.all(['body', 'pre code'].map(fontOf))) expect(family).not.toMatch(/(^|,\s*)serif\b/);

    // The fonts really loaded, rather than falling back to whatever the system has
    const loaded = await page.evaluate(() => [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family));
    expect(loaded.join(' ')).toContain('Atkinson Hyperlegible Next');
    expect(loaded.join(' ')).toContain('Atkinson Hyperlegible Mono');
  });
});
