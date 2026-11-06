import { expect, test } from '@playwright/test';

test.describe('search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('finds a post and opens it', async ({ page }) => {
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Search posts' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#search-input')).toBeFocused();

    await page.locator('#search-input').fill('jekyll astro');
    const result = page.locator('#search-results a[href="/posts/jekyll-to-astro/"]');
    await expect(result).toBeVisible();
    await expect(result).toContainText('From Jekyll to Astro');

    await result.click();
    await expect(page).toHaveURL('/posts/jekyll-to-astro/');
  });

  test('needs every word to match', async ({ page }) => {
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.locator('#search-input').fill('jekyll');
    await expect(page.locator('#search-results li').first()).toBeVisible();
    await page.locator('#search-input').fill('jekyll zzzunmatchedzzz');
    await expect(page.locator('#search-results li')).toHaveCount(0);
  });

  test('says when nothing matches', async ({ page }) => {
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.locator('#search-input').fill('zzzunmatchedzzz');
    await expect(page.locator('#search-status')).toHaveText('No posts found.');
    await page.locator('#search-input').fill('');
    await expect(page.locator('#search-status')).toHaveText('');
  });

  test('opens with the / key and closes with Escape', async ({ page }) => {
    await page.locator('body').press('/');
    await expect(page.getByRole('dialog', { name: 'Search posts' })).toBeVisible();
    // Typing / in the box is just text, not a shortcut
    await page.keyboard.type('a/b');
    await expect(page.locator('#search-input')).toHaveValue('a/b');
    // One press closes it, even with text in the box
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Search posts' })).toBeHidden();

    // The text is kept and selected, ready to type over
    await page.locator('body').press('/');
    await expect(page.locator('#search-input')).toHaveValue('a/b');
    expect(await page.locator('#search-input').evaluate((input: HTMLInputElement) => input.selectionEnd! - input.selectionStart!)).toBe(3);
  });

  test('closes with its button or a click outside', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Search posts' });
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Close search' }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(dialog).toBeVisible();
    // The backdrop, below the dialog
    await page.mouse.click(5, (page.viewportSize()?.height ?? 600) - 5);
    await expect(dialog).toBeHidden();
  });
});
