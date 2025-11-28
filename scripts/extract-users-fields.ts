import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';
import { LoginPage } from '../pages/LoginPage';

const log = createLogger('extract-users-fields');

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    log.info('Starting login for extract-users-fields');
    const loginPage = new LoginPage(page);
    await loginPage.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);

    const usersUrl = `${env.KAYAKO_AGENT_URL.replace(/\/$/, '')}/users`;
    log.info('Navigating to Users directory: %s', usersUrl);
    await page.goto(usersUrl);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);

    const items = page.locator("[class*='ko-entity-list_sidebar_definition__definition-item_']");
    const count = await items.count();
    log.info('Found %d user attribute rows in sidebar', count);

    const results: Array<{ index: number; label: string; html: string }> = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const labelLocator = item.locator("[class*='ko-entity-list_sidebar_definition__label-text_']");
      const labelText = (await labelLocator.innerText().catch(() => '')).trim() || `attribute-${i + 1}`;

      log.info('Toggling attribute %d: %s', i, labelText);
      const checkbox = item.getByRole('checkbox');
      await checkbox.click();
      await page.waitForTimeout(500);

      const perItemDetail = item.locator('.liquid-container');
      const html = (await perItemDetail.innerHTML().catch(() => '')).trim();
      log.info('Captured sidebar detail for "%s" (length=%d)', labelText, html.length);
      results.push({ index: i, label: labelText, html });
    }

    const outDir = path.join(process.cwd(), 'artifacts', 'html');
    const outFile = path.join(outDir, 'users-fields.json');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const payload = {
      generatedAt: new Date().toISOString(),
      sourceUrl: `${env.KAYAKO_AGENT_URL.replace(/\/$/, '')}/users`,
      fields: results,
    };
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
    log.info('Wrote %d field entries to %s', results.length, outFile);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[extract-users-fields] Unhandled error', err);
  process.exitCode = 1;
});


