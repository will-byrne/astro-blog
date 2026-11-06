import type { Page } from '@playwright/test';

export const THEMES = [
  { id: 'latte', base: '#eff1f5' },
  { id: 'frappe', base: '#303446' },
  { id: 'macchiato', base: '#24273a' },
  { id: 'mocha', base: '#1e1e2e' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

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

/** Saves a theme before the page loads, as a returning visitor would have it */
export async function useTheme(page: Page, theme: ThemeId) {
  await page.addInitScript((id) => {
    try {
      localStorage.setItem('theme', id);
    } catch {}
  }, theme);
}

/** "#24273a" -> "rgb(36, 39, 58)", the way browsers report colours */
export function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
