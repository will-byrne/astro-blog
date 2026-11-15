import { readFile } from 'node:fs/promises';
import type { APIRoute, GetStaticPaths } from 'astro';
import avatar from '../../../assets/images/avatar.jpg';
import { renderSocialCard } from '../../../lib/social-card';
import { SITE_TITLE, formatDate, getPosts, getReadingTime, getSeries, type Post } from '../../../lib/posts';

// The image shown when a post is shared, at /posts/<id>/card.png. See src/lib/social-card.ts.
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post, posts } }));
}) satisfies GetStaticPaths;

// Astro keeps where an imported image came from in fsPath. It is not a public property, so if it ever goes
// away the card falls back to the avatar rather than failing the build.
const fileOf = (image: ImageMetadata) => (image as ImageMetadata & { fsPath?: string }).fsPath;

export const GET: APIRoute = async ({ props, site }) => {
  const { post, posts } = props as { post: Post; posts: Post[] };
  const series = getSeries(post, posts);
  const coverFile = post.data.image && fileOf(post.data.image.url);
  const png = await renderSocialCard({
    title: post.data.title,
    details: [formatDate(post.data.pubDate), `${getReadingTime(post)} min read`, post.data.category].join(' · '),
    series: series && `Part ${series.index + 1} of ${series.posts.length} in ${series.name}`,
    image: coverFile ? await readFile(coverFile) : undefined,
    avatar: await readFile(fileOf(avatar)!),
    site: SITE_TITLE,
    domain: site?.host ?? '',
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
