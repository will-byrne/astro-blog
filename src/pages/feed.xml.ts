import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getExcerpt, getPosts, SITE_DESCRIPTION, SITE_TITLE } from "../lib/posts";

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Set in astro.config.mjs
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: getExcerpt(post),
      link: `/posts/${post.id}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: `<language>en</language>`,
  });
};
