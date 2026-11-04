import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { exists } from './dist';

// Old URLs, including the ones kept from the Jekyll site, must keep working
const locked = readFileSync('tests/fixtures/published-urls.txt', 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

it('has URLs to check', () => {
  expect(locked.length).toBeGreaterThan(0);
});

it('still builds every published URL', () => {
  expect(locked.filter((url) => !exists(url))).toEqual([]);
});
