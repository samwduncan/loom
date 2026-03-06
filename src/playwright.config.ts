import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration.
 *
 * - Single worker: real backend can't handle parallel test sessions
 * - Sequential mode: tests within a file may depend on prior state
 * - Generous timeouts: real API calls to Anthropic need breathing room
 * - webServer array: starts both backend (port 5555) and Vite dev server (port 5184)
 *
 * CLAUDECODE env var is deleted by server/load-env.js, so no manual unset needed.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'html',
  timeout: 90_000,

  use: {
    baseURL: 'http://localhost:5184',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },

  webServer: [
    {
      command: 'cd .. && node server/index.js',
      url: 'http://localhost:5555/api/auth/status',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5184',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
