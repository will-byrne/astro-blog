import { expect, test } from '@playwright/test';
import { JUNE, NOVEMBER, PRIDE_THEMES, rgb, YEAR_THEMES, useTheme } from './helpers';

test.describe('theme picker', () => {
  for (const [season, themes, date] of [
    ['most of the year', YEAR_THEMES, NOVEMBER],
    ['in June', PRIDE_THEMES, JUNE],
  ] as const) {
    for (const theme of themes) {
      test(`${season}, switches to ${theme.id} and remembers it`, async ({ page }) => {
        await page.clock.setFixedTime(date);
        await page.goto('/');
        await page.getByRole('button', { name: 'Change theme' }).click();
        await page.locator(`[data-theme-option="${theme.id}"]`).click();

        const html = page.locator('html');
        await expect(html).toHaveAttribute('data-theme', theme.id);
        await expect(page.locator(`[data-theme-option="${theme.id}"]`)).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', theme.base);
        await expect(page.locator('.page-box')).toHaveCSS('background-color', rgb(theme.base));

        await page.reload();
        await expect(html).toHaveAttribute('data-theme', theme.id);
        await expect(page.locator('.page-box')).toHaveCSS('background-color', rgb(theme.base));
      });
    }
  }

  test('most of the year offers the Catppuccin flavours', async ({ page }) => {
    await page.clock.setFixedTime(NOVEMBER);
    await page.goto('/');
    await page.getByRole('button', { name: 'Change theme' }).click();
    await expect(page.locator('#theme-menu button:visible')).toHaveText(['Latte', 'Frappé', 'Macchiato', 'Mocha']);
  });

  test('in June offers the pride flags, starting on Rainbow', async ({ page }) => {
    await page.clock.setFixedTime(JUNE);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'rainbow');
    await page.getByRole('button', { name: 'Change theme' }).click();
    await expect(page.locator('#theme-menu button:visible')).toHaveText(['Rainbow', 'Trans', 'Bi', 'Lesbian', 'Non-binary', 'Asexual', 'Pan']);
    await expect(page.locator('[data-theme-option="rainbow"]')).toBeFocused();
  });

  test('a flavour chosen before June comes back in July', async ({ page }) => {
    await useTheme(page, 'latte');
    await page.clock.setFixedTime(JUNE);
    await page.goto('/');
    await page.getByRole('button', { name: 'Change theme' }).click();
    await page.locator('[data-theme-option="trans"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'trans');

    await page.clock.setFixedTime(new Date('2026-07-01T12:00:00Z'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'latte');
  });

  test('applies a saved theme before the page is drawn', async ({ page }) => {
    await useTheme(page, 'latte');
    // Records the theme at the moment <body> starts, before anything is drawn and before deferred scripts run
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        (window as unknown as { themeAtBody: string | undefined }).themeAtBody = document.documentElement.dataset.theme;
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto('/');
    expect(await page.evaluate(() => (window as unknown as { themeAtBody?: string }).themeAtBody)).toBe('latte');
  });

  test('uses Macchiato for a first visit', async ({ page }) => {
    await page.clock.setFixedTime(NOVEMBER);
    await page.goto('/');
    await expect(page.locator('[data-theme-option="macchiato"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.page-box')).toHaveCSS('background-color', rgb('#24273a'));
  });

  test('still works when the browser blocks storage', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Blocked', 'SecurityError');
        },
      });
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(NOVEMBER);
    await page.goto('/');
    await page.getByRole('button', { name: 'Change theme' }).click();
    await page.locator('[data-theme-option="mocha"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'mocha');
    expect(errors).toEqual([]);
  });

  test('works with the keyboard', async ({ page }) => {
    await page.clock.setFixedTime(NOVEMBER);
    await useTheme(page, 'frappe');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Change theme' });
    await toggle.focus();
    await page.keyboard.press('Enter');

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // Opening moves focus to the current flavour
    await expect(page.locator('[data-theme-option="frappe"]')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-theme-option="macchiato"]')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('[data-theme-option="latte"]')).toBeFocused();
    // Up from the first wraps round to the last
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('[data-theme-option="mocha"]')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('#theme-menu')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('closes when clicking elsewhere', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Change theme' }).click();
    await expect(page.locator('#theme-menu')).toBeVisible();
    // An empty spot low on the page, clear of the open menu on every screen size
    await page.mouse.click(10, (page.viewportSize()?.height ?? 600) - 10);
    await expect(page.locator('#theme-menu')).toBeHidden();
  });
});
