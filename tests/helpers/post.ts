import type { Post } from '../../src/lib/posts';

let count = 0;

type PostOverrides = Partial<Omit<Post['data'], 'pubDate'>> & {
  id?: string;
  body?: string;
  pubDate?: Date | string;
};

// A fake post for unit tests, so they never depend on the real content
export function makePost({ id, body = '', pubDate = '2024-01-01T00:00:00Z', ...data }: PostOverrides = {}): Post {
  count += 1;
  return {
    id: id ?? `post-${count}`,
    collection: 'posts',
    body,
    data: {
      title: `Post ${count}`,
      author: 'Will Byrne',
      category: 'Tech',
      tags: [],
      draft: false,
      ...data,
      pubDate: new Date(pubDate),
    },
  } as Post;
}
