import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { slugify } from '../../src/lib/slugify';
import { exists, page } from './dist';

const GALLERY_DIR = resolve('src/assets/gallery');
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

// Every folder with images in it should be a gallery with its own page showing all of them
const folders = readdirSync(GALLERY_DIR)
  .filter((name) => statSync(join(GALLERY_DIR, name)).isDirectory())
  .map((name) => ({
    name,
    url: `/gallery/${slugify(name) || name}/`,
    count: readdirSync(join(GALLERY_DIR, name)).filter((file) => IMAGE.test(file)).length,
  }))
  .filter((folder) => folder.count > 0);

describe('the /gallery/ index', () => {
  const doc = page('/gallery/');
  const cards = doc.querySelectorAll('main .card');

  it('has a card for every gallery, linking to its page', () => {
    expect(cards.map((card) => card.querySelector('h2 a')?.getAttribute('href')).sort()).toEqual(folders.map((f) => f.url).sort());
  });

  it.each(folders)('shows how many images $name has', ({ url, count }) => {
    const card = cards.find((c) => c.querySelector('h2 a')?.getAttribute('href') === url)!;
    expect(card.querySelector('.meta')?.text).toBe(`${count} ${count === 1 ? 'image' : 'images'}`);
  });

  it('gives every card a cover image', () => {
    for (const card of cards) expect(card.querySelector('img.cover')).toBeTruthy();
  });
});

describe.each(folders)('the $name gallery', ({ url, count }) => {
  it('has its own page', () => {
    expect(exists(url)).toBe(true);
  });

  it(`shows all ${count} images`, () => {
    expect(page(url).querySelectorAll('main .grid img')).toHaveLength(count);
  });

  it('gives every image alt text and makes it zoomable', () => {
    for (const img of page(url).querySelectorAll('main .grid img')) {
      expect(img.getAttribute('alt')?.trim()).toBeTruthy();
      expect(img.hasAttribute('data-zoomable')).toBe(true);
    }
  });

  it('links back to all galleries and on to the others', () => {
    const doc = page(url);
    expect(doc.querySelector('main a[href="/gallery/"]')).toBeTruthy();
    const others = doc.querySelectorAll('nav[aria-label="Other galleries"] a').map((a) => a.getAttribute('href'));
    expect(others.sort()).toEqual(folders.filter((f) => f.url !== url).map((f) => f.url).sort());
  });
});
