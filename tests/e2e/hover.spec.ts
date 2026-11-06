import { expect, test, type Locator } from '@playwright/test';
import { THEMES, useTheme } from './helpers';

const background = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).backgroundColor);
const box = async (locator: Locator) => (await locator.boundingBox())!;

for (const theme of THEMES) {
  test.describe(`in ${theme.id}`, () => {
    test.beforeEach(async ({ page }) => {
      await useTheme(page, theme.id);
      // Hover colours fade in; skip the fade so the end colour can be read straight away
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('hovering a journal entry shows a box without moving its text', async ({ page }) => {
      await page.goto('/');
      const entry = page.locator('.entry article').first();
      const title = entry.locator('.title a');
      const before = { colour: await background(entry), title: await box(title) };

      await title.hover();
      const after = { colour: await background(entry), title: await box(title) };
      expect(after.colour).not.toBe(before.colour);
      expect(after.colour).not.toBe('rgba(0, 0, 0, 0)');
      expect(after.title).toEqual(before.title);
    });

    test('tabbing to a journal entry shows the same box', async ({ page }) => {
      await page.goto('/');
      const entry = page.locator('.entry article').first();
      await page.mouse.move(0, 0);
      const resting = await background(entry);
      await entry.locator('.title a').focus();
      expect(await background(entry)).not.toBe(resting);
    });

    test('hovering a gallery card highlights it', async ({ page }) => {
      await page.goto('/gallery/');
      const card = page.locator('.card').first();
      await page.mouse.move(0, 0);
      const resting = { colour: await background(card), border: await card.evaluate((el) => getComputedStyle(el).borderColor) };
      await card.hover();
      expect(await background(card)).not.toBe(resting.colour);
      expect(await card.evaluate((el) => getComputedStyle(el).borderColor)).not.toBe(resting.border);
    });
  });
}
