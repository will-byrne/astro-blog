import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePost } from '../helpers/post';

const { getCollection } = vi.hoisted(() => ({ getCollection: vi.fn() }));
vi.mock('astro:content', () => ({ getCollection }));

const {
  formatDate,
  getCategories,
  getExcerpt,
  getPosts,
  getReadingTime,
  getRelatedPosts,
  getTags,
  groupByYear,
  plainText,
  postUrl,
  slugify,
} = await import('../../src/lib/posts');

afterEach(() => {
  vi.unstubAllEnvs();
  getCollection.mockReset();
});

describe('slugify', () => {
  it.each([
    ['D&D', 'd-d'],
    ['Tech', 'tech'],
    ['Self Improvement', 'self-improvement'],
    ['  --Leading and trailing--  ', 'leading-and-trailing'],
    ['C++ / Rust', 'c-rust'],
    ['iPad', 'ipad'],
    ['AI 2024', 'ai-2024'],
  ])('turns %j into %j', (label, slug) => {
    expect(slugify(label)).toBe(slug);
  });

  it('drops characters outside a-z and 0-9', () => {
    expect(slugify('Café Müsik')).toBe('caf-m-sik');
  });

  it('returns an empty string when nothing is left', () => {
    expect(slugify('!!!')).toBe('');
  });
});

describe('postUrl', () => {
  it('uses the post id with a trailing slash', () => {
    expect(postUrl(makePost({ id: 'ghost_is_dead' }))).toBe('/posts/ghost_is_dead/');
  });
});

describe('getTags', () => {
  it('groups posts under each of their tags', () => {
    const a = makePost({ tags: ['nix', 'linux'] });
    const b = makePost({ tags: ['nix'] });
    const tags = getTags([a, b]);
    expect(tags.map((t) => [t.slug, t.posts.length])).toEqual([
      ['linux', 1],
      ['nix', 2],
    ]);
  });

  it('merges labels that only differ in case, keeping the first label seen', () => {
    const a = makePost({ tags: ['iPad'] });
    const b = makePost({ tags: ['ipad'] });
    const [tag] = getTags([a, b]);
    expect(tag).toMatchObject({ slug: 'ipad', label: 'iPad' });
    expect(tag.posts).toEqual([a, b]);
  });

  it('sorts terms by label', () => {
    const tags = getTags([makePost({ tags: ['zebra', 'Apple', 'mango'] })]);
    expect(tags.map((t) => t.label)).toEqual(['Apple', 'mango', 'zebra']);
  });

  it('skips posts without tags', () => {
    expect(getTags([makePost({ tags: [] })])).toEqual([]);
  });
});

describe('getCategories', () => {
  it('groups posts by their single category', () => {
    const posts = [makePost({ category: 'Music' }), makePost({ category: 'Tech' }), makePost({ category: 'music' })];
    expect(getCategories(posts).map((c) => [c.label, c.posts.length])).toEqual([
      ['Music', 2],
      ['Tech', 1],
    ]);
  });
});

