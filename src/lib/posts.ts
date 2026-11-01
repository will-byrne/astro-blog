import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export const SITE_TITLE = "Will's Tech Blog";
export const SITE_DESCRIPTION = 'A journal of tech, music and life.';
export const POSTS_PER_PAGE = 10;

// Drafts are visible in `astro dev` but never built for production
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export const postUrl = (post: Post) => `/posts/${post.id}/`;

// Keeps the tag and category URLs from the old Jekyll site, e.g. "D&D" -> "d-d"
export function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export interface Term {
  slug: string;
  label: string;
  posts: Post[];
}

// Groups by slug so that labels differing only in case share one page
function groupPosts(posts: Post[], labelsOf: (post: Post) => string[]): Term[] {
  const terms = new Map<string, Term>();
  for (const post of posts) {
    for (const label of labelsOf(post)) {
      const slug = slugify(label);
      const term = terms.get(slug) ?? { slug, label, posts: [] };
      term.posts.push(post);
      terms.set(slug, term);
    }
  }
  return [...terms.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export const getTags = (posts: Post[]) => groupPosts(posts, (post) => post.data.tags);
export const getCategories = (posts: Post[]) => groupPosts(posts, (post) => [post.data.category]);

export function groupByYear(posts: Post[]): [number, Post[]][] {
  const years = new Map<number, Post[]>();
  for (const post of posts) {
    const year = post.data.pubDate.getUTCFullYear();
    years.set(year, [...(years.get(year) ?? []), post]);
  }
  return [...years];
}

// Posts sharing the most tags and category, newest first on a tie
export function getRelatedPosts(post: Post, posts: Post[], limit = 3): Post[] {
  const score = (other: Post) =>
    other.data.tags.filter((tag) => post.data.tags.includes(tag)).length +
    (other.data.category === post.data.category ? 0.5 : 0);
  return posts
    .filter((other) => other.id !== post.id && score(other) > 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

export function plainText(markdown: string): string {
  return markdown
    .replace(/^```.*$/gm, ' ')
    .replace(/<!--[\s\S]*?-->|<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getExcerpt(post: Post, maxLength = 200): string {
  if (post.data.description) return post.data.description;
  const prose = (post.body ?? '').replace(/```[\s\S]*?```/g, ' ').replace(/^#+\s.*$/gm, ' ').replace(/^\s*[-*+]\s+/gm, '');
  const text = plainText(prose);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

// 200 words per minute
export function getReadingTime(post: Post): number {
  const words = plainText(post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 200) || 1;
}

// Dates are stored in UTC, so format them that way or they shift with the build machine's timezone
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
