---
title: From Jekyll to Astro
pubDate: 2026-11-01
author: Will Byrne
category: Blog
tags:
  - Infrastructure
  - Astro
  - Catppuccin
  - AI
image:
  url: ../../assets/images/blog_screenshot.png
  alt: A screenshot of the blog
---

This blog has moved home again. When [the Ghost died](/posts/ghost_is_dead/) I moved to `Jekyll` with the `Chirpy` theme because I am definitely no designer, and that setup has served me well. It has now been replaced with a static site built with [Astro](https://astro.build/) and a design of its own.

## Why Astro
I had already used `Astro` for the static site in my [playground repo](/posts/digital-playground/) and had started a basic version of this blog by following their tutorial. The premise is the same as `Jekyll`: I write my posts in `markdown` and it generates static pages. The difference is that the rest of the site is now built with `TypeScript` and components, which is much closer to what I work with day to day than `Ruby` gems and `Liquid` templates.

## Using AI
Most of this migration was done using [Claude Code](https://claude.com/claude-code). After my [experiments with AI and TDD](/posts/ai-tdd/) I wanted to see how it would cope with something larger than a single file. I gave it the direction and made the design decisions, and it did most of the implementation and checked its work with browser tests and screenshots. I still had to correct it along the way, some of which you will see below.

## Moving the Content
The posts themselves needed less work than I expected as they were already in `markdown`. The frontmatter needed tidying, as I had been inconsistent with things like `category` and `categories`, and a few bits of `Jekyll` specific syntax needed replacing.

The important part was keeping all of the existing URLs working. `Astro` would normally lowercase my file names, which would have broken links like `/posts/Astrophotography/`, so the post IDs are generated from the file names as they are. Every URL in the old sitemap was checked against the new build.

There was one trap I would not have thought of. `Chirpy` installs a service worker, so returning visitors could have kept seeing cached pages from the old site. The new site has a replacement at the same URL that clears those caches and then removes itself.

## The Design
The first version was an almost exact copy of `Chirpy`, reusing the compiled `CSS` from the old site. It was very close to the original and I decided that I didn't actually want it. What I wanted was something sleek for journaling about tech, music and life, using the [Catppuccin](https://catppuccin.com/) Macchiato colours that I have liked since I [changed the site colours](/posts/site-colours/). In that post I said that writing my own theme would probably remain my ultimate goal, and I have finally got there, with some help.

The first draft of the redesign used a serif font and gave each category its own colour. I rejected both. Serif fonts are a problem for me as someone with dyslexia, and my categories will grow over time so tying colours to them would not last. The site now uses [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) throughout, with left-aligned text, generous spacing and no all-caps labels.

The colour now comes from a position in a list and not from what an item is, so a new category or tag needs no extra work. The result is a simple journal with a timeline of posts, a stripe of the palette across the top of the page and different colours for each level of heading. It was also built for mobile first and tested on screens as narrow as 320px.

## Images
The old site served every image at full size to every device. I now use `astro:assets`, which generates several sizes of each image and lets the browser pick the right one. I compared the old and new sites by scrolling through each page at phone size, and the difference is huge:

| Page | Old images | New images | Old total | New total |
|---|---|---|---|---|
| Home | 3.38 MB | 0.40 MB | 4.44 MB | 0.47 MB |
| Gallery | 6.56 MB | 0.43 MB | 7.59 MB | 0.49 MB |
| ComfyUI post | 12.51 MB | 1.64 MB | 13.63 MB | 1.74 MB |
| Astrophotography post | 1.67 MB | 0.30 MB | 2.79 MB | 0.40 MB |

The totals include things like the `CSS`, `JavaScript` and fonts, before any compression. Dropping `Chirpy` and its dependencies accounts for about another 1 MB on each page.

Even the animated images kept all of their frames and came out at less than half their original size.

## Drafts
This one is built in to how `Astro` content collections work, with a small filter. Posts marked as drafts show up when I run the site locally but never make it into the production build:

```ts
getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
```

## Resume
My resume used to be a link to a `PDF`. It is now a full page generated from the same `JSON Resume` file that I keep in its own repo. That repo is private, but it already copies the file to a public gist every time I push, so the site fetches it from there at build time. The personal parts like my interests now live on the [about page](/about/) and the [resume](/resume/) sticks to work. When I change my resume I just trigger a new build.

## Hosting
The site is still on `GitHub Pages`, but it is now built with a `GitHub Actions` workflow from a new repo. Switching over was mostly a case of moving the custom domain from the old repo to the new one.

## Conclusion
I am really happy with how this has turned out. The site downloads far less on a phone, is easier for me to read and is something that I can actually change without having to dig through someone else's theme. The AI was a big help, but it worked best when I had a clear idea of what I wanted and told it when it was wrong. I don't think that I would have ended up with something I like this much if I had just accepted the first thing that it generated.
