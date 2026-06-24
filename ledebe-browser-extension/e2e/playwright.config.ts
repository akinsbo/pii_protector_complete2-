import { defineConfig } from '@playwright/test';

// Extension E2E — separate from the app's root playwright.config.ts.
// Run from the repo root:  npm run test:ext-e2e
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1, // a single persistent context with the extension loaded
  reporter: [['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
