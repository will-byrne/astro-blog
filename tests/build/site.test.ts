import { XMLParser } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';
import { POSTS_PER_PAGE } from '../../src/lib/posts';
import { readPosts } from '../helpers/content';
import { distFiles, exists, page, pageUrls, readDist } from './dist';

const SITE = 'https://willbyrne.dev';
const sourcePosts = readPosts();
const published = sourcePosts.filter((post) => !post.data.draft);
const drafts = sourcePosts.filter((post) => post.data.draft);
const urls = pageUrls();
const xml = new XMLParser({ ignoreAttributes: false });
const asArray = <T>(value: T | T[]) => (Array.isArray(value) ? value : [value]);

// These posts use `#` headings in their Markdown, adding more h1s below the title.
// Change them to `##` and remove them from this list; the test below fails if one is fixed but still listed.
const KNOWN_EXTRA_H1 = [
  '/posts/Astrophotography/',
  '/posts/collaborative_meetings/',
  '/posts/comfyui/',
  '/posts/ipad_ai/',
  '/posts/supporting_development/',
];

it('only lists pages that still have extra main headings', () => {
  const fixed = KNOWN_EXTRA_H1.filter((url) => !exists(url) || page(url).querySelectorAll('h1').length === 1);
  expect(fixed).toEqual([]);
});

describe('every page', () => {
  describe.each(urls)('%s', (url) => {
    const doc = page(url);

    it('is in English', () => {
      expect(doc.querySelector('html')?.getAttribute('lang')).toBe('en');
    });

    it('has a title', () => {
      expect(doc.querySelector('title')?.text.trim()).toBeTruthy();
    });

    it('has a description', () => {
      expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()).toBeTruthy();
    });

    it.skipIf(KNOWN_EXTRA_H1.includes(url))('has exactly one main heading', () => {
      expect(doc.querySelectorAll('h1')).toHaveLength(1);
    });

    it('has a canonical URL on the live site', () => {
      const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
      expect(canonical?.startsWith(`${SITE}/`)).toBe(true);
    });
  });
});

describe('links', () => {
  // Site-relative URLs in href, src and srcset, ignoring protocol-relative ones like //example.com
  function internalUrls(url: string): string[] {
    const doc = page(url);
    const hrefs = doc.querySelectorAll('[href]').map((el) => el.getAttribute('href')!);
    const srcs = doc.querySelectorAll('[src]').map((el) => el.getAttribute('src')!);
    const srcsets = doc
      .querySelectorAll('[srcset]')
      .flatMap((el) => el.getAttribute('srcset')!.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]));
    return [...hrefs, ...srcs, ...srcsets].filter((link) => link.startsWith('/') && !link.startsWith('//'));
  }

  it.each(urls)('on %s all point to something that was built', (url) => {
    const broken = [...new Set(internalUrls(url))].filter((link) => !exists(link));
    expect(broken).toEqual([]);
  });

  it.each(urls)('on %s all point to sections that exist', (url) => {
    const doc = page(url);
    const missing = doc
      .querySelectorAll('a[href^="#"]')
      .map((a) => decodeURIComponent(a.getAttribute('href')!.slice(1)))
      .filter((id) => id && !doc.getElementById(id));
    expect([...new Set(missing)]).toEqual([]);
  });
});

describe('posts', () => {
  it.each(published.map((post) => post.slug))('/posts/%s/ is built', (slug) => {
    expect(exists(`/posts/${slug}/`)).toBe(true);
  });

  it('has a page for every published post and no others', () => {
    const built = urls.filter((url) => /^\/posts\/[^/]+\/$/.test(url)).map((url) => url.split('/')[2]);
    expect(built.sort()).toEqual(published.map((post) => post.slug).sort());
  });

  it('never builds drafts', () => {
    // There must be drafts in the content for this test to mean anything
    expect(drafts.length).toBeGreaterThan(0);
    const leaks = drafts.flatMap((draft) => {
      const found = distFiles()
        .filter((file) => /\.(html|xml|json)$/.test(file))
        .filter((file) => readDist(file).includes(`/posts/${draft.slug}/`));
      return [...(exists(`/posts/${draft.slug}/`) ? [`/posts/${draft.slug}/ was built`] : []), ...found.map((file) => `${file} links to ${draft.slug}`)];
    });
    expect(leaks).toEqual([]);
  });
});

