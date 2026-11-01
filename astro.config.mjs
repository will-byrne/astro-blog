// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeProse from './src/lib/rehype-prose.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://willbyrne.dev',
  integrations: [sitemap()],
  image: {
    // Gives images in Markdown a set of sizes for the browser to choose from
    layout: 'constrained',
    responsiveStyles: false,
  },
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-macchiato',
    },
    rehypePlugins: [rehypeHeadingIds, rehypeProse],
  },
});
