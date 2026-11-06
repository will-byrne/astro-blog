import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { DIST, exists, page, pageUrls } from './dist';
import { join } from 'node:path';

const SITE = 'https://willbyrne.dev';
// 404.html is not a page anyone shares
const urls = pageUrls().filter((url) => url !== '/404.html');
const meta = (url: string, key: string) =>
  page(url).querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content');

describe.each(urls)('link preview for %s', (url) => {
  it('has a large image card', () => {
    expect(meta(url, 'twitter:card')).toBe('summary_large_image');
  });

  it('has an image on the live site that was built', () => {
    const image = meta(url, 'og:image')!;
    expect(image.startsWith(`${SITE}/`), image).toBe(true);
    expect(exists(new URL(image).pathname), image).toBe(true);
  });

  it('gives the real size of the image, in the shape previews use', async () => {
    const path = new URL(meta(url, 'og:image')!).pathname;
    const { width, height } = await sharp(join(DIST, path)).metadata();
    expect(`${width}x${height}`).toBe(`${meta(url, 'og:image:width')}x${meta(url, 'og:image:height')}`);
    expect(width! / height!).toBeCloseTo(1200 / 630, 1);
    // Smaller than this and some sites show a small thumbnail instead of a large card
    expect(width).toBeGreaterThanOrEqual(600);
  });
});

it('uses the default image, with alt text, on pages without their own', () => {
  for (const url of ['/', '/about/', '/archives/']) {
    expect(meta(url, 'og:image')).toMatch(/\/og-default\.[\w-]+\.jpeg$/);
    expect(meta(url, 'og:image:alt')).toBe("Will's Tech Blog: A journal of tech, music and life.");
  }
});

it("uses a post's cover image and its alt text", () => {
  expect(meta('/posts/Astrophotography/', 'og:image')).toMatch(/\/andromeda\.[\w-]+\.jpeg$/);
  expect(meta('/posts/Astrophotography/', 'og:image:alt')).toBe('Andromeda galaxy');
});
