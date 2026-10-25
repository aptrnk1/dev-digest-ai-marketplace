import { defineConfig, devices } from '@playwright/test';

// CI runs Chromium, Firefox and WebKit (NFR7). Locally, `PW_CHANNEL=chrome` uses the installed
// Google Chrome when Playwright's bundled browsers are unavailable (e.g. macOS 12).
const channel = process.env.PW_CHANNEL;
const PORT = 4323;

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}/`, trace: 'retain-on-failure' },
  webServer: {
    command: `node scripts/serve.mjs dist-fixtures ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: channel
    ? [{ name: channel, use: { ...devices['Desktop Chrome'], channel } }]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ],
});
