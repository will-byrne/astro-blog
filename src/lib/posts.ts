import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export const SITE_TITLE = "Will's Tech Blog";
export const SITE_TAGLINE = 'Tech, Music and Life';
export const SITE_DESCRIPTION = 'A collection of my musings on tech, music and photography.';
export const AUTHOR_URL = 'https://github.com/will-byrne';
export const POSTS_PER_PAGE = 10;

// Drafts are visible in `astro dev` but never built for production
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export const postUrl = (post: Post) => `/posts/${post.id}/`;

// Matches the tag and category URLs Jekyll generated, e.g. "D&D" -> "d-d"
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
  return [...terms.values()];
}

export function getTags(posts: Post[]): Term[] {
  return groupPosts(posts, (post) => post.data.tags).sort((a, b) => a.label.localeCompare(b.label));
}

// Chirpy sorts categories case-sensitively, so "iPad" comes last
export function getCategories(posts: Post[]): Term[] {
  return groupPosts(posts, (post) => [post.data.category]).sort((a, b) => (a.label < b.label ? -1 : 1));
}

export function getTrendingTags(posts: Post[], limit = 10): Term[] {
  return getTags(posts)
    .sort((a, b) => b.posts.length - a.posts.length || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function getRecentlyUpdated(posts: Post[], limit = 5): Post[] {
  const lastChange = (post: Post) => (post.data.updated ?? post.data.pubDate).getTime();
  return [...posts].sort((a, b) => lastChange(b) - lastChange(a)).slice(0, limit);
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
  const text = plainText(post.body ?? '');
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}...`;
}

export const getWordCount = (post: Post) => plainText(post.body ?? '').split(/\s+/).filter(Boolean).length;

// Chirpy's formula: 180 words per minute, rounded down, at least 1
export const getReadingTime = (post: Post) => Math.floor(getWordCount(post) / 180) || 1;

// Dates are stored in UTC, so format them that way or they shift with the build machine's timezone
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}
