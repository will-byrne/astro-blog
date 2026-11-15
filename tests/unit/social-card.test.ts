import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CARD_HEIGHT, CARD_WIDTH, renderSocialCard, titleSize } from '../../src/lib/social-card';

describe('titleSize', () => {
  it('makes shorter titles bigger', () => {
    const sizes = ['Nix', 'Blogging from my iPad', 'Supporting Each Others Development at Work', 'A'.repeat(80)].map(titleSize);
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
    expect(new Set(sizes).size).toBe(4);
  });
});

describe('renderSocialCard', () => {
  const content = async (image?: Buffer) => ({
    title: 'Blogging from my iPad',
    details: '17 May 2024 · 3 min read · iPad',
    series: 'Part 1 of 3 in My new iPad',
    image,
    avatar: await readFile('src/assets/images/avatar.jpg'),
    site: "Will's Tech Blog",
    domain: 'willbyrne.dev',
  });

  it.each([
    ['with a cover image', 'src/assets/images/iPad.jpg'],
    ['without one', undefined],
  ])('makes a 1200x630 PNG %s', async (_, file) => {
    const png = await renderSocialCard(await content(file ? await readFile(file) : undefined));
    const { width, height, format } = await sharp(png).metadata();
    expect({ width, height, format }).toEqual({ width: CARD_WIDTH, height: CARD_HEIGHT, format: 'png' });
  }, 20_000);
});
