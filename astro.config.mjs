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
      // All four flavours are written as CSS variables; the stylesheet picks the one in use
      themes: {
        latte: 'catppuccin-latte',
        frappe: 'catppuccin-frappe',
        macchiato: 'catppuccin-macchiato',
        mocha: 'catppuccin-mocha',
      },
      defaultColor: false,
    },
    rehypePlugins: [rehypeHeadingIds, rehypeProse],
  },
});
