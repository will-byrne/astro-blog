/**
 * The themes in the picker. Most of the year it offers the four Catppuccin flavours; in pride mode they make way for
 * pride flags, starting on Rainbow. Pride mode is on all through June (Pride Month). The rest of the year it is an
 * easter egg: pressing the rainbow in the footer, or p, turns it on and off again, and it stays as it was left
 * between visits. The colours are in src/styles/global.css.
 *
 * Each swatch shows the theme's base with its icon in the accent colour; a flag's swatch shows the flag instead,
 * from the --flag-<id> stops in global.css.
 */
export interface Theme {
  id: string;
  label: string;
  icon: 'sun' | 'sunset' | 'moon' | 'moon-star' | 'heart';
  /** The page background, also used for the browser's theme-color */
  base: string;
  /** The swatch icon's colour */
  ink: string;
  flag?: boolean;
}

export const YEAR_THEMES: Theme[] = [
  { id: 'latte', label: 'Latte', icon: 'sun', base: '#eff1f5', ink: '#8839ef' },
  { id: 'frappe', label: 'Frappé', icon: 'sunset', base: '#303446', ink: '#ca9ee6' },
  { id: 'macchiato', label: 'Macchiato', icon: 'moon', base: '#24273a', ink: '#c6a0f6' },
  { id: 'mocha', label: 'Mocha', icon: 'moon-star', base: '#1e1e2e', ink: '#cba6f7' },
];

export const PRIDE_THEMES: Theme[] = [
  { id: 'rainbow', label: 'Rainbow', icon: 'heart', base: '#1b1a24', ink: '#1b1a24', flag: true },
  { id: 'trans', label: 'Trans', icon: 'heart', base: '#fdf7fa', ink: '#3a2c3e', flag: true },
  { id: 'bi', label: 'Bi', icon: 'heart', base: '#1c1630', ink: '#ffffff', flag: true },
  { id: 'lesbian', label: 'Lesbian', icon: 'heart', base: '#261a1f', ink: '#261a1f', flag: true },
  { id: 'nonbinary', label: 'Non-binary', icon: 'heart', base: '#1e1c22', ink: '#1e1c22', flag: true },
  { id: 'ace', label: 'Asexual', icon: 'heart', base: '#161417', ink: '#800080', flag: true },
  { id: 'pan', label: 'Pan', icon: 'heart', base: '#1f1a2e', ink: '#1f1a2e', flag: true },
];

export const DEFAULT_THEME = 'macchiato';
/** The first pride flag, in June or when pride mode is turned on */
export const PRIDE_DEFAULT_THEME = 'rainbow';

/** Pride themes are saved apart from the usual choice, so leaving pride mode brings back whatever was picked before */
export const STORAGE_KEY = 'theme';
export const PRIDE_STORAGE_KEY = 'pride-theme';
/** 'on' while pride mode is turned on outside June */
export const PRIDE_MODE_KEY = 'pride-mode';
