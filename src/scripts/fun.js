/**
 * The playful extras. Styles are in src/styles/fun.css.
 *
 *  - Konami code (↑ ↑ ↓ ↓ ← → ← → B A): unicorn mode, for the rest of the visit
 *  - n: night vision, red like an astronomer's torch, for the rest of the visit
 *  - A sparkle trail behind the pointer, off unless switched on in the footer
 *  - Each new text selection in the next colour of the palette
 *  - The avatar on the About page, which needs more coffee
 *  - A hello in the browser console
 *
 * Nothing moves for people who ask their device for reduced motion.
 */

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const statusRegion = document.getElementById('fun-status');
const PALETTE = ['--mauve', '--pink', '--peach', '--yellow', '--green', '--teal', '--sapphire', '--blue'];

/** Tells screen reader users what changed */
function announce(message) {
  if (!statusRegion) return;
  statusRegion.textContent = '';
  // A new text node each time, so the same message is read again
  requestAnimationFrame(() => {
    statusRegion.textContent = message;
  });
}

function remember(key, on) {
  try {
    if (on) sessionStorage.setItem(key, 'on');
    else sessionStorage.removeItem(key);
  } catch {
    // Without storage the mode lasts for this page only
  }
}

/** Keys pressed while typing in a field, or with a dialog open, are not shortcuts */
function isTyping(event) {
  return event.target.closest?.('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]');
}

// Console hello: a unicorn by Maija Haavisto, from https://www.asciiart.eu/art/9dc62e405ad2e304.
// Their initials, mh, are replaced by a credit with their full name, printed under the art.
const UNICORN_ART = [
  "\\.",
  " \\\\      .",
  "  \\\\ _,.+;)_",
  "  .\\\\;~%:88%%.",
  " (( a   `)9,8;%.",
  " /`   _) ' `9%%%?",
  "(' .-' j    '8%%'",
  " `\"+   |    .88%)+._____..,,_   ,+%$%.",
  "       :.   d%9`             `-%*'\"'~%$.",
  "    ___(   (%C                 `.   68%%9",
  "  .\"        \\7                  ;  C8%%)``",
  "  : .\"-.__,'.____________..,`   L.  \\86' ,",
  "  : L    : :            `  .'\\.   '.  %$9%)",
  "  ;  -.  : |             \\  \\  \"-._ `. `~\"",
  "   `. !  : |              )  >     \". ?",
  "     `'  : |            .' .'       : |",
  "         ; !          .' .'         : |",
  "        ,' ;         ' .'           ; (",
  "       .  (         j  (            `  \\",
  "       \"\"\"'          \"\"'             `\"\"",
];
// The art goes in as a value (%s) rather than in the format string, as its % signs would be read as formatting
console.log(
  '%c%s\n%c%s\n\n%c%s',
  'color: #f5bde6; font-family: monospace;',
  UNICORN_ART.join('\n'),
  'color: #b8c0e0; font-style: italic;',
  'Unicorn by Maija Haavisto',
  'color: #c6a0f6; font-weight: bold;',
  'Hello, curious one! 🦄\nPsst: try ↑ ↑ ↓ ↓ ← → ← → B A, or press n under a dark sky.',
);

// Sparkles
function sparkle(x, y, colour) {
  const star = document.createElement('span');
  star.className = 'sparkle';
  star.setAttribute('aria-hidden', 'true');
  star.textContent = Math.random() < 0.5 ? '✦' : '✧';
  star.style.left = `${x}px`;
  star.style.top = `${y}px`;
  star.style.setProperty('--sparkle', `var(${colour})`);
  star.style.setProperty('--size', `${0.7 + Math.random() * 0.8}rem`);
  star.addEventListener('animationend', () => star.remove());
  document.body.append(star);
}

let sparkleColour = 0;
const nextColour = () => PALETTE[sparkleColour++ % PALETTE.length];

// Sparkle cursor: a switch in the footer, remembered between visits. Hidden when motion is reduced.
const sparkleToggle = document.querySelector('.sparkle-toggle');
let sparkleCursor = false;
let lastSparkle = 0;

function setSparkleCursor(on) {
  sparkleCursor = on;
  sparkleToggle?.setAttribute('aria-pressed', String(on));
  try {
    localStorage.setItem('sparkles', on ? 'on' : 'off');
  } catch {}
}

