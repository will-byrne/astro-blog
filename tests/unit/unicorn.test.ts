import { describe, expect, it } from 'vitest';
import { UNICORN_COLOURS, UNICORN_SIZE, unicornPaths } from '../../src/lib/unicorn';

describe('unicornPaths', () => {
  const paths = unicornPaths();
  const squares = (d: string) => [...d.matchAll(/M(\d+) (\d+)/g)].map(([, x, y]) => [Number(x), Number(y)]);

  it('uses every colour, including the outline', () => {
    expect(paths.map((p) => p.fill).sort()).toEqual([...new Set(Object.values(UNICORN_COLOURS))].sort());
  });

  it('keeps every pixel inside the picture', () => {
    for (const { d } of paths) {
      for (const [x, y] of squares(d)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(UNICORN_SIZE.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(UNICORN_SIZE.height);
      }
    }
  });

  it('never draws two colours on the same pixel', () => {
    const seen = new Set<string>();
    for (const { d } of paths) {
      for (const [x, y] of squares(d)) {
        const key = `${x},${y}`;
        expect(seen.has(key), key).toBe(false);
        seen.add(key);
      }
    }
  });
});
