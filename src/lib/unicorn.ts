// The site's pixel-art unicorn, facing right. Used in the footer, on the reading progress bar and on the 404 page.
//
// Each letter is one pixel:
//   W body   Y horn   K eye   C cheek   H hoof   1-6 mane and tail, in rainbow order   . nothing
// An outline is added around the whole shape, so the white body shows on light themes too.
const ART = [
  '................Y...',
  '...............Y....',
  '...........W..Y.....',
  '..........1WWWW.....',
  '.........12WWWWWW...',
  '........23WWWKWWWW..',
  '........34WWWWWCWWW.',
  '.......45WWWW..WWWW.',
  '.......56WWW........',
  '.12...61WWWW........',
  '234WWWWWWWWWW.......',
  '45.WWWWWWWWWWW......',
  '6..WWWWWWWWWWW......',
  '...WW.WW...WW.WW....',
  '...WW.WW...WW.WW....',
  '...HH.HH...HH.HH....',
];

export const UNICORN_COLOURS: Record<string, string> = {
  W: '#fdfcff',
  Y: '#ffd23f',
  K: '#2b2b3b',
  C: '#ff9ccf',
  H: '#b7bdf8',
  1: '#ff5f8f',
  2: '#ff9f43',
  3: '#ffd93d',
  4: '#6bcb77',
  5: '#4d96ff',
  6: '#9b5de5',
  outline: '#2b2b3b',
};

/** Width and height in pixels, including the outline */
export const UNICORN_SIZE = { width: ART[0].length + 2, height: ART.length + 2 };

/**
 * The unicorn as one SVG path per colour, each made of 1x1 squares, in a viewBox of UNICORN_SIZE.
 * Drawing a path per colour keeps the SVG small compared with a rectangle per pixel.
 */
export function unicornPaths(): { fill: string; d: string }[] {
  const filled = (x: number, y: number) => ART[y]?.[x] !== undefined && ART[y][x] !== '.';
  const squares = new Map<string, string[]>();
  const add = (colour: string, x: number, y: number) => squares.set(colour, [...(squares.get(colour) ?? []), `M${x + 1} ${y + 1}h1v1h-1z`]);

  for (let y = -1; y <= ART.length; y++) {
    for (let x = -1; x <= ART[0].length; x++) {
      if (filled(x, y)) add(UNICORN_COLOURS[ART[y][x]], x, y);
      else if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) add(UNICORN_COLOURS.outline, x, y);
    }
  }
  return [...squares].map(([fill, parts]) => ({ fill, d: parts.join('') }));
}
