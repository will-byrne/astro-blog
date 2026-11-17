import type { Page } from '@playwright/test';

// The usual themes, offered most of the year
export const YEAR_THEMES = [
  { id: 'latte', base: '#eff1f5' },
  { id: 'frappe', base: '#303446' },
  { id: 'macchiato', base: '#24273a' },
  { id: 'mocha', base: '#1e1e2e' },
] as const;

// The pride flags offered in pride mode instead: all June, or when turned on with the rainbow in the footer
export const PRIDE_THEMES = [
  { id: 'rainbow', base: '#1b1a24' },
  { id: 'trans', base: '#fdf7fa' },
  { id: 'bi', base: '#1c1630' },
  { id: 'lesbian', base: '#261a1f' },
  { id: 'nonbinary', base: '#1e1c22' },
  { id: 'ace', base: '#161417' },
  { id: 'pan', base: '#1f1a2e' },
] as const;

export const THEMES = [...YEAR_THEMES, ...PRIDE_THEMES] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const JUNE = new Date('2026-06-15T12:00:00Z');
export const NOVEMBER = new Date('2026-11-15T12:00:00Z');

// One of each kind of page
export const PAGES = [
  '/',
  '/page2/',
  '/posts/site-colours/',
  '/archives/',
  '/categories/',
  '/categories/blog/',
  '/tags/',
  '/about/',
  '/resume/',
  '/gallery/',
  '/gallery/ai/',
  '/404.html',
];

/**
 * Saves a theme before the page loads, as a returning visitor would have it. Pride flags are offered in pride mode,
 * so for those the clock is set to June.
 */
export async function useTheme(page: Page, theme: ThemeId) {
  const pride = PRIDE_THEMES.some((t) => t.id === theme);
  if (pride) await page.clock.setFixedTime(JUNE);
  await page.addInitScript(
    ([id, key]) => {
      try {
        localStorage.setItem(key, id);
      } catch {}
    },
    [theme, pride ? 'pride-theme' : 'theme'],
  );
}

/** "#24273a" -> "rgb(36, 39, 58)", the way browsers report colours */
export function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
