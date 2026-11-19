/**
 * Choosing, saving and showing the theme, and pride mode, shared by the theme picker and the rainbow in fun.ts.
 * BaseLayout applies the saved theme, and pride mode, before the page paints; this keeps everything else in step.
 */
import { DEFAULT_THEME, PRIDE_DEFAULT_THEME, PRIDE_MODE_KEY, PRIDE_STORAGE_KEY, STORAGE_KEY } from '../lib/themes';

const root = document.documentElement;
const isJune = () => new Date().getMonth() === 5;
const isPride = () => 'pride' in root.dataset;
const storageKey = () => (isPride() ? PRIDE_STORAGE_KEY : STORAGE_KEY);
const defaultTheme = () => (isPride() ? PRIDE_DEFAULT_THEME : DEFAULT_THEME);

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Without storage the choice lasts for this page only
  }
}

const allOptions = () => [...document.querySelectorAll<HTMLButtonElement>('[data-theme-option]')];
/** Whether an option belongs in the picker right now: the pride flags in pride mode, the flavours otherwise */
const offered = (option: HTMLElement) => option.dataset.season === (isPride() ? 'pride' : 'year');

export const currentTheme = () => root.dataset.theme || defaultTheme();

/** The picker's options, in order, that are showing */
export const themeOptions = () => allOptions().filter((option) => !option.closest('li')!.hidden);

export function applyTheme(id: string) {
  root.dataset.theme = id;
  for (const option of allOptions()) {
    option.closest('li')!.hidden = !offered(option);
    const current = option.dataset.themeOption === id;
    option.setAttribute('aria-pressed', String(current));
    if (current) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', option.dataset.base!);
  }
  for (const button of document.querySelectorAll('[data-pride-toggle]')) button.setAttribute('aria-pressed', String(isPride()));
}

/** Applies a theme and remembers it for next time */
export function chooseTheme(id: string) {
  applyTheme(id);
  write(storageKey(), id);
}

/**
 * Turns pride mode on or off, switching to the theme last chosen in that mode. In June it is always on, so this
 * leaves it be. Says what happened: 'on', 'off' or 'june'.
 */
export function togglePrideMode() {
  if (isJune()) return 'june';
  const on = !isPride();
  if (on) root.dataset.pride = '';
  else delete root.dataset.pride;
  write(PRIDE_MODE_KEY, on ? 'on' : 'off');
  const saved = read(storageKey());
  applyTheme(allOptions().some((option) => offered(option) && option.dataset.themeOption === saved) ? saved! : defaultTheme());
  return on ? 'on' : 'off';
}
