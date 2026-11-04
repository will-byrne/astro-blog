import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { readFile } from 'node:fs/promises';

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

// The resume repo copies resume.json to this public gist on every push
const RESUME_URL = 'https://gist.githubusercontent.com/will-byrne/b6c82ed9d60d9e11dda925d9bc924628/raw/resume.json';

// RESUME_FILE points at a local copy instead, so tests and CI do not depend on the network
async function loadResume() {
  if (process.env.RESUME_FILE) return JSON.parse(await readFile(process.env.RESUME_FILE, 'utf8'));
  const response = await fetch(RESUME_URL);
  if (!response.ok) throw new Error(`Could not fetch resume: ${response.status} ${response.statusText}`);
  return response.json();
}

const resume = defineCollection({
  loader: async () => [{ id: 'resume', ...(await loadResume()) }],
  schema: z.object({
    basics: z.object({
      name: z.string(),
      label: z.string(),
      summary: z.string(),
      location: z.object({ address: z.string().optional(), countryCode: z.string().optional() }).optional(),
      profiles: z.array(z.object({ network: z.string(), url: z.string() })).default([]),
    }),
    work: z.array(z.object({
      name: z.string(),
      position: z.string(),
      url: z.string().optional(),
      image: z.string().optional(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      summary: z.string().optional(),
      highlights: z.array(z.string()).default([]),
      keywords: z.array(z.string()).default([]),
    })),
    volunteer: z.array(z.object({
      organization: z.string(),
      position: z.string(),
      url: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      summary: z.string().optional(),
    })).default([]),
    education: z.array(z.object({
      institution: z.string(),
      area: z.string(),
      studyType: z.string(),
      score: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
    })).default([]),
    skills: z.array(z.object({ name: z.string(), level: z.string(), keywords: z.array(z.string()) })).default([]),
    languages: z.array(z.object({ language: z.string(), fluency: z.string() })).default([]),
    interests: z.array(z.object({ name: z.string() })).default([]),
  }),
});

export const collections = { posts, resume };
