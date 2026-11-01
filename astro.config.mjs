// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeChirpy from './src/lib/rehype-chirpy.mjs';
import shikiTheme from './src/lib/shiki-theme.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://willbyrne.dev',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: shikiTheme,
    },
    rehypePlugins: [rehypeHeadingIds, rehypeChirpy],
  },
});
