/**
 * The playful extras. Styles are in src/styles/fun.css.
 *
 *  - Konami code (↑ ↑ ↓ ↓ ← → ← → B A), or pressing the footer unicorn: unicorn mode, for the rest of the visit
 *  - n, or pressing the moon in the footer: night vision, red like an astronomer's torch, for the rest of the visit
 *  - c, or pressing the coffee in the footer: the caffeine meter. Each cup speeds up the footer unicorn; the fifth
 *    rains coffee, and the tenth switches to decaf (back to the start). It lasts for the visit
 *  - p, or pressing the rainbow in the footer: pride mode, which swaps the themes for pride flags, starting on Rainbow.
 *    It stays on between visits until turned off, and is always on in June (see theme.ts)
 *  - A sparkle trail behind the pointer, off unless switched on in the footer
 *  - Each new text selection in the next colour of the palette
 *  - The avatar on the About page, which needs more coffee
 *  - A hello in the browser console
 *
 * Nothing moves for people who ask their device for reduced motion.
 */

import { togglePrideMode } from './theme';

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
  'Hello, curious one! 🦄\nPsst: try ↑ ↑ ↓ ↓ ← → ← → B A (or catch the unicorn in the footer),\npress n (or the moon) under a dark sky,\nc (or the coffee) when you need a pick-me-up,\nand p (or the rainbow) to show your pride.',
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

// Unicorn mode's sparkles: bigger, filled with a rainbow, and twinkling in place rather than drifting down.
// At most this many are on the screen at once, so the page stays smooth.
const MAX_RAINBOW_SPARKLES = 50;

function rainbowSparkle() {
  if (document.querySelectorAll('.sparkle.rainbow').length >= MAX_RAINBOW_SPARKLES) return;
  const star = document.createElement('span');
  star.className = 'sparkle rainbow';
  star.setAttribute('aria-hidden', 'true');
  star.textContent = ['✦', '✧', '✶', '★'][Math.floor(Math.random() * 4)];
  star.style.left = `${Math.random() * window.innerWidth}px`;
  star.style.top = `${Math.random() * window.innerHeight}px`;
  star.style.setProperty('--size', `${1.8 + Math.random() * 1.8}rem`);
  // Each one's rainbow runs at its own angle
  star.style.setProperty('--angle', `${Math.floor(Math.random() * 360)}deg`);
  star.addEventListener('animationend', () => star.remove());
  document.body.append(star);
}

// Sparkle cursor: a switch in the footer, remembered between visits. Hidden when motion is reduced, and on
// touch-only devices (phones, tablets), where there's no cursor for it to trail.
const sparkleToggle = document.querySelector('.sparkle-toggle');
const hasMouse = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
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
  // Shown or hidden as a mouse comes and goes, say a tablet with a mouse plugged in
  const showToggle = () => (sparkleToggle.hidden = !hasMouse.matches);
  showToggle();
  hasMouse.addEventListener('change', showToggle);
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
const unicornButton = document.querySelector('[data-unicorn-toggle]');
const moonButton = document.querySelector('[data-night-toggle]');

function setUnicornMode(on) {
  unicornButton?.setAttribute('aria-pressed', String(on));
  if (on) root.dataset.unicorn = '';
  else delete root.dataset.unicorn;
  if (on && !document.title.startsWith(NEIGH)) document.title = NEIGH + document.title;
  if (!on && document.title.startsWith(NEIGH)) document.title = document.title.slice(NEIGH.length);
  clearInterval(unicornSparkles);
  // Rainbow sparkles twinkle all over the screen, a pair at a time
  if (on && !reducedMotion.matches) {
    unicornSparkles = setInterval(() => {
      rainbowSparkle();
      rainbowSparkle();
    }, 250);
  }
  if (!on) document.querySelectorAll('.sparkle.rainbow').forEach((star) => star.remove());
}

function toggleUnicornMode() {
  const on = !('unicorn' in root.dataset);
  setUnicornMode(on);
  remember('unicorn', on);
  announce(on ? 'Unicorn mode on. Neigh!' : 'Unicorn mode off');
}

