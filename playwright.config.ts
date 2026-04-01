import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'https://companions-develop.up.railway.app';
const API_URL = process.env.E2E_API_URL || 'https://api-develop-f1bc.up.railway.app';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000, // 2 min per test (onboarding has long waits)
  expect: { timeout: 15_000 },
  fullyParallel: false, // run sequentially — onboarding → signup → signin → chat
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    viewport: { width: 390, height: 844 }, // iPhone 14 portrait
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  },
  projects: [
    {
      name: 'mobile-portrait',
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 }, userAgent: undefined },
    },
  ],
  // Make API URL available to tests
  metadata: { apiUrl: API_URL },
});
