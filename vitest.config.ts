/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig lets tests import Astro modules such as astro:content
export default getViteConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts', 'tests/content/**/*.test.ts'],
          // UTC+14, so code that accidentally uses local time gets the wrong date
          env: { TZ: 'Pacific/Kiritimati' },
        },
      },
      {
        extends: true,
        test: {
          name: 'build',
          include: ['tests/build/**/*.test.ts'],
          // Builds the site once for every test in this project
          globalSetup: ['tests/build/setup.ts'],
        },
      },
    ],
  },
});
