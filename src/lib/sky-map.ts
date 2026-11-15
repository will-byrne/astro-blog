// Draws a small star map around a target in the sky, for the astrophotography gallery.
//
// Positions come from section.json as text, the way star atlases write them:
//   "ra": "00h 42m 44s"     right ascension, in hours, minutes and seconds (minutes and seconds optional)
//   "dec": "+41° 16′ 09″"   declination, in degrees, minutes and seconds; ' and " work too
// The map is worked out at build time and drawn as SVG, so no star data goes to the browser.

/** A star as [right ascension in degrees, declination in degrees, magnitude, name if bright] */
export type Star = [number, number, number, string?];

export interface Constellation {
  id: string;
  name: string;
  /** Where its name goes, as [right ascension, declination] in degrees */
  label: [number, number];
  /** Stick-figure lines, each a list of [right ascension, declination] points */
  lines: [number, number][][];
}

export interface SkyData {
  stars: Star[];
  constellations: Constellation[];
}

const NUMBER = String.raw`(\d+(?:\.\d+)?)`;
const RA = new RegExp(String.raw`^${NUMBER}\s*h(?:\s*${NUMBER}\s*m(?:\s*${NUMBER}\s*s)?)?$`, 'i');
const DEC = new RegExp(String.raw`^([+\-−])?\s*${NUMBER}\s*°(?:\s*${NUMBER}\s*['′](?:\s*${NUMBER}\s*["″])?)?$`);

/** "00h 42m 44s" -> 10.68 degrees, or undefined if it is not a right ascension */
export function parseRightAscension(text: string): number | undefined {
  const match = text.trim().match(RA);
  if (!match) return undefined;
  const [h, m = 0, s = 0] = match.slice(1).map((part) => (part === undefined ? undefined : Number(part)));
  if (h! >= 24 || m >= 60 || s >= 60) return undefined;
  return (h! + m / 60 + s / 3600) * 15;
}

/** "+41° 16′ 09″" -> 41.27 degrees, or undefined if it is not a declination */
export function parseDeclination(text: string): number | undefined {
  const match = text.trim().match(DEC);
  if (!match) return undefined;
  const [d, m = 0, s = 0] = match.slice(2).map((part) => (part === undefined ? undefined : Number(part)));
  if (d! > 90 || m >= 60 || s >= 60) return undefined;
  const value = d! + m / 60 + s / 3600;
  if (value > 90) return undefined;
  return match[1] === '-' || match[1] === '−' ? -value : value;
}

const RAD = Math.PI / 180;

/**
 * A stereographic projection centred on the target, the usual one for star charts as it keeps shapes true.
 * East is on the left and north at the top, as the sky looks when you face it.
 * Returns undefined for points on the far side of the sky.
 */
export function projector(centreRa: number, centreDec: number) {
  const d0 = centreDec * RAD;
  return (ra: number, dec: number): [number, number] | undefined => {
    const d = dec * RAD;
    const dRa = (ra - centreRa) * RAD;
    const cosC = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(dRa);
    if (cosC < 0) return undefined;
    const k = 2 / (1 + cosC);
    return [-k * Math.cos(d) * Math.sin(dRa), k * (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(dRa))];
  };
}

export interface SkyMap {
  width: number;
  height: number;
  target: { x: number; y: number };
  /** How far below the target its name goes */
  labelGap: number;
  /** A bright star's name goes on its right, or on its left (`nameLeft`) if there is no room */
  stars: { x: number; y: number; r: number; name?: string; nameLeft?: boolean }[];
  /** SVG path data for the constellation lines; `home` is the target's own constellation */
  lines: { d: string; home: boolean }[];
  labels: { x: number; y: number; name: string; home: boolean }[];
  /** The constellation the target is in, if it could be found by name */
  home?: string;
}

/** Bigger dots for brighter stars (lower magnitudes) */
const radius = (mag: number) => Math.max(0.7, 0.8 * (5.8 - mag));

/** Roughly how wide a label is, at 14px, so labels can be kept inside the map */
const textWidth = (text: string) => text.length * 8;

export interface SkyMapOptions {
  /** The constellation given in section.json, e.g. "Cygnus"; its lines and name are picked out */
  constellation?: string;
  /** The target's name, shown under it; other labels keep out of its way */
  target?: string;
  /** How many degrees of sky the map shows across */
  field?: number;
  width?: number;
  height?: number;
}

