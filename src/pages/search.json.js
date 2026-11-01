import { getExcerpt, getPosts, plainText, postUrl } from "../lib/posts";

export async function GET() {
  const posts = await getPosts();
  const index = posts.map((post) => ({
    title: post.data.title,
    url: postUrl(post),
    category: post.data.category,
    tags: post.data.tags.join(", "),
    snippet: getExcerpt(post),
    content: plainText(post.body ?? ""),
  }));
  return new Response(JSON.stringify(index), { headers: { "Content-Type": "application/json" } });
}
