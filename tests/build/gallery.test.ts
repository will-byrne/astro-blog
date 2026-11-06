import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { slugify } from '../../src/lib/slugify';
import { page } from './dist';

const GALLERY_DIR = resolve('src/assets/gallery');
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

// Every folder with images in it should be a section showing all of them
const folders = readdirSync(GALLERY_DIR)
  .filter((name) => statSync(join(GALLERY_DIR, name)).isDirectory())
  .map((name) => ({ name, id: slugify(name) || name, count: readdirSync(join(GALLERY_DIR, name)).filter((file) => IMAGE.test(file)).length }))
  .filter((folder) => folder.count > 0);

const doc = page('/gallery/');
const sections = doc.querySelectorAll('main section');

it('has a section for every gallery folder with images', () => {
  expect(sections.map((section) => section.querySelector('h2')?.id).sort()).toEqual(folders.map((folder) => folder.id).sort());
});

describe.each(folders)('the $name section', ({ id, count }) => {
  const section = sections.find((s) => s.querySelector('h2')?.id === id)!;

  it(`shows all ${count} images`, () => {
    expect(section.querySelectorAll('img')).toHaveLength(count);
  });

  it('gives every image alt text and makes it zoomable', () => {
    for (const img of section.querySelectorAll('img')) {
      expect(img.getAttribute('alt')?.trim()).toBeTruthy();
      expect(img.hasAttribute('data-zoomable')).toBe(true);
    }
  });

  it('is labelled by its heading', () => {
    expect(section.getAttribute('aria-labelledby')).toBe(id);
  });
});

it('links to each section when there is more than one', () => {
  const links = doc.querySelectorAll('nav[aria-label="Gallery sections"] a').map((a) => a.getAttribute('href'));
  expect(links).toEqual(folders.length > 1 ? sections.map((s) => `#${s.querySelector('h2')!.id}`) : []);
});
