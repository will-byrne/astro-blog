/**
 * Small page behaviours: search, image lightbox, copy and share buttons, back to top
 */

// Search
const searchDialog = document.getElementById('search');
const searchInput = document.getElementById('search-input');
const searchStatus = document.getElementById('search-status');
const searchResults = document.getElementById('search-results');
const SEARCH_LIMIT = 10;
let searchIndex;

function resultItem(item) {
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = item.url;
  const title = document.createElement('strong');
  title.textContent = item.title;
  const detail = document.createElement('span');
  detail.textContent = `${item.category} · ${item.snippet}`;
  link.append(title, detail);
  li.append(link);
  return li;
}

async function runSearch(query) {
  searchIndex ??= await fetch('/search.json').then((response) => response.json());
  // The index may arrive after the input has changed
  if (searchInput.value !== query) return;

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    searchStatus.textContent = '';
    searchResults.replaceChildren();
    return;
  }

  const matches = searchIndex
    .filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.tags} ${item.content}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, SEARCH_LIMIT);
  searchStatus.textContent = matches.length === 0 ? 'No posts found.' : '';
  searchResults.replaceChildren(...matches.map(resultItem));
}

const openSearch = () => {
  searchDialog.showModal();
  searchInput.select();
};

searchInput.addEventListener('input', () => runSearch(searchInput.value));
// In a search box, Escape would only clear the text, so it would take two presses to close
searchInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  searchDialog.close();
});
document.querySelectorAll('[data-search-open]').forEach((button) => button.addEventListener('click', openSearch));
document.querySelector('[data-search-close]').addEventListener('click', () => searchDialog.close());
searchDialog.addEventListener('click', (event) => {
  if (event.target === searchDialog) searchDialog.close();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
  // After a dialog closes, Chrome leaves focus on its hidden input until the next frame, so a / pressed
  // straight away comes from there. That is not typing, so it still opens the search.
  const typing = event.target.closest('input, textarea, select, [contenteditable]') && !event.target.closest('dialog:not([open])');
  if (typing || document.querySelector('dialog[open]')) return;
  event.preventDefault();
  openSearch();
});

// Image lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxDrawing = lightbox.querySelector('.lightbox-drawing');

// The page only downloads the size it needs, so fetch the largest one when an image is opened
function largestSource(img) {
  const candidates = img.srcset
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/))
    .filter(([url]) => url);
  if (candidates.length === 0) return img.currentSrc || img.src;
  return candidates.reduce((best, next) => (parseFloat(next[1]) > parseFloat(best[1]) ? next : best))[0];
}

function openLightbox(img) {
  lightboxImage.hidden = false;
  lightboxDrawing.hidden = true;
  lightboxImage.src = largestSource(img);
  lightboxImage.alt = img.alt;
  lightbox.showModal();
}

document.querySelectorAll('.prose img, [data-zoomable]').forEach((img) => {
  // Images inside links or buttons already do something when clicked
  if (img.closest('a, button')) return;
  img.setAttribute('data-zoomable', '');
  img.setAttribute('role', 'button');
  img.setAttribute('tabindex', '0');
  img.setAttribute('aria-label', img.alt ? `Enlarge image: ${img.alt}` : 'Enlarge image');
  img.addEventListener('click', () => openLightbox(img));
  img.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openLightbox(img);
  });
});

// Drawings made as SVG on the page, like the star maps, open as a copy so they keep the theme's colours
document.querySelectorAll('[data-zoomable-svg]').forEach((button) => {
  button.addEventListener('click', () => {
    lightboxImage.hidden = true;
    lightboxDrawing.replaceChildren(button.querySelector('svg').cloneNode(true));
    lightboxDrawing.hidden = false;
    lightbox.showModal();
  });
});

lightbox.addEventListener('click', () => lightbox.close());
lightbox.addEventListener('close', () => {
  lightboxImage.removeAttribute('src');
  lightboxDrawing.replaceChildren();
});

