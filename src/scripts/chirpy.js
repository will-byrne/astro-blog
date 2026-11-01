/**
 * Page behaviour that Chirpy's bundled JavaScript provided on the old site:
 * sidebar toggle, search, back to top, copy buttons and the image lightbox
 */

const $ = (selector) => document.querySelector(selector);

// Sidebar (mobile)
const toggleSidebar = () => document.body.toggleAttribute('sidebar-display');
$('#sidebar-trigger')?.addEventListener('click', toggleSidebar);
$('#mask')?.addEventListener('click', toggleSidebar);

// Back to top
const backToTop = $('#back-to-top');
const updateBackToTop = () => {
  backToTop.style.display = window.scrollY > 50 ? 'block' : 'none';
};
window.addEventListener('scroll', updateBackToTop, { passive: true });
updateBackToTop();
backToTop.addEventListener('click', () => window.scrollTo(0, 0));

// Search
const searchInput = $('#search-input');
const searchBox = $('search');
const searchTrigger = $('#search-trigger');
const searchCancel = $('#search-cancel');
const sidebarTrigger = $('#sidebar-trigger');
const topbarTitle = $('#topbar-title');
const resultWrapper = $('#search-result-wrapper');
const results = $('#search-results');
const hints = $('#search-hints');
const pageRows = document.querySelectorAll('#main-wrapper > .container > .row');
const SEARCH_LIMIT = 10;

let searchIndex;
let resultsVisible = false;
let scrollOffset = 0;

const isMobileSearch = () => searchCancel.classList.contains('loaded');

function showResults() {
  if (resultsVisible) return;
  scrollOffset = window.scrollY;
  window.scrollTo(0, 0);
  resultWrapper.classList.remove('unloaded');
  pageRows.forEach((row) => row.classList.add('unloaded'));
  resultsVisible = true;
}

function hideResults() {
  if (!resultsVisible) return;
  results.replaceChildren();
  hints.classList.remove('unloaded');
  resultWrapper.classList.add('unloaded');
  pageRows.forEach((row) => row.classList.remove('unloaded'));
  window.scrollTo(0, scrollOffset);
  searchInput.value = '';
  resultsVisible = false;
}

function resultElement(item) {
  const article = document.createElement('article');
  article.className = 'px-1 px-sm-2 px-lg-4 px-xl-0';

  const header = document.createElement('header');
  const heading = document.createElement('h2');
  const link = document.createElement('a');
  link.href = item.url;
  link.textContent = item.title;
  heading.append(link);

  const meta = document.createElement('div');
  meta.className = 'post-meta d-flex flex-column flex-sm-row text-muted mt-1 mb-1';
  const addMeta = (iconClass, value, className) => {
    if (!value) return;
    const row = document.createElement('div');
    if (className) row.className = className;
    const icon = document.createElement('i');
    icon.className = iconClass;
    row.append(icon, value);
    meta.append(row);
  };
  addMeta('far fa-folder fa-fw', item.category, 'me-sm-4');
  addMeta('fa fa-tag fa-fw', item.tags);
  header.append(heading, meta);

  const snippet = document.createElement('p');
  snippet.textContent = item.snippet;

  article.append(header, snippet);
  return article;
}

async function runSearch(query) {
  searchIndex ??= await fetch('/search.json').then((response) => response.json());
  // Results may arrive after the input has changed
  if (searchInput.value !== query) return;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = searchIndex
    .filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.tags} ${item.content}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, SEARCH_LIMIT);
  results.replaceChildren(...matches.map(resultElement));
}

searchInput.addEventListener('focus', () => searchBox.classList.add('input-focus'));
searchInput.addEventListener('focusout', () => searchBox.classList.remove('input-focus'));
searchInput.addEventListener('input', () => {
  const query = searchInput.value;
  if (query === '') {
    if (isMobileSearch()) {
      results.replaceChildren();
      hints.classList.remove('unloaded');
    } else {
      hideResults();
    }
    return;
  }
  showResults();
  if (isMobileSearch()) hints.classList.add('unloaded');
  runSearch(query);
});

searchTrigger.addEventListener('click', () => {
  [sidebarTrigger, topbarTitle, searchTrigger].forEach((el) => el.classList.add('unloaded'));
  searchBox.classList.add('d-flex');
  searchCancel.classList.add('loaded');
  showResults();
  searchInput.focus();
});

searchCancel.addEventListener('click', () => {
  searchCancel.classList.remove('loaded');
  searchBox.classList.remove('d-flex');
  [sidebarTrigger, topbarTitle, searchTrigger].forEach((el) => el.classList.remove('unloaded'));
  hideResults();
});

// Copy buttons
const flashIcon = (button, iconClass) => {
  const icon = button.querySelector('i');
  const original = icon.className;
  icon.className = iconClass;
  button.classList.add('timeout');
  setTimeout(() => {
    icon.className = original;
    button.classList.remove('timeout');
  }, 2000);
};

document.querySelectorAll('.code-header button').forEach((button) => {
  button.addEventListener('click', async () => {
    if (button.classList.contains('timeout')) return;
    const code = button.closest('.highlighter-rouge').querySelector('.rouge-code pre').textContent;
    await navigator.clipboard.writeText(code);
    flashIcon(button, 'fas fa-check');
  });
});

$('#copy-link')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  await navigator.clipboard.writeText(window.location.href);
  button.title = 'Link copied successfully!';
  setTimeout(() => {
    button.title = 'Copy link';
  }, 2000);
});

// Image lightbox
function showLightbox(imageSrc, imageAlt) {
  const modal = document.createElement('div');
  modal.className = 'image-lightbox-modal active';

  const content = document.createElement('div');
  content.className = 'image-lightbox-content';

  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = imageAlt;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'image-lightbox-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close image');

  content.appendChild(img);
  modal.appendChild(content);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);

  const handleEscape = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  const closeModal = () => {
    document.removeEventListener('keydown', handleEscape);
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', handleEscape);
}

document.querySelectorAll('a.popup').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const img = link.querySelector('img');
    showLightbox(link.href, img?.alt ?? '');
  });
});