if (sparkleToggle && !reducedMotion.matches) {
  sparkleToggle.hidden = false;
  let saved;
  try {
    saved = localStorage.getItem('sparkles');
  } catch {}
  setSparkleCursor(saved === 'on');
  sparkleToggle.addEventListener('click', () => {
    setSparkleCursor(!sparkleCursor);
    announce(sparkleCursor ? 'Sparkle cursor on' : 'Sparkle cursor off');
  });
}

window.addEventListener(
  'pointermove',
  (event) => {
    if (!sparkleCursor || event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const now = performance.now();
    if (now - lastSparkle < 45) return;
    lastSparkle = now;
    sparkle(event.clientX + (Math.random() - 0.5) * 12, event.clientY + (Math.random() - 0.5) * 12, nextColour());
  },
  { passive: true },
);

// Unicorn mode
const NEIGH = '🦄 Neigh! ';
let unicornSparkles;

function setUnicornMode(on) {
  if (on) root.dataset.unicorn = '';
  else delete root.dataset.unicorn;
  if (on && !document.title.startsWith(NEIGH)) document.title = NEIGH + document.title;
  if (!on && document.title.startsWith(NEIGH)) document.title = document.title.slice(NEIGH.length);
  clearInterval(unicornSparkles);
  // Every so often a sparkle appears somewhere on the screen
  if (on && !reducedMotion.matches) {
    unicornSparkles = setInterval(() => sparkle(Math.random() * window.innerWidth, Math.random() * window.innerHeight, nextColour()), 700);
  }
}

if ('unicorn' in root.dataset) setUnicornMode(true);

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiStep = 0;

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event)) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === KONAMI[konamiStep]) {
    konamiStep += 1;
    if (konamiStep === KONAMI.length) {
      konamiStep = 0;
      const on = !('unicorn' in root.dataset);
      setUnicornMode(on);
      remember('unicorn', on);
      announce(on ? 'Unicorn mode on. Neigh!' : 'Unicorn mode off');
    }
    return;
  }
  konamiStep = key === KONAMI[0] ? 1 : 0;

  // Night vision. The Konami code has no n in it, so the two never clash.
  if (key === 'n') {
    const on = !('night' in root.dataset);
    if (on) root.dataset.night = '';
    else delete root.dataset.night;
    remember('night', on);
    announce(on ? 'Night vision on. Press n again to turn it off.' : 'Night vision off');
  }
});

// Rainbow selection: each new selection takes the next colour
let selecting = false;
let selectionColour = 0;
document.addEventListener('selectionchange', () => {
  const selected = !document.getSelection()?.isCollapsed;
  if (selected && !selecting) {
    root.style.setProperty('--selection', `var(${PALETTE[selectionColour++ % PALETTE.length]})`);
  }
  selecting = selected;
});

// The avatar on the About page: click it enough and it asks for coffee
const avatar = document.querySelector('[data-coffee-avatar]');
if (avatar) {
  const bubble = avatar.parentElement.querySelector('.coffee-bubble');
  let clicks = 0;
  avatar.addEventListener('click', () => {
    clicks += 1;
    avatar.classList.remove('wiggle');
    // Restarts the wiggle on every click
    void avatar.offsetWidth;
    avatar.classList.add('wiggle');
    if (clicks < 5) return;
    clicks = 0;
    bubble.hidden = false;
    announce('NEED MORE COFFEE!');
    setTimeout(() => {
      bubble.hidden = true;
    }, 4000);
    if (reducedMotion.matches) return;
    for (let i = 0; i < 14; i++) {
      const cup = document.createElement('span');
      cup.className = 'coffee-cup';
      cup.setAttribute('aria-hidden', 'true');
      cup.textContent = '☕';
      cup.style.left = `${Math.random() * 95}vw`;
      cup.style.setProperty('--delay', `${Math.random() * 1.2}s`);
      cup.style.setProperty('--fall', `${2 + Math.random() * 1.5}s`);
      cup.style.setProperty('--spin', `${(Math.random() - 0.5) * 720}deg`);
      cup.addEventListener('animationend', () => cup.remove());
      document.body.append(cup);
    }
  });
}
