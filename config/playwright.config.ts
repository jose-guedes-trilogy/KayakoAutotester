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
  reporter: (() => {
    const runId = process.env.RUN_ID?.trim();
    if (!runId) {
      return [
        // Ensure progress goes to stdout for the orchestrator live logs
        ['list'],
        ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
      ] as any;
    }
    const base = path.join(process.cwd(), 'runs', runId);
    return [
      // Ensure progress goes to stdout for the orchestrator live logs
      ['list'],
      ['html', { open: 'never', outputFolder: path.join(base, 'html') }],
      ['junit', { outputFile: path.join(base, 'junit.xml') }],
      ['json', { outputFile: path.join(base, 'report.json') }],
    ] as any;
  })(),
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
    video: (() => {
      const v = (process.env.KAYAKO_VIDEO || '').trim().toLowerCase();
      if (v === 'on' || v === 'on-first-retry' || v === 'retain-on-failure' || v === 'off') return v as any;
      return 'retain-on-failure';
    })(),
    screenshot: (() => {
      const s = (process.env.KAYAKO_SCREENSHOT || '').trim().toLowerCase();
      if (s === 'on' || s === 'off' || s === 'only-on-failure') return s as any;
      return 'only-on-failure';
    })(),
  },
  outputDir: (() => {
    const runId = process.env.RUN_ID?.trim();
    return runId ? path.join(process.cwd(), 'runs', runId, 'artifacts') : path.join(__dirname, '..', 'test-results');
  })(),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], video: 'off', trace: 'off' } },
  ],
});


