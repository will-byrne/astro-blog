---
title: iPad Shortcuts For Blogging
pubDate: '2024-05-21'
updated: "2024-06-03T10:38:37+01:00"
author: Will Byrne
category: iPad
tags:
  - iPad
  - Blog
  - Shortcuts
  - Infrastructure
image:
  url: ../../assets/images/shortcuts_screenshot.jpeg
  alt: Apple Shortcuts screenshot
---

As mentioned in my [Blogging from my iPad](/posts/Blogging-from-my-iPad/) I created a bunch of shortcuts in the provided iPad app based off the ones from [Marco Gomiero’s](https://www.marcogomiero.com/posts/2021/running-blog-ipad/) post. These shortcuts were a great place to start but were ultimately not quite sufficient for what I was wanting to do. Here is a log of my changes and what I ultimately ended up with.

## Duplication
### Problem
The pictures provided on several sites for making shortcuts related to blogging were a useful starting point but trying to implement them myself was problematic as a lot of the icons and workflows had changed just enough to make it time consuming to find and convert them.

### Solution
The only solution to this was to work through the available shortcut steps to find the closest ones that what I thought the picture was representing.

## Duplication
### Problem
As mentioned above the shortcuts were provided as pictures, this made it problematic to implement them as there was no “source code” as such. There are ways of sharing shortcuts now which will be mentioned below.

### Solution
There was no solution to the existing pictures however it is possible to share shortcuts via files or iCloud links so I will make my shortcuts available if any of my friends ask me for them.

## Image size
### Problem
The main shortcut I was using was to add images to the blog from the photos app on my iPad. This shortcut made no changes to the image and there was no way to make sure that it was web optimised. Having added a bunch of photos for my [iPad AI](/posts/ipad_ai/) post I realised that many of the images were way too large to be web safe, many of them being between 10-40MB. 

### Solution
Shortcuts really surprised me here, there is an option to in the shortcut for media to alter the size of the image. Combined with an `if else` block to only resize images that are wider than 1200 (with an auto height to maintain aspect ration) it now works like a charm.

## Image Format
### Problem
For web, especially for decoration images, there is no need to use the more detailed and precise formats like PNG, however most of my AI art pictures are output in PNG format. Ideally I would like all of the pictures on the blog to be jpegs.

### Solution
The same as the resize option, there is a shortcut to change the format of an image to a few different common formats, jpeg being one of them made this an easy change to make.

## Current Shortcuts
### Add Image to Blog
This shortcut has the workflow:
1. Asks for `Image Name` for the alt text.
2. Sets the input to a variable called `ImageName`.
3. Asks for `Image Path` for the file name.
4. Sets the input to a variable called `ImagePath`.
5. Select Photo from the photo picker.
6. Convert image to jpeg.
7. Check to see if image is wider than `1200px`.
- If yes, resize to `1200px` wide while maintaining aspect ratio.
- Sets the original or resized image to a variable called `Photo`. 
8. Set the file extension of the image (jpeg) to a variable called `FileExtension`.
9. Write the photo (using a Working Copy shortcut) to the blog repo with the path `assets/${FileName}.${FileExtension}`.
10. Set a text variable to `![${ImageName](/assets/${ImagePath}.${FileExtension})`.
11. Add the text variable to the clipboard. 

### Add Banner to Blog
This is a duplicate of the previous shortcut just with different text at the end to account for it being in the front-matter rather than in the markdown.

### New Blog Post
This shortcut has the workflow:
1. Checkout the main branch of the blog repo using Working Copy.
2. Set the current date to a variable called `CurrentDate` in the format required by the front-matter.
3. Asks for `File Name`.
4. Sets the input to a variable called `FileName`.
5. Asks for `Article Titles`.
6. Sets the input to a variable called `ArticleTitle`.
7. Asks for `Article Tags`.
8. Sets the input to a variable called `ArticleTags`.
9. Asks for the `ArticleCategories`.
10. Sets the input to a variable called `ArticleCategories`.
11. Creates a text variable with the text:
```yaml
---
layout: post
title: ${ArticleTitle}
date: ${CurrentDate}
tags: [${ArticleTags}]
categories: [${ArticleCategories}]
---
```
12. Add the text variable to the clipboard.

## Future Changes
These shortcuts are very much a work in progress and I currently plan to make the following changes:
- [x] Collapse the images into a single shortcut with a choice of adding it as a banner or content image.
- [x] Make it so the image shortcut can be used for the share menu on an image and if not only then open the photo picker.
- [x] When adding a new blog post it is only currently using the date and not the time so I want to change this and output the time in case I post more than once in a day.
- [ ] ~~The categories can be `0-2` entries and rather than enter a string and add the separators manually while typing should use some form of list entry.~~
- [ ] ~~DSimilarly there can be `0-n` tags on an article so this needs the same treatment.~~
- [x] Both the tags and categories should not be in the output if nothing is added, this will almost certainly never be the case it should still be handled.
- [x] Add the option to pick a banner image when creating a new blog entry.
- [x] Add a draft post
- [x] Publish a draft post
 
> Note:
The two for list entries have been abandoned as that is very awkward to do in shortcuts so I will continue to just take an input and remember to format it correctly.

## Conclusion
Shortcuts are awesome, I like the automation and look forward to seeing what else I can do with them in the future, maybe one to notify me when a build and deploy has succeeded or failed on the github actions for the blog. There are probably a lot of silly things that can be done with the Phillips Hue lights. 