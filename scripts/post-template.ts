// Helpers for starting a new post with its frontmatter filled in. Used by scripts/new-post.ts.
// Plain TypeScript with no Astro imports, so Node can run it directly.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';
import { slugify } from '../src/lib/slugify.ts';

export const POSTS_DIR = resolve('src/content/posts');
export const IMAGES_DIR = resolve('src/assets/images');
export const DEFAULT_AUTHOR = 'Will Byrne';

export interface NewPost {
  title: string;
  category: string;
  tags?: string[];
  description?: string;
  /** A file inside src/assets/images, e.g. "clarinet.jpg" or "ai/dragon.jpeg" */
  image?: string;
  imageAlt?: string;
  /** Defaults to today, in UTC to match how dates are shown */
  date?: Date;
  author?: string;
  /** New posts start as drafts so they are not published by accident */
  draft?: boolean;
}

/** YYYY-MM-DD in UTC */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** The part of the URL after /posts/, e.g. "My First Post!" -> "my-first-post" */
export function postSlug(title: string): string {
  const slug = slugify(title);
  if (!slug) throw new Error(`"${title}" has no letters or numbers to make a URL from`);
  return slug;
}

/** e.g. 2026-11-06-my-first-post.md */
export const postFilename = (title: string, date = new Date()) => `${isoDate(date)}-${postSlug(title)}.md`;

/** Tidies a list of tags: trims them, drops empty ones and repeats (ignoring case), keeps the order */
export function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Splits "Nix, Linux ,Rice" into ["Nix", "Linux", "Rice"] */
export const parseTags = (value: string) => cleanTags(value.split(','));

/** The frontmatter block, including the --- lines, in the same order as the existing posts */
export function buildFrontmatter(post: NewPost): string {
  const title = post.title.trim();
  const category = post.category.trim();
  if (!title) throw new Error('A post needs a title');
  if (!category) throw new Error('A post needs a category');

  const data: Record<string, unknown> = {
    title,
    pubDate: isoDate(post.date ?? new Date()),
    author: post.author ?? DEFAULT_AUTHOR,
    category,
    tags: cleanTags(post.tags ?? []),
  };
  if (post.description?.trim()) data.description = post.description.trim();
  if (post.image) {
    // Cover images are resolved from the post's folder
    data.image = { url: `../../assets/images/${post.image.replace(/^\/+/, '')}`, alt: post.imageAlt?.trim() ?? '' };
  }
  if (post.draft ?? true) data.draft = true;

  return `---\n${stringify(data, { lineWidth: 0 })}---\n`;
}

/** The whole Markdown file: frontmatter plus a starting point for the text */
export const buildPost = (post: NewPost) => `${buildFrontmatter(post)}\nStart writing here.\n`;

/** Every category used so far, most used first, so the same spelling gets reused */
export function existingCategories(dir = POSTS_DIR): string[] {
  const counts = new Map<string, number>();
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const match = readFileSync(join(dir, file), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const category = match && parse(match[1])?.category;
    if (typeof category === 'string') counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([category]) => category);
}

/**
 * Writes a new post and returns its path. Refuses to overwrite anything, and refuses
 * a title whose URL another post already uses, as URLs leave out the date.
 */
export function createPost(post: NewPost, { dir = POSTS_DIR, imagesDir = IMAGES_DIR } = {}): string {
  const date = post.date ?? new Date();
  const slug = postSlug(post.title);
  const clash = readdirSync(dir).find((name) => name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '').toLowerCase() === slug);
  if (clash) throw new Error(`${clash} already uses the URL /posts/${slug}/, so pick a different title`);
  if (post.image && !existsSync(join(imagesDir, post.image))) {
    throw new Error(`There is no image at src/assets/images/${post.image}`);
  }

  const path = join(dir, postFilename(post.title, date));
  writeFileSync(path, buildPost({ ...post, date }), { flag: 'wx' });
  return path;
}
