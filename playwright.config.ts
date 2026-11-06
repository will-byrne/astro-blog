import { defineConfig, devices } from '@playwright/test';

const PORT = 4322;
const CI = Boolean(process.env.CI);

// Some desktop setups put newer audio libraries on LD_LIBRARY_PATH, which stops the Nix flake's
// Chromium from starting. The browser never needs it, so it is left out of the browser's environment.
const { LD_LIBRARY_PATH: _ignored, ...browserEnv } = process.env;

const build = 'npx astro build --silent';
const preview = `npx astro preview --port ${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      env: browserEnv as Record<string, string>,
      // Lets a machine use its own Chromium when the bundled one will not run
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    {
      name: 'phone',
      // The narrowest screen the site supports
      use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true },
      testMatch: ['layout.spec.ts', 'search.spec.ts', 'theme.spec.ts'],
    },
  ],
  webServer: {
    // Builds the real site, like the deploy does. SKIP_BUILD=1 reuses dist/ from an earlier build.
    command: process.env.SKIP_BUILD === '1' ? preview : `${build} && ${preview}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 180_000,
    env: { NODE_ENV: 'production', RESUME_FILE: process.env.RESUME_FILE ?? 'src/data/resume.json' },
  },
});
