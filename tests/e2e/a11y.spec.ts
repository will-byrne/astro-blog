import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, THEMES, useTheme } from './helpers';

// Checks every kind of page in every theme against WCAG 2.1 AA
for (const theme of THEMES) {
  test.describe(`accessibility in ${theme.id}`, () => {
    for (const path of PAGES) {
      test(path, async ({ page }) => {
        await useTheme(page, theme.id);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);

        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        // One readable line per problem, naming the element
        const problems = results.violations.flatMap((violation) =>
          violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')} — ${node.failureSummary?.split('\n').slice(1).join(' ').trim()}`),
        );
        expect(problems).toEqual([]);
      });
    }
  });
}
