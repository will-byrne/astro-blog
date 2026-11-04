import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

export const POSTS_DIR = resolve('src/content/posts');

export interface SourcePost {
  file: string;
  slug: string;
  hasFrontmatter: boolean;
  data: Record<string, any>;
  /** The body with code removed, as code shows example Markdown that is not a real image or link */
  prose: string;
}

// Reads the real posts straight from disk, without Astro
export function readPosts(): SourcePost[] {
  return readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(join(POSTS_DIR, file), 'utf8');
      const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      const body = match ? match[2] : source;
      return {
        file,
        // Matches generateId in src/content.config.ts
        slug: file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''),
        hasFrontmatter: Boolean(match),
        data: match ? (parse(match[1]) ?? {}) : {},
        prose: body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, ''),
      };
    });
}
