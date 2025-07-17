import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:5000',
    headless: true,
    trace: 'on-first-retry',
  },
}); 