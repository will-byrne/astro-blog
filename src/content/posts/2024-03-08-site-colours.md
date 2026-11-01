---
title: Site Colours
pubDate: 2024-03-08 15:09 +0000
updated: "2024-05-22T17:30:55+01:00"
author: Will Byrne
category: Blog
tags:
  - Blog
  - Style
  - Jekyll
  - Catppuccin
image:
  url: ../../assets/images/img/catppuccin_rainbow.jpeg
  alt: Minimalist Catppuccin Rainbow
---

While I like the layout of the site, I have never been happy with the colour scheme. There is nothing wrong with it, it is just not to my preference. The theme comes with both light and dark variants and I had my site locked to the dark one.

## Status Quo
The current site used to use the default [Chirpy Theme](https://chirpy.cotes.page/) ([GitHub](https://github.com/cotes2020/jekyll-theme-chirpy)). This also uses the Rouge Gruvbox theme for code syntax highlighting.

## Options
There were three major approaches to change the appearance for the site. Replacing the theme, writing my own, or customising the existing one.

### Replacing the Theme
This option should theoretically be fairly easy and while I found a [nice one](https://hynduf.github.io/) ([GitHub](https://github.com/HynDuf/hynduf.github.io)) that uses a colour scheme I like, it would require changes to the CI and deployment which I am trying to avoid. There are some other themes that are available but many have the same issues and none of the ones that I have found use colour schemes that I favour.

### Write My Own Theme
This was my preferred option but probably the most effort. I looked into it and decided that it would be fun to make my own theme from scratch using [Tailwind](https://tailwindcss.com/). I started work on a new [Jekyll](https://jekyllrb.com/) site in a new git repo and incorporated Tailwind. What I hadn't considered was how much work had gone into making the theme that I was currently using and after spending several hours coding a new site I only had the basic layout and colours. This will probably remain my ultimate goal but for now I think that I shall put this to one side for a faster solution, this will also give me time to actually design my site rather than winging it.

### Customise Existing Theme
To customise the existing theme all I needed to do was to copy / replace the files from the theme into the same place in my site repo and then changes I made there would be pulled into the theme when it builds. This meant quick changes to the styles were possible and I didn't need to mess around with layouts.

### Decision
I decided to, as previously mentioned shelve the new theme and alter the existing one.

## Customising The Existing Theme
The main change that I wanted to make was to chang the colours, there were some other minor behaviour changes that I applied to hover states and the like while I was altering the code.

### Catppuccin
[Catppuccin](https://catppuccin-website.vercel.app/) ([GitHub](https://github.com/catppuccin/catppuccin)) is a wonderful coffee / cat inspired theme that I find very easy to read. Being colour blind these dark themes often give me issues but this one has been made very well and I don't struggle as much with low contrast (to me) colour differences. I use this scheme on my PC for almost everything and on their [GitHub repo](https://github.com/catppuccin/catppuccin) they have ports from everything from terminal emulators, to games, to IDEs, and many more.


<div class="image-small">

![Catppuccin logo](../../assets/images/img/macchiato_squircle.jpeg)

</div>

#### Variants
There are four main variants of the theme: Latte (the light theme), Frappe, Macchiato, and Mocha. I use the Mocha variant on my arch system and plan to eventually incorporate a switcher into my site to allow switching between the four variants (possibly with the appropriate coffee cups as icons).

## Altering The SASS
Altering the was not as simple as I first thought, the colours were in a few different places and some of the names were not obvious to me, not that they were badly named we all intuit things differently. I spent a good few hours changing the colours one at a time and then pretty much going back to the start and doing them differently, this went on for a while before I settled with what I have now. I like the look at the moment and will keep it like this for now.

### Issues
#### Class Names
I mentioned the issue with me struggling to understand the class names, this wasn't a big problem it just meant more back and forth changing the SASS and then seeing what was affected on the site.

#### Missing Variables
Some of the colours were hardcoded into the SASS itself and did not use css variables so some of them I had to add custom sass files that I didn't intend to change.

#### Libraries
There are some colours that I spent a long time tracking down only to discover that they were coming from an external library (in this case [Bootstrap](https://getbootstrap.com/)), this has meant that some of the colours in my site have the `!important` flag which I don't like but did not want to spend time removing the library.

### Rouge
Jekyll used [Kramdown](https://kramdown.gettalong.org/) to convert its `markdown` to `html` and Kramdown uses [Rouge](https://rouge.jneen.net/) to handle the syntax highlighting of both block and inline code blocks. There are some themes that can be used simply but none of those matched the Catppuccin theme that I was now using. This meant that I had to generate a stylesheet using the `Rougify` gem and alter it to match the new style. The only problem with this is the classnames it uses were not very clear on what they were for, so it took a lot of googling to find a [page](https://github.com/rouge-ruby/rouge/blob/master/lib/rouge/token.rb#L75) that had a better explanation.

Here is a snippet of code to show what I mean:
```scss
.highlight .k, .highlight .kd, .highlight .kv {
  color: rgb(203, 166, 247);
  font-weight: bold;
}
.highlight .o, .highlight .ow {
  color: rgb(137, 220, 235);
  font-weight: bold;
}
.highlight .p, .highlight .pi {
  color: rgb(205, 214, 244);
}
```

## Future Work
The next steps I have planned for my site are:
- Clean up the SASS
- Introduce all the necessary variables
- Add the other colour palettes
- Code a switch to allow changing colour palette
