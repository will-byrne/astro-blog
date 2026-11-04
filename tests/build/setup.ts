import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Builds the site once before the build tests run.
// SKIP_BUILD=1 reuses an existing dist/, for example when CI has just built it.
export default function setup() {
  if (process.env.SKIP_BUILD === '1') {
    if (!existsSync('dist/index.html')) throw new Error('SKIP_BUILD is set but dist/ has not been built');
    return;
  }
  execFileSync('npx', ['astro', 'build', '--silent'], {
    stdio: 'inherit',
    // Vitest sets NODE_ENV=test, which would make Astro build drafts as if in dev
    env: { ...process.env, NODE_ENV: 'production', RESUME_FILE: process.env.RESUME_FILE ?? resolve('tests/fixtures/resume.json') },
  });
}
