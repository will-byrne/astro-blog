import { getImage } from "astro:assets";
import { formatDate, getExcerpt, getPosts, getReadingTime, postUrl } from "../lib/posts";

// The cards shown when hovering a link to another post, keyed by the post's URL. Fetched on the first hover.
export async function GET() {
  const posts = await getPosts();
  const entries = await Promise.all(
    posts.map(async (post) => [
      postUrl(post),
      {
        title: post.data.title,
        date: formatDate(post.data.pubDate),
        readingTime: getReadingTime(post),
        series: post.data.series,
        excerpt: getExcerpt(post, 160),
        image: post.data.image ? (await getImage({ src: post.data.image.url, width: 480, format: "webp" })).src : undefined,
      },
    ]),
  );
  return new Response(JSON.stringify(Object.fromEntries(entries)), { headers: { "Content-Type": "application/json" } });
}