setUnicornMode('unicorn' in root.dataset);
unicornButton?.addEventListener('click', toggleUnicornMode);

// Night vision
function toggleNightVision() {
  const on = !('night' in root.dataset);
  if (on) root.dataset.night = '';
  else delete root.dataset.night;
  moonButton?.setAttribute('aria-pressed', String(on));
  remember('night', on);
  announce(on ? 'Night vision on' : 'Night vision off');
}

moonButton?.setAttribute('aria-pressed', String('night' in root.dataset));
moonButton?.addEventListener('click', toggleNightVision);

// Coffee cups falling down the screen, from the About avatar and the caffeine meter
function coffeeRain() {
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
}

// The caffeine meter
const coffeeButton = document.querySelector('[data-coffee]');
const coffeeNote = document.querySelector('.coffee-note');
const DECAF = 10;
const CUPS = [
  "Ah, that's better",
  'Another one, please',
  "Now we're talking",
  'The unicorn is getting ideas',
  'It is raining coffee!',
  'I can hear colours',
  'Typing 200 words a minute',
  'Is the floor vibrating?',
  'Maybe just one more…',
  "That's enough. Switching to decaf",
];
let cups = 0;
let noteTimer;

try {
  cups = Math.min(DECAF - 1, Number(sessionStorage.getItem('coffee')) || 0);
} catch {}

/** Each cup speeds the footer unicorn up: its run more, its gallop a little, so it never turns into a blur */
function caffeinate() {
  if (cups) coffeeButton?.setAttribute('data-cups', String(cups));
  else coffeeButton?.removeAttribute('data-cups');
  const run = document.querySelector('.unicorn-run');
  for (const animation of run?.getAnimations({ subtree: true }) ?? []) {
    const gallop = animation.animationName === 'gallop';
    animation.updatePlaybackRate(gallop ? Math.min(2, 1 + cups * 0.12) : 1 + cups * 0.25);
  }
}

function steam() {
  if (reducedMotion.matches || !coffeeButton) return;
  for (let i = 0; i < 3; i++) {
    const wisp = document.createElement('span');
    wisp.className = 'steam';
    wisp.setAttribute('aria-hidden', 'true');
    wisp.style.left = `calc(50% + ${(i - 1) * 0.35}rem - 0.15rem)`;
    wisp.style.setProperty('--delay', `${i * 0.15}s`);
    wisp.style.setProperty('--drift', `${(Math.random() - 0.5) * 0.8}rem`);
    wisp.addEventListener('animationend', () => wisp.remove());
    coffeeButton.append(wisp);
  }
}

function drinkCoffee() {
  cups += 1;
  const message = `Cup ${cups}: ${CUPS[cups - 1]}`;
  if (cups === 5) coffeeRain();
  if (cups >= DECAF) cups = 0;
  caffeinate();
  steam();
  try {
    sessionStorage.setItem('coffee', String(cups));
  } catch {}
  announce(message);
  if (coffeeNote) {
    coffeeNote.textContent = message;
    coffeeNote.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      coffeeNote.hidden = true;
    }, 2500);
  }
}

caffeinate();
coffeeButton?.addEventListener('click', drinkCoffee);

// Pride mode
const PRIDE_MESSAGES = {
  on: 'Pride mode on: the themes are pride flags',
  off: 'Pride mode off',
  june: "It's Pride Month, so pride mode is on all June",
};
const prideButton = document.querySelector('[data-pride-toggle]');
const togglePride = () => announce(PRIDE_MESSAGES[togglePrideMode()]);
prideButton?.addEventListener('click', togglePride);

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiStep = 0;

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event)) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === KONAMI[konamiStep]) {
    konamiStep += 1;
    if (konamiStep === KONAMI.length) {
      konamiStep = 0;
      toggleUnicornMode();
    }
    return;
  }
  konamiStep = key === KONAMI[0] ? 1 : 0;

  // Night vision. The Konami code has no n in it, so the two never clash.
  if (key === 'n') toggleNightVision();
  // Nor a p or a c
  if (key === 'p') togglePride();
  if (key === 'c') drinkCoffee();
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
    coffeeRain();
  });
}
