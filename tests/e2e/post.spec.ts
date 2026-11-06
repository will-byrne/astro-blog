import { expect, test } from '@playwright/test';

test.describe('post page', () => {
  test('copies a code block', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/posts/site-colours/');
    const block = page.locator('.code-block').first();
    // By class, as the button's name changes to "Copied"
    const button = block.locator('.copy-button');
    await button.click();
    await expect(button).toHaveText('Copied');
    const code = await block.locator('pre').textContent();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
    await expect(button).toHaveText('Copy', { timeout: 5000 });
  });

  test('labels code blocks with their language', async ({ page }) => {
    await page.goto('/posts/site-colours/');
    await expect(page.locator('.code-block figcaption span').first()).not.toBeEmpty();
  });

  test('enlarges an image and closes it again', async ({ page }) => {
    await page.goto('/posts/site-colours/');
    const image = page.locator('.prose img[data-zoomable]').first();
    const lightbox = page.locator('#lightbox');

    await image.click();
    await expect(lightbox).toBeVisible();
    await expect(lightbox.locator('img')).toHaveAttribute('src', /.+/);
    await expect(lightbox.locator('img')).toHaveAttribute('alt', (await image.getAttribute('alt')) ?? '');

    await lightbox.click();
    await expect(lightbox).toBeHidden();
    await expect(lightbox.locator('img')).not.toHaveAttribute('src');
  });

  test('enlarges an image from the keyboard', async ({ page }) => {
    await page.goto('/posts/site-colours/');
    const image = page.locator('.prose img[data-zoomable]').first();
    await expect(image).toHaveAttribute('role', 'button');
    await image.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#lightbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toBeHidden();
  });

  test('shows back to top after scrolling, and it works', async ({ page }) => {
    await page.goto('/posts/comfyui/');
    const button = page.getByRole('button', { name: 'Back to top' });
    await expect(button).toBeHidden();
    await page.mouse.wheel(0, 3000);
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(button).toBeHidden();
  });

  test('shares with the device share sheet when there is one', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { shared: unknown[] }).shared = [];
      navigator.share = async (data) => {
        (window as unknown as { shared: unknown[] }).shared.push(data);
      };
    });
    await page.goto('/posts/site-colours/#some-heading');
    await page.locator('#share').click();
    const shared = await page.evaluate(() => (window as unknown as { shared: { url: string }[] }).shared);
    // The link leaves out the #section
    expect(shared).toEqual([{ title: await page.title(), url: new URL('/posts/site-colours/', page.url()).href }]);
  });

  test('copies the link when there is no share sheet', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      // @ts-expect-error removing the API to act like a desktop browser without it
      delete Navigator.prototype.share;
    });
    await page.goto('/posts/site-colours/');
    await page.locator('#share').click();
    await expect(page.locator('#share span')).toHaveText('Link copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(new URL('/posts/site-colours/', page.url()).href);
  });

  test('table of contents links jump to their section', async ({ page }) => {
    await page.goto('/posts/jekyll-to-astro/');
    const link = page.locator('.toc a').nth(1);
    const target = (await link.getAttribute('href'))!;
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target)).toBeInViewport();
  });
});
