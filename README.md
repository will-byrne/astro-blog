# willbyrne.dev

My personal blog, built with [Astro](https://astro.build) and hosted on GitHub Pages at [willbyrne.dev](https://willbyrne.dev).

## Getting started

You need Node 24 and Yarn. If you use Nix, `direnv allow` (or `nix develop`) gives you both, plus the browsers Playwright needs.

```sh
yarn install
yarn dev
```

The dev server runs at `localhost:4321`.

## Commands

| Command              | What it does                                        |
| :------------------- | :-------------------------------------------------- |
| `yarn dev`           | Start the dev server                                |
| `yarn build`         | Build the site into `dist/`                         |
| `yarn preview`       | Serve the built site locally                        |
| `yarn new-post`      | Start a new draft post (see below)                  |
| `yarn update-resume` | Refresh the stored copy of the resume               |
| `yarn typecheck`     | Run `astro check`                                   |
| `yarn test`          | Run the unit, content and build tests (Vitest)      |
| `yarn test:watch`    | Run the unit tests in watch mode                    |
| `yarn test:e2e`      | Run the browser tests (Playwright, with axe checks) |
| `yarn test:all`      | Typecheck, then run every test                      |

## Writing a post

```sh
yarn new-post "My title" --category Music --tags "Clarinet, Jazz"
yarn new-post            # asks for each part
yarn new-post --help     # every option
```

This makes `src/content/posts/YYYY-MM-DD-<title>.md` with `draft: true`. Remove the `draft` line (or pass `--publish`) when it is ready.

The date at the start of the filename is dropped from the URL, so `2024-06-19-nix.md` is published at `/posts/nix/`.

### Frontmatter

| Field         | Needed? | Notes                                                                 |
| :------------ | :------ | :-------------------------------------------------------------------- |
| `title`       | yes     |                                                                       |
| `pubDate`     | yes     |                                                                       |
| `category`    | yes     | Any name. A new one gets its own page automatically.                  |
| `tags`        | no      | A list of names                                                       |
| `description` | no      | Used in lists, the feed and share cards                               |
| `image`       | no      | `url` (a path into `src/assets/images`) and `alt`                     |
| `updated`     | no      | Date of the last real change                                          |
| `series`      | no      | Posts with the same series name are linked as parts, in date order    |
| `gallery`     | no      | A folder in `src/assets/gallery`. The post and gallery link each other |
| `draft`       | no      | Drafts show in `yarn dev` but are left out of the built site          |

## Galleries

Each folder in `src/assets/gallery` is one gallery. Drop images in the folder and describe them in its `section.json`:

```json
{
  "title": "AI art",
  "description": "Some of my AI art, mostly generated on my iPad.",
  "images": {
    "dragon.jpeg": { "alt": "A black and orange dragon surrounded by fire" }
  }
}
```

The astrophotography gallery also draws a sky map for each image, using the star data in `src/data/sky.json`.

## Resume

The resume page reads `resume.json` from a GitHub gist at build time. If the gist cannot be reached, the build uses the copy in `src/data/resume.json`. Run `yarn update-resume` to refresh that copy.

## What is in the site

- Posts, with categories, tags, series, related posts, backlinks and a table of contents
- Hover previews when you point at a link to another post
- Search, an archive, an RSS feed (`/feed.xml`) and a sitemap
- A share card image made for each post
- Themes: the four Catppuccin flavours and Pan. Code blocks follow the chosen theme
- Fonts picked to be easy to read: Atkinson Hyperlegible Next and Atkinson Hyperlegible Mono

### Easter eggs

- Unicorn mode: the Konami code (↑ ↑ ↓ ↓ ← → ← → B A), or press the unicorn in the footer
- Night vision: press `n`, or the moon in the footer
- A sparkle trail, switched on in the footer
- Something extra for Pride Month
- A hello in the browser console

All of these stay still for anyone who asks their device for reduced motion. The code is in `src/scripts/fun.js` and `src/styles/fun.css`.

## Project layout

```text
src/
├── content/posts/   Blog posts in Markdown
├── assets/images/   Post images
├── assets/gallery/  One folder per gallery
├── components/      Astro components
├── layouts/         Page layouts
├── lib/             Helpers (posts, galleries, resume, share cards, sky map)
├── pages/           Routes
├── scripts/         Browser scripts
├── styles/          Global and fun styles
└── data/            Resume fallback and sky data
scripts/             new-post and update-resume
tests/               unit, content, build and e2e tests
```

## Deploying

Every push to `main` runs the tests, then builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). Changes to only this README do not trigger a deploy.
