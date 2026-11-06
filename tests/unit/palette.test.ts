import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Reads each flavour's colours straight from the stylesheet and checks that text stays readable
const css = readFileSync('src/styles/global.css', 'utf8');
const FLAVOURS = ['latte', 'frappe', 'macchiato', 'mocha'] as const;

function palette(flavour: string): Record<string, string> {
  const block = css.match(new RegExp(`:root\\[data-theme='${flavour}'\\]\\s*\\{([^}]*)\\}`))?.[1];
  if (!block) throw new Error(`No colours for ${flavour} in global.css`);
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map(([, name, hex]) => [name, hex.toLowerCase()]));
}

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = (hex: string) =>
  channels(hex)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** Like CSS color-mix(in srgb, a p%, b) */
const mix = (a: string, b: string, p: number) =>
  `#${channels(a)
    .map((v, i) => Math.round((v * p + channels(b)[i] * (1 - p)) * 255).toString(16).padStart(2, '0'))
    .join('')}`;

// Accents used for links, headings and other text
const TEXT_ACCENTS = ['lavender', 'mauve', 'pink', 'peach', 'yellow', 'green', 'teal', 'sapphire', 'blue'];
// The colours the journal and gallery cycle through, which also tint the hover boxes
const CYCLE = ['mauve', 'pink', 'peach', 'yellow', 'green', 'teal', 'sapphire', 'blue'];
const AA = 4.5;
const AA_LARGE = 3;

describe.each(FLAVOURS)('%s', (flavour) => {
  const colours = palette(flavour);

  it('defines every colour the checks need', () => {
    for (const name of ['base', 'mantle', 'surface0', 'text', 'subtext1', ...TEXT_ACCENTS]) expect(colours[name], name).toMatch(/^#/);
  });

  it.each(['text', 'subtext1'])('%s is readable on the page and on panels', (name) => {
    for (const background of ['base', 'mantle']) {
      expect(contrast(colours[name], colours[background]), `${name} on ${background}`).toBeGreaterThanOrEqual(AA);
    }
  });

  it.each(TEXT_ACCENTS)('%s is readable as text on the page and on panels', (name) => {
    for (const background of ['base', 'mantle']) {
      expect(contrast(colours[name], colours[background]), `${name} on ${background}`).toBeGreaterThanOrEqual(AA);
    }
  });

  it.each(CYCLE)('text stays readable on the %s hover box', (accent) => {
    // Matches color-mix(in srgb, var(--accent) 8%, var(--mantle)) on journal entries and gallery cards
    const box = mix(colours[accent], colours.mantle, 0.08);
    for (const name of ['text', 'subtext1']) {
      expect(contrast(colours[name], box), `${name} on the ${accent} box`).toBeGreaterThanOrEqual(AA);
    }
    // Journal titles turn the accent colour on hover. They are bold and at least 1.3rem (20.8px),
    // which WCAG counts as large text, so they need 3:1
    expect(contrast(colours[accent], box), `${accent} title on the ${accent} box`).toBeGreaterThanOrEqual(AA_LARGE);
  });
});

describe('contrast', () => {
  it('matches known values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });
});
