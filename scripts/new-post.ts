// Starts a new draft post with its frontmatter filled in.
//
//   yarn new-post "My title" --category Music --tags "Clarinet, Jazz"
//   yarn new-post            (asks for each part)
//
// Run `yarn new-post --help` for every option.
import { relative } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { createPost, existingCategories, parseTags, type NewPost } from './post-template.ts';

const HELP = `Usage: yarn new-post [title] [options]

Creates src/content/posts/YYYY-MM-DD-<title>.md as a draft. Anything left out is asked for.

Options:
  -c, --category <name>      Category, e.g. Music
  -t, --tags <list>          Comma-separated tags, e.g. "Nix, Linux"
  -d, --description <text>   Summary used in lists and the feed (optional)
  -i, --image <file>         Cover image inside src/assets/images, e.g. clarinet.jpg
      --alt <text>           Alt text for the cover image
      --date <YYYY-MM-DD>    Publish date, defaults to today
      --publish              Leave out draft: true
  -h, --help                 Show this help`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    category: { type: 'string', short: 'c' },
    tags: { type: 'string', short: 't' },
    description: { type: 'string', short: 'd' },
    image: { type: 'string', short: 'i' },
    alt: { type: 'string' },
    date: { type: 'string' },
    publish: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  // The round trip catches dates that do not exist, like 2026-02-30
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error(`--date must look like 2026-11-06, not "${value}"`);
  return date;
}

async function main() {
  let title = positionals.join(' ').trim();
  let { category, tags, description, image, alt } = values;

  // Ask for what is missing, but only when someone is at the keyboard. The rest is optional.
  const missing = !title || !category;
  if (missing && !process.stdin.isTTY) throw new Error(`A title and --category are needed when not run in a terminal\n\n${HELP}`);

  if (missing) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (question: string) => (await rl.question(question)).trim();
    try {
      while (!title) title = await ask('Title: ');
      if (!category) {
        const known = existingCategories();
        console.log(`Categories so far: ${known.join(', ')}`);
        while (!category) {
          const answer = await ask('Category: ');
          // Reuse the existing spelling, so "music" does not start a second Music
          category = known.find((c) => c.toLowerCase() === answer.toLowerCase()) ?? answer;
        }
      }
      if (tags === undefined) tags = await ask('Tags, separated by commas (optional): ');
      if (description === undefined) description = await ask('Description (optional): ');
      if (image === undefined) image = await ask('Cover image in src/assets/images (optional): ');
      if (image && alt === undefined) alt = await ask('Alt text for the image: ');
    } finally {
      rl.close();
    }
  }

  const post: NewPost = {
    title,
    category: category!,
    tags: parseTags(tags ?? ''),
    description,
    image: image || undefined,
    imageAlt: alt,
    date: parseDate(values.date),
    draft: !values.publish,
  };

  const path = createPost(post);
  console.log(`\nCreated ${relative(process.cwd(), path)}`);
  if (post.draft ?? true) console.log('It is a draft: it shows in `yarn dev` but is not published until you remove draft: true.');
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
