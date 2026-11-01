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
document.querySelectorAll('[data-search-open]').forEach((button) => button.addEventListener('click', openSearch));
document.querySelector('[data-search-close]').addEventListener('click', () => searchDialog.close());
searchDialog.addEventListener('click', (event) => {
  if (event.target === searchDialog) searchDialog.close();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]')) return;
  event.preventDefault();
  openSearch();
});

// Image lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImage = lightbox.querySelector('img');

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
  lightboxImage.src = largestSource(img);
  lightboxImage.alt = img.alt;
  lightbox.showModal();
}

document.querySelectorAll('.prose img, [data-zoomable]').forEach((img) => {
  if (img.closest('a')) return;
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

lightbox.addEventListener('click', () => lightbox.close());
lightbox.addEventListener('close', () => lightboxImage.removeAttribute('src'));

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