/** Lays out a map centred on the target */
export function buildSkyMap(data: SkyData, ra: number, dec: number, options: SkyMapOptions = {}): SkyMap {
  const { constellation, target, field = 50, width = 320, height = 240 } = options;
  const project = projector(ra, dec);
  // Projected distance from the centre to the left and right edges
  const scale = width / 2 / (2 * Math.tan((field / 4) * RAD));
  const centre = { x: width / 2, y: height / 2 };
  const labelGap = 32;
  const place = (pointRa: number, pointDec: number) => {
    const point = project(pointRa, pointDec);
    if (!point) return undefined;
    const x = centre.x + point[0] * scale;
    const y = centre.y - point[1] * scale;
    // Far beyond the edges, the projection stretches too much to be worth drawing
    if (Math.abs(x - centre.x) > width * 2 || Math.abs(y - centre.y) > height * 2) return undefined;
    return { x, y };
  };
  const inside = ({ x, y }: { x: number; y: number }, pad = 0) => x >= pad && x <= width - pad && y >= pad && y <= height - pad;
  // Text is kept off the target's ring, its name, and the compass in the bottom left corner.
  // Boxes are [left, top, right, bottom]; a label is checked by its baseline, so it reaches about 14px above.
  const nameHalf = target ? (target.length * 9.5) / 2 + 4 : 0;
  const keepClear: number[][] = [
    [centre.x - 22, centre.y - 22, centre.x + 22, centre.y + 22],
    [centre.x - nameHalf, centre.y + labelGap - 16, centre.x + nameHalf, centre.y + labelGap + 5],
    [0, height - 26, 75, height],
  ];
  // Each label placed is added here too, so later labels keep out of its way
  const clear = (left: number, right: number, y: number) =>
    left >= 4 &&
    right <= width - 4 &&
    y >= 16 &&
    y <= height - 6 &&
    keepClear.every(([l, t, r, b]) => right + 3 < l || left - 3 > r || y < t || y - 14 > b);
  const claim = (left: number, right: number, y: number) => {
    keepClear.push([left, y - 14, right, y + 4]);
  };
  const round = (n: number) => Math.round(n * 10) / 10;
  const wanted = constellation?.trim().toLowerCase();
  const home = wanted ? data.constellations.find((c) => c.name.toLowerCase() === wanted || c.id.toLowerCase() === wanted) : undefined;

  // The home constellation's name goes first, and moves up or down to find room, as its usual spot can be right
  // on the target. Then star names, brightest first; then the other constellations' names, where there is room.
  const labels: SkyMap['labels'] = [];
  const homePoint = home && place(...home.label);
  if (home && homePoint) {
    const half = textWidth(home.name) / 2 + 4;
    const y = [0, -28, 28, -52, 52, -76, 76].map((shift) => homePoint.y + shift).find((tryY) => clear(homePoint.x - half, homePoint.x + half, tryY));
    if (y !== undefined) {
      claim(homePoint.x - half, homePoint.x + half, y);
      labels.push({ x: round(homePoint.x), y: round(y), name: home.name, home: true });
    }
  }

  const stars = data.stars.flatMap(([starRa, starDec, mag, name]) => {
    const point = place(starRa, starDec);
    if (!point || !inside(point, -4)) return [];
    const r = round(radius(mag));
    const star = { x: round(point.x), y: round(point.y), r };
    if (!name) return [star];
    const gap = r + 3;
    const y = point.y + 5;
    if (clear(point.x + gap, point.x + gap + textWidth(name), y)) {
      claim(point.x + gap, point.x + gap + textWidth(name), y);
      return [{ ...star, name }];
    }
    if (clear(point.x - gap - textWidth(name), point.x - gap, y)) {
      claim(point.x - gap - textWidth(name), point.x - gap, y);
      return [{ ...star, name, nameLeft: true }];
    }
    return [star];
  });

  const lines = data.constellations.flatMap((c) =>
    c.lines.flatMap((line) => {
      // Split a line where it leaves the drawable part of the sky
      const runs: { x: number; y: number }[][] = [[]];
      for (const [pointRa, pointDec] of line) {
        const point = place(pointRa, pointDec);
        if (point) runs[runs.length - 1].push(point);
        else if (runs[runs.length - 1].length) runs.push([]);
      }
      return runs
        .filter((run) => run.length > 1 && run.some((point) => inside(point)))
        .map((run) => ({ d: run.map((p, i) => `${i ? 'L' : 'M'}${round(p.x)} ${round(p.y)}`).join(''), home: c === home }));
    }),
  );

  for (const c of data.constellations) {
    if (c === home) continue;
    const point = place(...c.label);
    if (!point) continue;
    const half = textWidth(c.name) / 2;
    if (!clear(point.x - half, point.x + half, point.y)) continue;
    claim(point.x - half, point.x + half, point.y);
    labels.push({ x: round(point.x), y: round(point.y), name: c.name, home: false });
  }

  return { width, height, target: centre, labelGap, stars, lines, labels, home: home?.name };
}
