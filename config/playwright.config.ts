import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { env } from './env';

export default defineConfig({
  testDir: path.join(__dirname, '..', 'tests'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: env.KAYAKO_AGENT_URL,
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Enable later as needed
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  outputDir: path.join(__dirname, '..', 'test-results'),
});


