import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSTS_DIR, readPosts } from '../helpers/content';

// Checks the real posts, so a mistake in a new post is caught before it is deployed
const posts = readPosts();
const slugs = new Set(posts.map((post) => post.slug));

it('finds the posts', () => {
  expect(posts.length).toBeGreaterThan(0);
});

it('gives every post its own URL', () => {
  const seen = new Map<string, string>();
  const clashes = posts.flatMap((post) => {
    const other = seen.get(post.slug);
    seen.set(post.slug, post.file);
    return other ? [`${other} and ${post.file} both become /posts/${post.slug}/`] : [];
  });
  expect(clashes).toEqual([]);
});

describe.each(posts)('$file', (post) => {
  it('has frontmatter', () => {
    expect(post.hasFrontmatter).toBe(true);
  });

  it('is named YYYY-MM-DD-slug.md', () => {
    expect(post.file).toMatch(/^\d{4}-\d{2}-\d{2}-[\w-]+\.md$/);
  });

  it('has a title and a category', () => {
    expect(post.data.title, 'title').toEqual(expect.any(String));
    expect(post.data.title.trim()).not.toBe('');
    expect(post.data.category, 'category').toEqual(expect.any(String));
    expect(post.data.category.trim()).not.toBe('');
  });

  it('has a valid publish date', () => {
    const date = new Date(post.data.pubDate);
    expect(Number.isNaN(date.getTime()), `pubDate ${post.data.pubDate}`).toBe(false);
  });

  it('has an updated date after the publish date, if it has one', () => {
    if (post.data.updated === undefined) return;
    expect(new Date(post.data.updated).getTime()).toBeGreaterThanOrEqual(new Date(post.data.pubDate).getTime());
  });

  it('lists tags as text', () => {
    const tags = post.data.tags ?? [];
    expect(Array.isArray(tags)).toBe(true);
    for (const tag of tags) expect(tag, `tag ${tag}`).toEqual(expect.any(String));
  });

  it('does not repeat a tag', () => {
    const tags: string[] = (post.data.tags ?? []).map((tag: string) => tag.toLowerCase());
    expect(tags.filter((tag, i) => tags.indexOf(tag) !== i)).toEqual([]);
  });

  it('points to a cover image that exists', () => {
    const url = post.data.image?.url;
    if (!url) return;
    expect(existsSync(resolve(POSTS_DIR, url)), url).toBe(true);
  });

  it('points to images that exist', () => {
    const images = [...post.prose.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]).filter((src) => !/^(https?:)?\/\//.test(src));
    const missing = images.filter((src) => {
      // Absolute paths are served from public/
      const path = src.startsWith('/') ? join('public', decodeURI(src)) : resolve(POSTS_DIR, decodeURI(src));
      return !existsSync(path);
    });
    expect(missing).toEqual([]);
  });

  it('only links to posts that exist', () => {
    const links = [...post.prose.matchAll(/\]\(\/posts\/([^/)#?\s]+)/g)].map((m) => m[1]);
    expect(links.filter((slug) => !slugs.has(slug))).toEqual([]);
  });
});

