import type { ImageMetadata } from 'astro';
import { buildSections } from './gallery';

// The real galleries, from src/assets/gallery. Kept apart from gallery.ts so its tests do not load every image.
const files = import.meta.glob<ImageMetadata>('../assets/gallery/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
  eager: true,
  import: 'default',
});
const configs = import.meta.glob('../assets/gallery/*/section.json', { eager: true, import: 'default' });

export const getGalleries = () => buildSections(files, configs);
