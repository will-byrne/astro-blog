import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import {
  buildFrontmatter,
  buildPost,
  cleanTags,
  createPost,
  existingCategories,
  parseTags,
  postFilename,
  postSlug,
} from '../../scripts/post-template';

const date = new Date('2026-11-06T09:30:00Z');

// Reads back the frontmatter the way the content checks do
const frontmatter = (source: string) => parse(source.match(/^---\n([\s\S]*?)\n---\n/)![1]);

describe('postSlug and postFilename', () => {
  it('makes the URL from the title', () => {
    expect(postSlug('My First Post!')).toBe('my-first-post');
  });

  it('puts the date in front', () => {
    expect(postFilename('Jazz & Cats', date)).toBe('2026-11-06-jazz-cats.md');
  });

  it('uses the UTC date, so late-night posts get the right day', () => {
    expect(postFilename('Late', new Date('2026-11-06T23:59:00Z'))).toBe('2026-11-06-late.md');
  });

  it('refuses a title with nothing to make a URL from', () => {
    expect(() => postSlug('!!!')).toThrow(/no letters or numbers/);
  });
});

describe('cleanTags and parseTags', () => {
  it('trims and drops empty tags', () => {
    expect(parseTags(' Nix, Linux ,, Rice ,')).toEqual(['Nix', 'Linux', 'Rice']);
  });

  it('drops repeats, ignoring case, and keeps the first spelling', () => {
    expect(cleanTags(['iPad', 'AI', 'ipad', 'ai'])).toEqual(['iPad', 'AI']);
  });

  it('gives no tags for an empty answer', () => {
    expect(parseTags('')).toEqual([]);
  });
});

describe('buildFrontmatter', () => {
  it('fills in the fields in the same order as the existing posts', () => {
    const source = buildFrontmatter({ title: 'Nix', category: 'Linux', tags: ['Nix', 'Linux'], date });
    expect(source).toBe(
      ['---', 'title: Nix', 'pubDate: 2026-11-06', 'author: Will Byrne', 'category: Linux', 'tags:', '  - Nix', '  - Linux', 'draft: true', '---', ''].join('\n'),
    );
  });

  it('starts as a draft unless told otherwise', () => {
    expect(frontmatter(buildFrontmatter({ title: 'A', category: 'B' })).draft).toBe(true);
    expect(frontmatter(buildFrontmatter({ title: 'A', category: 'B', draft: false }))).not.toHaveProperty('draft');
  });

  it('defaults to today', () => {
    expect(frontmatter(buildFrontmatter({ title: 'A', category: 'B' })).pubDate).toBe(new Date().toISOString().slice(0, 10));
  });

  it('adds a description and cover image only when given', () => {
    const bare = frontmatter(buildFrontmatter({ title: 'A', category: 'B' }));
    expect(bare).not.toHaveProperty('description');
    expect(bare).not.toHaveProperty('image');

    const full = frontmatter(buildFrontmatter({ title: 'A', category: 'B', description: ' Summary ', image: 'ai/dragon.jpeg', imageAlt: 'A dragon' }));
    expect(full.description).toBe('Summary');
    expect(full.image).toEqual({ url: '../../assets/images/ai/dragon.jpeg', alt: 'A dragon' });
  });

  it('quotes titles that would otherwise break the YAML', () => {
    const titles = ['Testing: a colon', "It's #1", '- starts with a dash', 'yes', '2026', '"quoted"', 'Café & Müsik'];
    for (const title of titles) expect(frontmatter(buildFrontmatter({ title, category: 'B' })).title).toBe(title);
  });

  it('keeps long descriptions on one line', () => {
    const description = 'word '.repeat(40).trim();
    const source = buildFrontmatter({ title: 'A', category: 'B', description });
    expect(source).toContain(`description: ${description}\n`);
  });

  it('needs a title and a category', () => {
    expect(() => buildFrontmatter({ title: '  ', category: 'B' })).toThrow(/title/);
    expect(() => buildFrontmatter({ title: 'A', category: '' })).toThrow(/category/);
  });
});

describe('buildPost', () => {
  it('follows the frontmatter with a place to start writing', () => {
    const source = buildPost({ title: 'A', category: 'B', date });
    expect(source.startsWith('---\n')).toBe(true);
    expect(source).toMatch(/\n---\n\nStart writing here\.\n$/);
  });
});

describe('with a posts folder', () => {
  let root: string;
  let postsDir: string;
  let imagesDir: string;
  const options = () => ({ dir: postsDir, imagesDir });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'new-post-'));
    postsDir = join(root, 'posts');
    imagesDir = join(root, 'images');
    mkdirSync(postsDir);
    mkdirSync(join(imagesDir, 'ai'), { recursive: true });
    writeFileSync(join(imagesDir, 'ai', 'dragon.jpeg'), '');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const writePost = (file: string, category: string) => writeFileSync(join(postsDir, file), `---\ntitle: x\ncategory: ${category}\n---\nBody`);

  describe('createPost', () => {
    it('writes the post and returns its path', () => {
      const path = createPost({ title: 'Hello World', category: 'Blog', tags: ['Astro'], date }, options());
      expect(path).toBe(join(postsDir, '2026-11-06-hello-world.md'));
      expect(readFileSync(path, 'utf8')).toBe(buildPost({ title: 'Hello World', category: 'Blog', tags: ['Astro'], date }));
    });

    it('refuses a title whose URL another post already uses, whatever its date or case', () => {
      writePost('2021-12-03-Hello_World.md', 'Blog');
      writePost('2024-01-01-hello-world.md', 'Blog');
      expect(() => createPost({ title: 'Hello World', category: 'Blog', date }, options())).toThrow(/already uses the URL \/posts\/hello-world\//);
    });

    it('allows a similar but different URL', () => {
      writePost('2024-01-01-hello.md', 'Blog');
      expect(() => createPost({ title: 'Hello World', category: 'Blog', date }, options())).not.toThrow();
    });

    it('checks that the cover image exists', () => {
      expect(() => createPost({ title: 'A', category: 'B', image: 'missing.png' }, options())).toThrow(/no image at src\/assets\/images\/missing\.png/);
      expect(() => createPost({ title: 'A', category: 'B', image: 'ai/dragon.jpeg' }, options())).not.toThrow();
    });

    it('writes nothing when it refuses', () => {
      expect(() => createPost({ title: 'A', category: '' }, options())).toThrow();
      expect(readdirSync(postsDir)).toEqual([]);
    });
  });

  describe('existingCategories', () => {
    it('lists categories with the most used first, then alphabetically', () => {
      writePost('2024-01-01-a.md', 'Music');
      writePost('2024-01-02-b.md', 'Blog');
      writePost('2024-01-03-c.md', 'Blog');
      writePost('2024-01-04-d.md', 'AI');
      writeFileSync(join(postsDir, 'notes.txt'), 'not a post');
      expect(existingCategories(postsDir)).toEqual(['Blog', 'AI', 'Music']);
    });

    it('finds the real categories', () => {
      expect(existingCategories()).toContain('Blog');
    });
  });
});
