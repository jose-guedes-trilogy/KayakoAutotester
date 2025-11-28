import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

const log = createLogger('debug-internal-note');

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const login = new LoginPage(page);
  await login.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);

  const convoUrl = env.KAYAKO_AGENT_URL.replace(/\/$/, '') + '/conversations/35';
  await page.goto(convoUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const { matches, toggles } = await page.evaluate(() => {
    const results: Array<{
      text: string;
      selector: string;
      role: string | null;
      tag: string;
      className: string;
      dataTestId: string | null;
      outerHTML: string;
    }> = [];
    const elements = Array.from(document.querySelectorAll('*'));
    for (const el of elements) {
      const text = (el.textContent || '').trim();
      if (!text) continue;
      if (!/internal note/i.test(text) && !/^note$/i.test(text)) continue;
      if (text.length > 120) continue;
      const path = [];
      let current: Element | null = el;
      while (current && path.length < 5) {
        const part = current.tagName.toLowerCase() + (current.className ? '.' + current.className.split(/\s+/).filter(Boolean).join('.') : '');
        path.unshift(part);
        current = current.parentElement;
      }
      results.push({
        text,
        selector: path.join(' > '),
        role: (el as HTMLElement).getAttribute('role'),
        tag: el.tagName.toLowerCase(),
        className: el.className,
        dataTestId:
          (el as HTMLElement).getAttribute('data-testid') ||
          (el as HTMLElement).getAttribute('data-test-id') ||
          (el as HTMLElement).getAttribute('data-test'),
        outerHTML: el.outerHTML.slice(0, 400),
      });
    }
    const toggleNodes = Array.from(document.querySelectorAll<HTMLElement>("[class*='mode-selector']")).map((el) => ({
      className: el.className,
      role: el.getAttribute('role'),
      text: (el.textContent || '').trim(),
      outerHTML: el.outerHTML.slice(0, 400),
    }));
    return { matches: results, toggles: toggleNodes };
  });

  log.info('Found %d elements mentioning note trigger', matches.length);
  for (const match of matches) {
    log.info('%o', match);
  }
  log.info('Mode selector nodes: %d', toggles.length);
  for (const toggle of toggles) {
    log.info('%o', toggle);
  }

  await browser.close();
}

main().catch((err) => {
  log.error('Failed to debug internal note toggle', err);
  process.exitCode = 1;
});


