// Keeps the tag and category URLs from the old Jekyll site, e.g. "D&D" -> "d-d".
// Kept free of Astro imports so the new-post script can use it too.
export function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
