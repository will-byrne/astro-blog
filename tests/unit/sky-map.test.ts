import { describe, expect, it } from 'vitest';
import sky from '../../src/data/sky.json';
import { buildSkyMap, parseDeclination, parseRightAscension, projector, type SkyData } from '../../src/lib/sky-map';

const data = sky as unknown as SkyData;

describe('parseRightAscension', () => {
  it.each([
    ['00h 42m 44s', 10.683],
    ['20h 59m 17.1s', 314.821],
    ['5h 35m', 83.75],
    ['12h', 180],
    ['20H59M17S', 314.821],
  ])('reads %j as %f degrees', (text, degrees) => {
    expect(parseRightAscension(text)).toBeCloseTo(degrees, 3);
  });

  it.each(['24h', '10h 60m', '10:42:44', '42m 44s', ''])('rejects %j', (text) => {
    expect(parseRightAscension(text)).toBeUndefined();
  });
});

describe('parseDeclination', () => {
  it.each([
    ['+41° 16′ 09″', 41.269],
    ["+44° 31' 44\"", 44.529],
    ['-5° 23′', -5.383],
    ['−60° 50′ 02″', -60.834],
    ['90°', 90],
    ['12.5°', 12.5],
  ])('reads %j as %f degrees', (text, degrees) => {
    expect(parseDeclination(text)).toBeCloseTo(degrees, 3);
  });

  it.each(['91°', '+90° 30′', '41 16 09', '+41° 60′', ''])('rejects %j', (text) => {
    expect(parseDeclination(text)).toBeUndefined();
  });
});

describe('projector', () => {
  const project = projector(10, 40);

  it('puts the centre in the middle', () => {
    const [x, y] = project(10, 40)!;
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });

  it('puts north up and east (higher right ascension) on the left', () => {
    expect(project(10, 50)![1]).toBeGreaterThan(0);
    expect(project(20, 40)![0]).toBeLessThan(0);
  });

  it('leaves out the far side of the sky', () => {
    expect(project(190, -40)).toBeUndefined();
  });

  it('copes with a target near right ascension 0', () => {
    const near = projector(359, 0);
    expect(near(1, 0)![0]).toBeLessThan(0);
    expect(Math.abs(near(1, 0)![0])).toBeLessThan(0.1);
  });
});

describe('buildSkyMap', () => {
  // The North America Nebula, in Cygnus
  const map = buildSkyMap(data, 314.82, 44.53, { constellation: 'Cygnus', target: 'North America Nebula' });

  it('centres the target', () => {
    expect(map.target).toEqual({ x: map.width / 2, y: map.height / 2 });
  });

  it('finds the constellation by name, ignoring case', () => {
    expect(map.home).toBe('Cygnus');
    expect(buildSkyMap(data, 314.82, 44.53, { constellation: 'cygnus' }).home).toBe('Cygnus');
    expect(buildSkyMap(data, 314.82, 44.53, { constellation: 'Cyg' }).home).toBe('Cygnus');
    expect(buildSkyMap(data, 314.82, 44.53, { constellation: 'Nowhere' }).home).toBeUndefined();
  });

  it('picks out the constellation lines and name', () => {
    expect(map.lines.some((line) => line.home)).toBe(true);
    expect(map.labels.find((label) => label.home)?.name).toBe('Cygnus');
  });

  it('names Deneb, the bright star next to the nebula', () => {
    expect(map.stars.some((star) => star.name === 'Deneb')).toBe(true);
  });

  it('keeps every star inside the map', () => {
    for (const star of map.stars) {
      expect(star.x).toBeGreaterThanOrEqual(-4);
      expect(star.x).toBeLessThanOrEqual(map.width + 4);
      expect(star.y).toBeGreaterThanOrEqual(-4);
      expect(star.y).toBeLessThanOrEqual(map.height + 4);
    }
  });

  it('keeps names off the target and its name', () => {
    for (const label of map.labels) expect(Math.hypot(label.x - map.target.x, label.y - map.target.y)).toBeGreaterThan(20);
    for (const star of map.stars.filter((s) => s.name)) {
      const nameY = star.y + 5;
      const underTarget = nameY > map.target.y + map.labelGap - 16 && nameY - 14 < map.target.y + map.labelGap + 5;
      expect(underTarget && Math.abs(star.x - map.target.x) < 60).toBe(false);
    }
  });

  it('finds room for the constellation name when its usual spot is on the target', () => {
    // The Andromeda Galaxy sits right where the name Andromeda would usually go
    const andromeda = buildSkyMap(data, 10.68, 41.27, { constellation: 'Andromeda', target: 'Andromeda Galaxy' });
    expect(andromeda.labels.find((label) => label.home)?.name).toBe('Andromeda');
  });

  it('never lets two labels overlap', () => {
    for (const [ra, dec] of [[10.68, 41.27], [314.82, 44.53], [83.8, -5.4]]) {
      const { labels, stars } = buildSkyMap(data, ra, dec, { target: 'Somewhere' });
      const boxes = [
        ...labels.map((l) => [l.x - l.name.length * 4, l.y - 14, l.x + l.name.length * 4, l.y + 4]),
        ...stars.filter((s) => s.name).map((s) => {
          const width = s.name!.length * 8;
          const left = s.nameLeft ? s.x - s.r - 3 - width : s.x + s.r + 3;
          return [left, s.y + 5 - 14, left + width, s.y + 5 + 4];
        }),
      ];
      boxes.forEach((a, i) =>
        boxes.slice(i + 1).forEach((b) => expect(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]).toBe(true)),
      );
    }
  });

  it('works anywhere in the sky, including the poles', () => {
    for (const [ra, dec] of [[0, 90], [180, -90], [0, 0], [359.9, -30]]) {
      const anywhere = buildSkyMap(data, ra, dec);
      expect(anywhere.stars.length).toBeGreaterThan(50);
      expect(anywhere.lines.every((line) => !line.d.includes('NaN'))).toBe(true);
    }
  });
});
