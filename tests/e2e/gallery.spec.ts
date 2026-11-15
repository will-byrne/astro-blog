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

  test('a rows gallery reads left to right, then down', async ({ page }) => {
    await page.goto('/gallery/learning-to-draw/');
    const boxes = await page.locator('.grid figure').evaluateAll((figures) =>
      figures.map((figure) => ({ caption: figure.querySelector('.caption')?.textContent, ...figure.getBoundingClientRect().toJSON() })),
    );
    // Sorting by where each drawing sits on screen must give the same order as the Pokédex
    const onScreen = [...boxes].sort((a, b) => Math.round(a.top) - Math.round(b.top) || a.left - b.left).map((box) => box.caption);
    expect(onScreen).toEqual(boxes.map((box) => box.caption));
    expect(onScreen[0]).toBe('#001 Bulbasaur');
  });

  test('sky details open under an astrophotography image', async ({ page }) => {
    await page.goto('/gallery/astrophotography/');
    const details = page.locator('.grid figure .sky').first();
    await expect(details.locator('dl')).toBeHidden();
    await details.getByText('Sky details').click();
    await expect(details.locator('dt').first()).toHaveText('Target');
    await expect(details.locator('dl')).toBeVisible();
  });

  test('the header marks Gallery as the current page on gallery pages', async ({ page }) => {
    await page.goto('/gallery/ai/');
    await expect(page.locator('header nav a[aria-current="page"]')).toHaveText('Gallery');
  });
});
