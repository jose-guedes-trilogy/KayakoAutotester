import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';
import fs from 'fs';
import path from 'path';

const log = createLogger('auth.fixture');

type Fixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    log.info('Starting login flow for authenticatedPage');
    const login = new LoginPage(page);
    await login.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);
    log.info('Login successful');
    try {
      const storageDir = path.join(process.cwd(), 'storage');
      fs.mkdirSync(storageDir, { recursive: true });
      const storagePath = path.join(storageDir, 'agent-auth.json');
      await page.context().storageState({ path: storagePath });
      log.info('Saved storageState to %s', storagePath);
    } catch (e) {
      log.warn('Failed to save storageState', e);
    }
    await use(page);
  },
});

export { expect };

// Optional: keep the browser open for inspection after tests (primarily for headed debugging)
// Controlled via env.KAYAKO_HOLD_OPEN_MS, which is injected by the Control Center UI for headed runs.
test.afterEach(async ({ authenticatedPage }, testInfo) => {
  const raw = (process.env.KAYAKO_HOLD_OPEN_MS || '').trim();
  const ms = raw ? parseInt(raw, 10) : 0;
  if (!ms || Number.isNaN(ms) || ms <= 0) {
    return;
  }
  log.info('Holding browser open for %dms after test "%s"', ms, testInfo.title);
  try {
    await authenticatedPage.waitForTimeout(ms);
  } catch (e) {
    log.warn('Hold-open wait interrupted', e);
  }
});


