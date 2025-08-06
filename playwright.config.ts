import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'https://civicos.onrender.com', // Updated to live production URL
    headless: true,
    trace: 'on-first-retry',
  },
}); 