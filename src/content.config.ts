import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './src/content/posts',
    // Keep the filename's case and underscores, as they are part of the published URLs
    generateId: ({ entry }) => entry.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''),
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    description: z.string().optional(),
    author: z.string().default('Will Byrne'),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.object({ url: image(), alt: z.string().default('') }).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
