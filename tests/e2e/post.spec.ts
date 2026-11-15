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

  test('the progress bar fills as the post is read', async ({ page }) => {
    await page.goto('/posts/ai-tdd/');
    const bar = page.locator('.reading-progress > div');
    const width = () => bar.evaluate((el) => el.getBoundingClientRect().width);
    expect(await width()).toBe(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await expect.poll(width).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(width).toBe(page.viewportSize()!.width);
  });

  test('a post in a series lists the parts and links to the next one', async ({ page }) => {
    await page.goto('/posts/Blogging-from-my-iPad/');
    const series = page.getByRole('navigation', { name: 'Series: My new iPad' });
    await expect(series).toContainText('Part 1 of 3');
    await expect(series.locator('[aria-current="page"]')).toHaveText('Blogging from my iPad');
    await expect(series.getByRole('link')).toHaveText(['iPad AI', 'iPad Shortcuts For Blogging']);
    // The next part is also the next newer post, so it shows once, in the Newer link
    await expect(page.locator('.next-part')).toHaveCount(0);
    await expect(page.locator('.post-nav .next')).toContainText('Newer, and next in My new iPad');
  });

  test('hovering a link to another post shows a preview of it', async ({ page }) => {
    await page.goto('/posts/ipad_shortcuts/');
    const preview = page.locator('.post-preview');
    await page.locator('.prose a[href="/posts/Blogging-from-my-iPad/"]').first().hover();
    await expect(preview).toBeVisible();
    await expect(preview.locator('.preview-title')).toHaveText('Blogging from my iPad');
    await expect(preview).toContainText('min read');
    await expect(preview).toHaveAttribute('aria-hidden', 'true');
    await page.mouse.move(0, 0);
    await expect(preview).toBeHidden();
  });

  test('tabbing to a link to another post shows its preview, and Escape hides it', async ({ page }) => {
    await page.goto('/posts/ipad_shortcuts/');
    const link = page.locator('.prose a[href="/posts/Blogging-from-my-iPad/"]').first();
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const preview = page.locator('.post-preview');
    await expect(preview).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
  });

  test('links to other sites get no preview', async ({ page }) => {
    await page.goto('/posts/ipad_shortcuts/');
    await page.locator('.prose a[href^="https://www.marcogomiero.com"]').first().hover();
    await page.waitForTimeout(600);
    await expect(page.locator('.post-preview')).toBeHidden();
  });
});