describe('journal pages', () => {
  const totalPages = Math.ceil(published.length / POSTS_PER_PAGE);
  const journalUrl = (n: number) => (n === 1 ? '/' : `/page${n}/`);

  it(`splits ${published.length} posts into ${totalPages} pages`, () => {
    for (let n = 2; n <= totalPages; n += 1) expect(exists(journalUrl(n)), journalUrl(n)).toBe(true);
    expect(exists(journalUrl(totalPages + 1))).toBe(false);
    expect(exists('/page1/')).toBe(false);
  });

  it('shows every published post once across the pages', () => {
    const linked = Array.from({ length: totalPages }, (_, i) => page(journalUrl(i + 1)))
      .flatMap((doc) => doc.querySelectorAll('main article h2 a, main article h3 a').map((a) => a.getAttribute('href')));
    expect(linked.sort()).toEqual(published.map((post) => `/posts/${post.slug}/`).sort());
  });

  it('links each page to the one before and after', () => {
    for (let n = 1; n <= totalPages; n += 1) {
      const doc = page(journalUrl(n));
      const prev = doc.querySelector('.pagination a[rel="prev"]')?.getAttribute('href');
      const next = doc.querySelector('.pagination a[rel="next"]')?.getAttribute('href');
      expect(prev, `newer link on page ${n}`).toBe(n > 1 ? journalUrl(n - 1) : undefined);
      expect(next, `older link on page ${n}`).toBe(n < totalPages ? journalUrl(n + 1) : undefined);
    }
  });
});

describe('feed.xml', () => {
  const feed = xml.parse(readDist('/feed.xml'));
  const items = asArray(feed.rss.channel.item);

  it('is an RSS 2.0 feed', () => {
    expect(feed.rss['@_version']).toBe('2.0');
    expect(feed.rss.channel.title).toBeTruthy();
    expect(feed.rss.channel.language).toBe('en');
  });

  it('has one item per published post', () => {
    expect(items).toHaveLength(published.length);
  });

  it('uses absolute links to posts that exist', () => {
    for (const item of items) {
      expect(item.link.startsWith(`${SITE}/posts/`), item.link).toBe(true);
      expect(exists(new URL(item.link).pathname), item.link).toBe(true);
    }
  });

  it('gives every item a title, a date and a description', () => {
    for (const item of items) {
      expect(item.title).toBeTruthy();
      expect(Number.isNaN(Date.parse(item.pubDate))).toBe(false);
      expect(String(item.description ?? '').trim()).toBeTruthy();
    }
  });
});

describe('search.json', () => {
  const index = JSON.parse(readDist('/search.json'));

  it('has one entry per published post', () => {
    expect(index.map((entry: { url: string }) => entry.url).sort()).toEqual(published.map((post) => `/posts/${post.slug}/`).sort());
  });

  it('has the fields the search box uses', () => {
    for (const entry of index) {
      expect(entry).toEqual({
        title: expect.any(String),
        url: expect.any(String),
        category: expect.any(String),
        tags: expect.any(String),
        snippet: expect.any(String),
        content: expect.any(String),
      });
      expect(entry.title).not.toBe('');
    }
  });

  it('holds plain text, not Markdown or HTML', () => {
    for (const entry of index) expect(entry.content, entry.url).not.toMatch(/<\/?[a-z][^>]*>|!\[|\]\(/i);
  });
});

describe('sitemap', () => {
  const sitemapIndex = xml.parse(readDist('/sitemap-index.xml'));
  const sitemaps = asArray(sitemapIndex.sitemapindex.sitemap).map((entry: { loc: string }) => new URL(entry.loc).pathname);
  const locs = sitemaps.flatMap((path) =>
    asArray(xml.parse(readDist(path)).urlset.url).map((entry: { loc: string }) => entry.loc),
  );

  it('points to sitemaps that exist', () => {
    for (const path of sitemaps) expect(exists(path), path).toBe(true);
  });

  it('lists every published post', () => {
    for (const post of published) expect(locs).toContain(`${SITE}/posts/${post.slug}/`);
  });

  it('only lists pages that exist', () => {
    for (const loc of locs) expect(exists(new URL(loc).pathname), loc).toBe(true);
  });
});

it('robots.txt points to the sitemap', () => {
  expect(readDist('/robots.txt')).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});