describe('groupByYear', () => {
  it('groups posts by year in the order given', () => {
    const posts = [
      makePost({ pubDate: '2026-03-01T00:00:00Z' }),
      makePost({ pubDate: '2026-01-01T00:00:00Z' }),
      makePost({ pubDate: '2024-06-01T00:00:00Z' }),
    ];
    const groups = groupByYear(posts);
    expect(groups.map(([year, ps]) => [year, ps.length])).toEqual([
      [2026, 2],
      [2024, 1],
    ]);
    expect(groups[0][1]).toEqual([posts[0], posts[1]]);
  });

  it('uses the UTC year, so late posts on 31 December stay in that year', () => {
    const [[year]] = groupByYear([makePost({ pubDate: '2024-12-31T23:30:00Z' })]);
    expect(year).toBe(2024);
  });

  it('returns nothing for no posts', () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe('getRelatedPosts', () => {
  const post = makePost({ id: 'self', category: 'Tech', tags: ['nix', 'linux', 'ai'] });

  it('ranks posts by shared tags, with the category worth half a tag', () => {
    const twoTags = makePost({ id: 'two', category: 'Music', tags: ['nix', 'linux'] });
    const oneTagSameCategory = makePost({ id: 'one-plus', category: 'Tech', tags: ['ai'] });
    const oneTag = makePost({ id: 'one', category: 'Music', tags: ['ai'] });
    const categoryOnly = makePost({ id: 'cat', category: 'Tech', tags: [] });
    const related = getRelatedPosts(post, [categoryOnly, oneTag, oneTagSameCategory, twoTags], 10);
    expect(related.map((p) => p.id)).toEqual(['two', 'one-plus', 'one', 'cat']);
  });

  it('never includes the post itself', () => {
    expect(getRelatedPosts(post, [post])).toEqual([]);
  });

  it('leaves out posts with nothing in common', () => {
    const unrelated = makePost({ category: 'Music', tags: ['clarinet'] });
    expect(getRelatedPosts(post, [unrelated])).toEqual([]);
  });

  it('keeps the given order on a tie, so newest first stays newest first', () => {
    const newer = makePost({ id: 'newer', category: 'Tech' });
    const older = makePost({ id: 'older', category: 'Tech' });
    expect(getRelatedPosts(post, [newer, older]).map((p) => p.id)).toEqual(['newer', 'older']);
  });

  it('returns at most three posts by default', () => {
    const many = Array.from({ length: 5 }, () => makePost({ category: 'Tech' }));
    expect(getRelatedPosts(post, many)).toHaveLength(3);
  });

  it('honours a custom limit', () => {
    const many = Array.from({ length: 5 }, () => makePost({ category: 'Tech' }));
    expect(getRelatedPosts(post, many, 1)).toHaveLength(1);
  });
});

describe('plainText', () => {
  it('keeps link text and drops the URL', () => {
    expect(plainText('Read [the docs](https://astro.build) now')).toBe('Read the docs now');
  });

  it('drops images entirely', () => {
    expect(plainText('Before ![a cat](/cat.png) after')).toBe('Before after');
  });

  it('drops HTML tags and comments', () => {
    expect(plainText('<p>Hello</p> <!-- hidden --> <br/>world')).toBe('Hello world');
  });

  it('drops code fence lines but keeps their contents', () => {
    expect(plainText('```js\nconst a = 1;\n```')).toBe('const a = 1;');
  });

  it('removes Markdown punctuation and collapses whitespace', () => {
    expect(plainText('# Title\n\n> **bold** and _italic_ and `code`\n\n\n')).toBe('Title bold and italic and code');
  });
});

describe('getExcerpt', () => {
  it('prefers the description when there is one', () => {
    expect(getExcerpt(makePost({ description: 'Short summary', body: 'Long body' }))).toBe('Short summary');
  });

  it('leaves out headings, code blocks and list markers', () => {
    const body = '# Heading\n\nIntro text.\n\n```sh\nrm -rf /\n```\n\n- first\n* second';
    expect(getExcerpt(makePost({ body }))).toBe('Intro text. first second');
  });

  it('returns short text unchanged', () => {
    expect(getExcerpt(makePost({ body: 'Just a little.' }))).toBe('Just a little.');
  });

  it('cuts long text at a word boundary and adds an ellipsis', () => {
    const body = 'word '.repeat(100);
    const excerpt = getExcerpt(makePost({ body }), 22);
    expect(excerpt).toBe('word word word word…');
  });

  it('never goes over the limit before the ellipsis', () => {
    const body = 'abcdefghij '.repeat(50);
    const excerpt = getExcerpt(makePost({ body }), 50);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.length - 1).toBeLessThanOrEqual(50);
    expect(excerpt).not.toMatch(/\s…$/);
  });

  it('returns an empty string for an empty post', () => {
    expect(getExcerpt(makePost({ body: '' }))).toBe('');
  });
});

describe('getReadingTime', () => {
  it.each([
    [0, 1],
    [1, 1],
    [200, 1],
    [201, 2],
    [1000, 5],
  ])('%i words take %i minute(s)', (words, minutes) => {
    expect(getReadingTime(makePost({ body: 'word '.repeat(words) }))).toBe(minutes);
  });

  it('does not count link URLs or image Markdown as words', () => {
    const body = `${'word '.repeat(200)} ![alt text here](/a.png) [link](https://example.com/a/b/c)`;
    expect(getReadingTime(makePost({ body }))).toBe(2);
  });
});

describe('formatDate', () => {
  it('formats dates in British English', () => {
    expect(formatDate(new Date('2026-11-01T12:00:00Z'))).toBe('1 November 2026');
  });

  it('uses UTC, so the date does not shift with the time of day', () => {
    expect(formatDate(new Date('2024-03-08T00:00:00Z'))).toBe('8 March 2024');
    expect(formatDate(new Date('2024-03-08T23:59:59Z'))).toBe('8 March 2024');
  });
});

describe('getPosts', () => {
  const draft = makePost({ id: 'draft', draft: true, pubDate: '2025-01-01T00:00:00Z' });
  const older = makePost({ id: 'older', pubDate: '2023-01-01T00:00:00Z' });
  const newer = makePost({ id: 'newer', pubDate: '2026-01-01T00:00:00Z' });

  function useCollection(posts: ReturnType<typeof makePost>[]) {
    getCollection.mockImplementation(async (_name: string, filter: (post: unknown) => boolean) => posts.filter(filter));
  }

  it('hides drafts in a production build', async () => {
    vi.stubEnv('DEV', false);
    useCollection([older, draft, newer]);
    expect((await getPosts()).map((p) => p.id)).toEqual(['newer', 'older']);
  });

  it('shows drafts in the dev server', async () => {
    vi.stubEnv('DEV', true);
    useCollection([older, draft, newer]);
    expect((await getPosts()).map((p) => p.id)).toEqual(['newer', 'draft', 'older']);
  });

  it('reads the posts collection', async () => {
    useCollection([]);
    await getPosts();
    expect(getCollection).toHaveBeenCalledWith('posts', expect.any(Function));
  });
});
