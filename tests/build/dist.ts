import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';

export const DIST = resolve('dist');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

export const distFiles = () => walk(DIST).map((path) => `/${relative(DIST, path).split('\\').join('/')}`);

// Every built page as its URL, e.g. /posts/nix/ or /404.html
export const pageUrls = () =>
  distFiles()
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.replace(/index\.html$/, ''));

export const readDist = (file: string) => readFileSync(join(DIST, file), 'utf8');

const pages = new Map<string, HTMLElement>();
export function page(url: string): HTMLElement {
  if (!pages.has(url)) pages.set(url, parse(readDist(url.endsWith('/') ? `${url}index.html` : url)));
  return pages.get(url)!;
}

// Whether a site-relative URL is served by something in dist/
export function exists(url: string): boolean {
  const path = decodeURIComponent(url.split(/[?#]/)[0]);
  const file = join(DIST, path);
  if (path.endsWith('/')) return existsSync(join(file, 'index.html'));
  return existsSync(file) && statSync(file).isFile();
}
