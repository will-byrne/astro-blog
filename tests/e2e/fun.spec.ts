import { expect, test } from '@playwright/test';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

test.describe('fun', () => {
  test('in June the stripe says Happy Pride', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-15T12:00:00Z'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-pride', '');
    const note = page.locator('.pride-note span');
    await expect(note).toHaveCSS('opacity', '0');
    await page.locator('.pride-note').hover();
    await expect(note).toHaveCSS('opacity', '1');
    await expect(note).toHaveText('Happy Pride 🌈');
  });

  test('the rest of the year the stripe is the usual palette', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-pride');
    await expect(page.locator('.pride-note')).toBeHidden();
  });

  test('pressing the rainbow in "Made with" turns pride mode on and off, and it is remembered', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
    await page.goto('/');
    const html = page.locator('html');
    const picker = page.getByRole('button', { name: 'Change theme' });
    const options = page.locator('#theme-menu button:visible');
    const rainbow = page.getByRole('button', { name: 'Pride mode' });
    await expect(rainbow).toHaveAttribute('aria-pressed', 'false');

    // On: the pride flags, starting on Rainbow
    await rainbow.click();
    await expect(html).toHaveAttribute('data-pride', '');
    await expect(html).toHaveAttribute('data-theme', 'rainbow');
    await expect(rainbow).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#fun-status')).toHaveText(/Pride mode on/);
    await expect(page.locator('.page-box')).toHaveCSS('background-color', 'rgb(27, 26, 36)');
    await picker.click();
    await expect(options).toHaveText(['Rainbow', 'Trans', 'Bi', 'Lesbian', 'Non-binary', 'Asexual', 'Pan']);
    await page.locator('[data-theme-option="bi"]').click();

    // It lasts between visits, with the flag chosen
    await page.reload();
    await expect(html).toHaveAttribute('data-pride', '');
    await expect(html).toHaveAttribute('data-theme', 'bi');

    // Off: back to the flavours, and the one from before
    await rainbow.click();
    await expect(html).not.toHaveAttribute('data-pride');
    await expect(html).toHaveAttribute('data-theme', 'macchiato');
    await expect(rainbow).toHaveAttribute('aria-pressed', 'false');
    await picker.click();
    await expect(options).toHaveText(['Latte', 'Frappé', 'Macchiato', 'Mocha']);

    // On again, it picks up the flag from last time
    await page.keyboard.press('Escape');
    await rainbow.click();
    await expect(html).toHaveAttribute('data-theme', 'bi');
  });

  test('p turns pride mode on and off', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
    await page.goto('/');
    const html = page.locator('html');
    await page.keyboard.press('p');
    await expect(html).toHaveAttribute('data-pride', '');
    await expect(html).toHaveAttribute('data-theme', 'rainbow');
    await page.keyboard.press('p');
    await expect(html).not.toHaveAttribute('data-pride');
    await expect(html).toHaveAttribute('data-theme', 'macchiato');
  });

  test('in June pride mode stays on', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-15T12:00:00Z'));
    await page.goto('/');
    const html = page.locator('html');
    const rainbow = page.getByRole('button', { name: 'Pride mode' });
    await expect(rainbow).toHaveAttribute('aria-pressed', 'true');
    await rainbow.click();
    await expect(html).toHaveAttribute('data-pride', '');
    await expect(html).toHaveAttribute('data-theme', 'rainbow');
    await expect(page.locator('#fun-status')).toHaveText(/Pride Month/);
  });

  test('each ☕ is another cup: the unicorn speeds up, the fifth rains coffee and the tenth is decaf', async ({ page }) => {
    await page.goto('/');
    const coffee = page.getByRole('button', { name: 'Coffee' });
    const note = page.locator('.coffee-note');
    const runSpeed = () =>
      page.evaluate(() =>
        document
          .querySelector('.unicorn-run')!
          .getAnimations({ subtree: true })
          .find((a) => (a as CSSAnimation).animationName === 'patrol')!.playbackRate,
      );

    await coffee.click();
    await expect(note).toBeVisible();
    await expect(note).toHaveText("Cup 1: Ah, that's better");
    await expect(page.locator('#fun-status')).toHaveText("Cup 1: Ah, that's better");
    await expect(coffee).toHaveAttribute('data-cups', '1');
    expect(await runSpeed()).toBeCloseTo(1.25);

    for (let i = 0; i < 4; i++) await coffee.click();
    await expect(note).toHaveText('Cup 5: It is raining coffee!');
    await expect(page.locator('.coffee-cup').first()).toBeAttached();

    // The cups last for the visit
    await page.reload();
    await expect(coffee).toHaveAttribute('data-cups', '5');
    expect(await runSpeed()).toBeCloseTo(2.25);

    for (let i = 0; i < 5; i++) await page.keyboard.press('c');
    await expect(note).toHaveText("Cup 10: That's enough. Switching to decaf");
    await expect(coffee).not.toHaveAttribute('data-cups');
    expect(await runSpeed()).toBe(1);
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

  test('pressing the 🦄 in "Made with" turns unicorn mode on and off', async ({ page }) => {
    await page.goto('/posts/ipad_ai/');
    const html = page.locator('html');
    const unicorn = page.getByRole('button', { name: 'Unicorn mode' });
    await expect(unicorn).toHaveAttribute('aria-pressed', 'false');
    await expect(unicorn).toHaveText('🦄');
    await unicorn.click();
    await expect(html).toHaveAttribute('data-unicorn', '');
    await expect(unicorn).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveTitle(/^🦄 Neigh! /);
    // The keyboard and the button stay in step
    for (const key of KONAMI) await page.keyboard.press(key);
    await expect(html).not.toHaveAttribute('data-unicorn');
    await expect(unicorn).toHaveAttribute('aria-pressed', 'false');
  });

  test('pressing the 🌙 in "Made with" turns night vision on and off', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const moon = page.getByRole('button', { name: 'Night vision' });
    await expect(moon).toHaveText('🌙');
    await moon.click();
    await expect(html).toHaveAttribute('data-night', '');
    await expect(moon).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Night vision' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Night vision' }).click();
    await expect(html).not.toHaveAttribute('data-night');
  });

  test('the 🦄 and 🌙 are big enough to tap', async ({ page }) => {
    await page.goto('/');
    for (const name of ['Unicorn mode', 'Night vision']) {
      const box = (await page.getByRole('button', { name }).boundingBox())!;
      expect(box.width, name).toBeGreaterThanOrEqual(44);
      expect(box.height, name).toBeGreaterThanOrEqual(44);
    }
  });

  test('the "Made with" line reads naturally', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.made-with')).toHaveText(/Made with\s*,\s*🦄,\s*☕\s*and\s*🌙/);
    // The rainbow is a button, so it has no text of its own
    await expect(page.locator('.made-with').getByRole('button', { name: 'Pride mode' }).locator('svg.rainbow')).toBeVisible();
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

    test('the caffeine meter still talks, without steam or falling cups', async ({ page }) => {
      await page.goto('/');
      for (let i = 0; i < 5; i++) await page.keyboard.press('c');
      await expect(page.locator('.coffee-note')).toHaveText('Cup 5: It is raining coffee!');
      await expect(page.locator('.steam')).toHaveCount(0);
      await expect(page.locator('.coffee-cup')).toHaveCount(0);
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
