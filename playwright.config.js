// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/* Sigilbound is a single static index.html with no build step. We serve the
   repo over http (not file://) so localStorage and module-scope globals behave
   exactly as they do in a real browser tab.

   The root must be the repo, not mobile/: the suite needs /index.html (the
   source) AND /mobile/index.html (the generated build the phone plays). Port
   8753 cannot be used — sigilbound-mobile.service holds it and serves mobile/
   as its root, so /mobile/index.html 404s there and reuseExistingServer below
   would silently attach the whole suite to that server. 8754 is the save
   endpoint. Keep this off both. */
const PORT = Number(process.env.PLAYWRIGHT_PORT || 8757);

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,          // one game instance; tests share no state but keep it simple
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
