import { expect, test } from '@playwright/test';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

test.describe('fun', () => {
  test('in June the stripe becomes the pan flag and says Happy Pride', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-15T12:00:00Z'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-pride', '');
    const note = page.locator('.pride-note span');
    await expect(note).toHaveCSS('opacity', '0');
    await page.locator('.pride-note').hover();
    await expect(note).toHaveCSS('opacity', '1');
    await expect(note).toHaveText('Happy Pride 🩷💛🩵');
  });

  test('the rest of the year the stripe is the usual palette', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-pride');
    await expect(page.locator('.pride-note')).toBeHidden();
  });

  test('n turns night vision on and off, and it lasts for the visit', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await page.keyboard.press('n');
    await expect(html).toHaveAttribute('data-night', '');
    await expect(page.locator('#fun-status')).toHaveText(/Night vision on/);
    await expect(page.locator('.page-box')).toHaveCSS('background-color', 'rgb(18, 6, 6)');
    await page.reload();
    await expect(html).toHaveAttribute('data-night', '');
    await page.keyboard.press('n');
    await expect(html).not.toHaveAttribute('data-night');
  });

  test('typing n in the search box does not turn on night vision', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('/');
    await page.keyboard.type('nix');
    await expect(page.locator('html')).not.toHaveAttribute('data-night');
  });

  test('the Konami code turns unicorn mode on and off', async ({ page }) => {
    await page.goto('/posts/ipad_ai/');
    const html = page.locator('html');
    for (const key of KONAMI) await page.keyboard.press(key);
    await expect(html).toHaveAttribute('data-unicorn', '');
    await expect(page).toHaveTitle(/^🦄 Neigh! iPad AI/);
    await expect(page.locator('#fun-status')).toHaveText(/Unicorn mode on/);
    // Rainbow sparkles appear all over the page
    await expect.poll(() => page.locator('.sparkle.rainbow').count()).toBeGreaterThanOrEqual(4);
    // It lasts for the visit
    await page.reload();
    await expect(html).toHaveAttribute('data-unicorn', '');
    await expect(page).toHaveTitle(/^🦄 Neigh! /);
    for (const key of KONAMI) await page.keyboard.press(key);
    await expect(html).not.toHaveAttribute('data-unicorn');
    await expect(page).toHaveTitle(/^iPad AI/);
    // and stop when it is turned off
    await expect(page.locator('.sparkle.rainbow')).toHaveCount(0);
  });

  test('a wrong key starts the Konami code again', async ({ page }) => {
    await page.goto('/');
    for (const key of [...KONAMI.slice(0, 5), 'x', ...KONAMI.slice(5)]) await page.keyboard.press(key);
    await expect(page.locator('html')).not.toHaveAttribute('data-unicorn');
  });

  test('each new selection takes the next palette colour', async ({ page }) => {
    await page.goto('/posts/ipad_ai/');
    const paragraph = page.locator('.prose p').first();
    const colour = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--selection'));
    await paragraph.selectText();
    await expect.poll(colour).toBe('var(--mauve)');
    await page.mouse.click(5, 5);
    await paragraph.selectText();
    await expect.poll(colour).toBe('var(--pink)');
  });

  test('the sparkle cursor is off until switched on, and is remembered', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: '✨ Sparkle cursor' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.mouse.move(200, 200);
    await page.mouse.move(300, 300, { steps: 10 });
    await expect(page.locator('.sparkle')).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await page.mouse.move(200, 200);
    await page.mouse.move(400, 300, { steps: 10 });
    await expect(page.locator('.sparkle').first()).toBeAttached();

    await page.reload();
    await expect(page.getByRole('button', { name: '✨ Sparkle cursor' })).toHaveAttribute('aria-pressed', 'true');
  });

  for (const url of ['/', '/posts/ipad_ai/', '/about/', '/404.html']) {
    test(`a unicorn trots back and forth along the footer on ${url}`, async ({ page }) => {
      await page.goto(url);
      const runner = page.locator('.unicorn-run .runner');
      await expect(runner.locator('.unicorn')).toBeVisible();
      const animation = await runner.evaluate((el) => getComputedStyle(el));
      expect(animation.animationName).toMatch(/patrol/);
      expect(animation.animationIterationCount).toBe('infinite');
      // It moves along
      const x = () => runner.evaluate((el) => el.getBoundingClientRect().x);
      const start = await x();
      await expect.poll(x).not.toBe(start);
    });
  }

  test('the About avatar asks for coffee after five pokes', async ({ page }) => {
    await page.goto('/about/');
    const avatar = page.getByRole('button', { name: 'Poke the unicorn' });
    const bubble = page.locator('.coffee-bubble');
    for (let i = 0; i < 4; i++) await avatar.click();
    await expect(bubble).toBeHidden();
    await avatar.click();
    await expect(bubble).toBeVisible();
    await expect(bubble).toContainText('NEED MORE COFFEE');
    await expect(page.locator('.coffee-cup').first()).toBeAttached();
    // The avatar is a button of its own, not an image to enlarge
    await expect(page.locator('#lightbox')).toBeHidden();
  });

  test('the 404 page has a lost unicorn in Monoceros', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('.lost .unicorn')).toBeVisible();
    await expect(page.locator('.lost .names text')).toHaveText('Monoceros');
    await expect(page.locator('.lost figcaption')).toContainText('a real constellation of a unicorn');
  });

  test('a unicorn gallops off the screen when the post is finished, and not before', async ({ page }) => {
    await page.goto('/posts/ai-tdd/');
    const progress = page.locator('.reading-progress');
    const rider = progress.locator('.rider');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await expect(progress.locator('.fill')).not.toHaveCSS('transform', 'matrix(0, 0, 0, 1, 0, 0)');
    // Out of sight while reading
    await expect(rider).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(progress).toHaveClass(/finished/);
    await expect(rider).toBeVisible();
    // It ends up past the right edge, and out of sight again
    const width = page.viewportSize()!.width;
    await expect.poll(() => rider.evaluate((el) => el.getBoundingClientRect().left), { timeout: 5000 }).toBeGreaterThanOrEqual(width);
    await expect(rider).toBeHidden();
  });

  test.describe('with reduced motion', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('unicorn mode has no sparkles', async ({ page }) => {
      await page.goto('/');
      for (const key of KONAMI) await page.keyboard.press(key);
      await expect(page.locator('html')).toHaveAttribute('data-unicorn', '');
      await page.waitForTimeout(1000);
      await expect(page.locator('.sparkle')).toHaveCount(0);
    });

    test('nothing runs or sparkles: the footer unicorn stands still', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.sparkle-toggle')).toBeHidden();
      const runner = page.locator('.unicorn-run .runner');
      await expect(runner.locator('.unicorn')).toBeVisible();
      expect(await runner.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    });

    test('no unicorn runs at the end of a post', async ({ page }) => {
      await page.goto('/posts/ai-tdd/');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(page.locator('.reading-progress')).toHaveClass(/finished/);
      await expect(page.locator('.reading-progress .rider')).toBeHidden();
    });

    test('the avatar still asks for coffee, without cups falling', async ({ page }) => {
      await page.goto('/about/');
      for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Poke the unicorn' }).click();
      await expect(page.locator('.coffee-bubble')).toBeVisible();
      await expect(page.locator('.coffee-cup')).toHaveCount(0);
    });
  });
});
