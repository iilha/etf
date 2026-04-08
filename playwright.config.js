const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8009',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 8009',
    port: 8009,
    reuseExistingServer: true,
  },
});
