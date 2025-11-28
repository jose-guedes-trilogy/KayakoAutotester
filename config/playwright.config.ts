import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { env } from './env';

export default defineConfig({
  testDir: path.join(__dirname, '..', 'tests'),
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  expect: {
    timeout: 15000,
  },
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: env.KAYAKO_AGENT_URL,
    headless: true,
    bypassCSP: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1366, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    launchOptions: {
      slowMo: 100,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    },
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], video: 'off', trace: 'off' } },
  ],
  outputDir: path.join(__dirname, '..', 'test-results'),
});


