// Builds the galleries from the folders in src/assets/gallery.
//
// Each folder is a gallery with its own page at /gallery/<folder>/; /gallery/ lists them all. Images used only in posts live in src/assets/images instead,
// so nothing appears in the gallery unless it is put here on purpose.
//
// A folder may hold a section.json, where every field is optional:
//   {
//     "title": "Learning to draw",      // defaults to the folder name, e.g. "my_drawings" -> "My drawings"
//     "description": "Shown under the heading",
//     "order": 2,                        // lower comes first; sections without one go last, by title
//     "newestFirst": true,               // for dated files, e.g. 2026-11-06-first-sketch.jpg
//     "cover": "2026-11-06-hands.jpg"    // the image on the /gallery/ card; defaults to the newest
//   }
// A file named YYYY-MM-DD-name.ext shows its date and sorts by it.
import { z } from 'astro/zod';
import type { ImageMetadata } from 'astro';
import { slugify } from './slugify';

export const sectionSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    newestFirst: z.boolean().default(false),
    cover: z.string().min(1).optional(),
  })
  // A misspelt field fails the build instead of being ignored
  .strict();

export type SectionConfig = z.infer<typeof sectionSchema>;

export interface GalleryImage {
  src: ImageMetadata;
  alt: string;
  /** From a YYYY-MM-DD- prefix on the file name */
  date?: Date;
  file: string;
}

export interface GallerySection {
  /** From the folder name; the gallery's URL is /gallery/<id>/ */
  id: string;
  title: string;
  description?: string;
  order?: number;
  /** Shown on the /gallery/ card */
  cover: GalleryImage;
  images: GalleryImage[];
}

/** Newest dated image first, otherwise the first in the gallery's own order */
function newest(images: GalleryImage[]): GalleryImage[] {
  const dated = images.filter((image) => image.date).sort((a, b) => b.date!.getTime() - a.date!.getTime());
  return [...dated, ...images.filter((image) => !image.date)];
}

/** A few images other than the cover, newest first, for the thumbnails on a /gallery/ card */
export const previewImages = (section: GallerySection, count = 4) =>
  newest(section.images)
    .filter((image) => image !== section.cover)
    .slice(0, count);

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})[-_ ]?/;

/** "glass_nebula_fox" -> "Glass nebula fox" */
export function humanise(name: string): string {
  const words = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Alt text and date from a file name like 2026-11-06-first_sketch.jpg */
export function describeFile(file: string): { alt: string; date?: Date } {
  const name = file.replace(/\.[^.]+$/, '');
  const match = name.match(DATE_PREFIX);
  const date = match ? new Date(`${match[1]}T00:00:00Z`) : undefined;
  const valid = date && !Number.isNaN(date.getTime()) && date.toISOString().startsWith(match![1]);
  const rest = valid ? name.slice(match![0].length) : name;
  return { alt: humanise(rest || name), date: valid ? date : undefined };
}

/** Splits a glob path like ../assets/gallery/ai/dragon.jpeg into its folder and file name */
function locate(path: string, root: string): { folder: string; file: string } | undefined {
  const index = path.indexOf(root);
  if (index === -1) return undefined;
  const parts = path.slice(index + root.length).split('/').filter(Boolean);
  // Only images directly inside a section folder count
  return parts.length === 2 ? { folder: parts[0], file: parts[1] } : undefined;
}

export function buildSections(
  images: Record<string, ImageMetadata>,
  configs: Record<string, unknown> = {},
  root = '/gallery/',
): GallerySection[] {
  const folders = new Map<string, GalleryImage[]>();
  for (const [path, src] of Object.entries(images)) {
    const place = locate(path, root);
    if (!place) continue;
    folders.set(place.folder, [...(folders.get(place.folder) ?? []), { src, file: place.file, ...describeFile(place.file) }]);
  }

  const settings = new Map<string, SectionConfig>();
  for (const [path, raw] of Object.entries(configs)) {
    const place = locate(path, root);
    if (!place) continue;
    const parsed = sectionSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`${place.folder}/section.json: ${parsed.error.issues.map((i) => `${i.path.join('.') || 'file'}: ${i.message}`).join('; ')}`);
    settings.set(place.folder, parsed.data);
  }

  const sections = [...folders].map(([folder, list]): GallerySection => {
    const config = settings.get(folder) ?? sectionSchema.parse({});
    const direction = config.newestFirst ? -1 : 1;
    const sorted = [...list].sort((a, b) => {
      // Dated images go in date order, then anything undated by name
      if (a.date && b.date && a.date.getTime() !== b.date.getTime()) return (a.date.getTime() - b.date.getTime()) * direction;
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return a.file.localeCompare(b.file) * direction;
    });
    const cover = config.cover ? sorted.find((image) => image.file === config.cover) : newest(sorted)[0];
    if (!cover) throw new Error(`${folder}/section.json: cover: there is no image called ${config.cover} in this folder`);
    return {
      id: slugify(folder) || folder,
      title: config.title ?? humanise(folder),
      description: config.description,
      order: config.order,
      cover,
      images: sorted,
    };
  });

  return sections.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.title.localeCompare(b.title));
}
