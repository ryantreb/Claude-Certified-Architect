// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/* Weavefall is a single static index.html with no build step. We serve the
   repo over http (not file://) so localStorage and module-scope globals behave
   exactly as they do in a real browser tab. */
const PORT = 8753;

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