// Copy buttons on code blocks
document.addEventListener('click', async (event) => {
  const button = event.target.closest('.copy-button');
  if (!button) return;
  const code = button.closest('.code-block').querySelector('pre').textContent;
  try {
    await navigator.clipboard.writeText(code);
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Failed';
  }
  setTimeout(() => {
    button.textContent = 'Copy';
  }, 2000);
});

// Share a post: the device's share sheet where there is one, otherwise copy the link
const shareButton = document.getElementById('share');
shareButton?.addEventListener('click', async () => {
  const label = shareButton.querySelector('span');
  const url = window.location.href.split('#')[0];
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      label.textContent = 'Link copied';
      setTimeout(() => {
        label.textContent = 'Share';
      }, 2000);
    }
  } catch {
    // Cancelling the share sheet is not an error worth showing
  }
});

// Back to top
const backToTop = document.getElementById('back-to-top');
const updateBackToTop = () => {
  backToTop.hidden = window.scrollY < 800;
};
window.addEventListener('scroll', updateBackToTop, { passive: true });
updateBackToTop();
backToTop.addEventListener('click', () => window.scrollTo({ top: 0 }));

// Previews of other posts: hovering, or tabbing to, a link to another post in the text shows a card with its title,
// date, reading time and summary. The card only repeats what is behind the link, so screen readers skip it.
const POST_PATH = /^\/posts\/[^/]+\/?$/;
const previewLinks = [...document.querySelectorAll('.prose a[href]')].filter((link) => {
  const url = new URL(link.href, window.location.href);
  return url.origin === window.location.origin && POST_PATH.test(url.pathname) && url.pathname.replace(/\/?$/, '/') !== window.location.pathname;
});

if (previewLinks.length) {
  let previews;
  let showTimer;
  let current;
  const card = document.createElement('div');
  card.className = 'post-preview';
  card.setAttribute('aria-hidden', 'true');
  card.hidden = true;
  document.body.append(card);

  const pathOf = (link) => new URL(link.href, window.location.href).pathname.replace(/\/?$/, '/');

  function fill(preview) {
    card.replaceChildren();
    if (preview.image) {
      const img = document.createElement('img');
      img.src = preview.image;
      img.alt = '';
      card.append(img);
    }
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = [preview.date, `${preview.readingTime} min read`, preview.series && `Part of ${preview.series}`].filter(Boolean).join(' · ');
    const title = document.createElement('p');
    title.className = 'preview-title';
    title.textContent = preview.title;
    const excerpt = document.createElement('p');
    excerpt.className = 'preview-excerpt';
    excerpt.textContent = preview.excerpt;
    card.append(meta, title, excerpt);
  }

  // Below the link, or above it if there is no room below; kept inside the screen sideways
  function position(link) {
    const rect = link.getClientRects()[0] ?? link.getBoundingClientRect();
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const below = rect.bottom + 8;
    const top = below + height > window.innerHeight - 8 && rect.top - height - 8 > 8 ? rect.top - height - 8 : below;
    card.style.left = `${left + window.scrollX}px`;
    card.style.top = `${top + window.scrollY}px`;
  }

  async function show(link) {
    current = link;
    try {
      previews ??= await fetch('/previews.json').then((response) => response.json());
    } catch {
      return;
    }
    const preview = previews[pathOf(link)];
    // The pointer may have moved on while the previews loaded
    if (!preview || current !== link) return;
    fill(preview);
    card.hidden = false;
    position(link);
  }

  function hide() {
    clearTimeout(showTimer);
    current = undefined;
    card.hidden = true;
  }

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  for (const link of previewLinks) {
    link.addEventListener('mouseenter', () => {
      if (!canHover.matches) return;
      clearTimeout(showTimer);
      showTimer = setTimeout(() => show(link), 300);
    });
    link.addEventListener('mouseleave', hide);
    link.addEventListener('focus', () => {
      if (link.matches(':focus-visible')) show(link);
    });
    link.addEventListener('blur', hide);
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !card.hidden) hide();
  });
  window.addEventListener('resize', hide);
}
