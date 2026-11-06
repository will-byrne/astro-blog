import { expect, test } from '@playwright/test';

test.describe('gallery', () => {
  test('a card opens its gallery, and the back link returns', async ({ page }) => {
    await page.goto('/gallery/');
    const card = page.locator('.card').first();
    const title = (await card.locator('h2').textContent())!.trim();
    // The whole card is clickable, not just the title: click on the cover image
    await card.click({ position: { x: 40, y: 40 } });
    await expect(page.locator('h1')).toHaveText(title);
    await page.getByRole('link', { name: '← All galleries' }).click();
    await expect(page).toHaveURL('/gallery/');
  });

  test('gallery images open in the lightbox', async ({ page }) => {
    await page.goto('/gallery/ai/');
    const image = page.locator('.grid img').first();
    await image.click();
    await expect(page.locator('#lightbox')).toBeVisible();
    await expect(page.locator('#lightbox img')).toHaveAttribute('alt', (await image.getAttribute('alt'))!);
  });

  test('the header marks Gallery as the current page on gallery pages', async ({ page }) => {
    await page.goto('/gallery/ai/');
    await expect(page.locator('header nav a[aria-current="page"]')).toHaveText('Gallery');
  });
});
