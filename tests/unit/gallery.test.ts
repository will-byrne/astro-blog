import type { ImageMetadata } from 'astro';
import { describe, expect, it } from 'vitest';
import { buildSections, describeFile, humanise } from '../../src/lib/gallery';

const img = (name: string) => ({ src: name, width: 100, height: 100, format: 'jpg' }) as unknown as ImageMetadata;

// Shaped like the result of import.meta.glob in the gallery page
function glob(...paths: string[]) {
  return Object.fromEntries(paths.map((path) => [`../assets/gallery/${path}`, img(path)]));
}
const config = (folder: string, value: unknown) => ({ [`../assets/gallery/${folder}/section.json`]: value });
const files = (section: { images: { file: string }[] }) => section.images.map((image) => image.file);

describe('humanise', () => {
  it.each([
    ['glass_nebula_fox', 'Glass nebula fox'],
    ['dragon-2', 'Dragon 2'],
    ['astrophotography', 'Astrophotography'],
    ['  my__drawings  ', 'My drawings'],
  ])('turns %j into %j', (name, label) => {
    expect(humanise(name)).toBe(label);
  });
});

describe('describeFile', () => {
  it('makes alt text from the file name', () => {
    expect(describeFile('sith_cat.jpeg')).toEqual({ alt: 'Sith cat', date: undefined });
  });

  it('reads a date prefix and leaves it out of the alt text', () => {
    expect(describeFile('2026-11-06-first_sketch.jpg')).toEqual({ alt: 'First sketch', date: new Date('2026-11-06T00:00:00Z') });
  });

  it('accepts an underscore or space after the date', () => {
    expect(describeFile('2026-11-06_hands.png').alt).toBe('Hands');
    expect(describeFile('2026-11-06 hands.png').alt).toBe('Hands');
  });

  it('ignores a date that does not exist', () => {
    expect(describeFile('2026-02-30-oops.jpg')).toEqual({ alt: '2026 02 30 oops', date: undefined });
  });

  it('copes with a file that is only a date', () => {
    expect(describeFile('2026-11-06.jpg')).toEqual({ alt: '2026 11 06', date: new Date('2026-11-06T00:00:00Z') });
  });
});

describe('buildSections', () => {
  it('makes a section for each folder', () => {
    const sections = buildSections(glob('ai/dragon.jpeg', 'ai/fox.jpeg', 'astrophotography/m31.jpg'));
    expect(sections.map((s) => [s.id, s.title, s.images.length])).toEqual([
      ['ai', 'Ai', 2],
      ['astrophotography', 'Astrophotography', 1],
    ]);
  });

  it('ignores images outside a section folder or nested deeper', () => {
    const sections = buildSections(glob('loose.jpg', 'ai/dragon.jpeg', 'ai/old/dragon.jpeg'));
    expect(sections.map((s) => [s.id, files(s)])).toEqual([['ai', ['dragon.jpeg']]]);
  });

  it('leaves out folders with no images', () => {
    expect(buildSections({}, config('drawings', { title: 'Drawings' }))).toEqual([]);
  });

  it('sorts undated images by file name', () => {
    const [section] = buildSections(glob('ai/c.jpg', 'ai/a.jpg', 'ai/b.jpg'));
    expect(files(section)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('sorts dated images oldest first by default, then undated ones', () => {
    const [section] = buildSections(glob('drawings/untitled.jpg', 'drawings/2026-12-01-b.jpg', 'drawings/2026-01-15-a.jpg'));
    expect(files(section)).toEqual(['2026-01-15-a.jpg', '2026-12-01-b.jpg', 'untitled.jpg']);
  });

  it('can show the newest first', () => {
    const [section] = buildSections(
      glob('drawings/2026-01-15-a.jpg', 'drawings/2026-12-01-b.jpg', 'drawings/2026-06-01-c.jpg'),
      config('drawings', { newestFirst: true }),
    );
    expect(files(section)).toEqual(['2026-12-01-b.jpg', '2026-06-01-c.jpg', '2026-01-15-a.jpg']);
  });

  it('uses the title and description from section.json', () => {
    const [section] = buildSections(glob('ai/a.jpg'), config('ai', { title: 'AI art', description: 'Made on my iPad.' }));
    expect(section).toMatchObject({ id: 'ai', title: 'AI art', description: 'Made on my iPad.' });
  });

  it('puts sections with an order first, then the rest by title', () => {
    const sections = buildSections(
      glob('zebra/a.jpg', 'ai/a.jpg', 'drawings/a.jpg', 'astrophotography/a.jpg'),
      { ...config('drawings', { order: 2 }), ...config('astrophotography', { order: 1 }) },
    );
    expect(sections.map((s) => s.id)).toEqual(['astrophotography', 'drawings', 'ai', 'zebra']);
  });

  it('makes a safe id from the folder name', () => {
    const [section] = buildSections(glob('My Drawings/a.jpg'));
    expect(section).toMatchObject({ id: 'my-drawings', title: 'My Drawings' });
  });

  it('fails clearly on a misspelt field', () => {
    expect(() => buildSections(glob('ai/a.jpg'), config('ai', { titel: 'AI art' }))).toThrow(/ai\/section\.json/);
  });

  it('fails clearly on a field of the wrong type', () => {
    expect(() => buildSections(glob('ai/a.jpg'), config('ai', { order: 'first' }))).toThrow(/ai\/section\.json: order/);
  });
});
