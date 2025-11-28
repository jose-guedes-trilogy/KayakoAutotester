import fs from 'fs';
import path from 'path';
import { parse } from 'jsonc-parser';
import type { Page, Locator, Frame } from '@playwright/test';
import { createLogger } from '../lib/logger';

const logger = createLogger('selectors');
const SELECTORS_FILE = path.join(process.cwd(), 'selectors', 'selectors.jsonc');

type SelectorsTree = Record<string, Record<string, string[] | string>>;

let cachedSelectors: SelectorsTree | null = null;
let cachedMtimeMs = 0;

function loadSelectors(): SelectorsTree {
  const stat = fs.statSync(SELECTORS_FILE);
  if (!cachedSelectors || stat.mtimeMs !== cachedMtimeMs) {
    const raw = fs.readFileSync(SELECTORS_FILE, 'utf8');
    const data = parse(raw) as SelectorsTree;
    cachedSelectors = data;
    cachedMtimeMs = stat.mtimeMs;
    logger.info('Loaded selectors.jsonc (mtime %d)', cachedMtimeMs);
  }
  return cachedSelectors!;
}

export function getSelectorCandidates(group: string, key: string): string[] {
  const data = loadSelectors();
  const groupObj = data[group];
  if (!groupObj) throw new Error(`Unknown selector group: ${group}`);
  const value = groupObj[key];
  if (!value) throw new Error(`Unknown selector key: ${group}.${key}`);
  return Array.isArray(value) ? value : [value];
}

export async function firstAvailableLocator(
  page: Page,
  group: string,
  key: string,
): Promise<{ locator: Locator; usedSelector: string; fallbackIndex: number }>
{
  // Give the page a moment to render core UI for dynamic apps
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  } catch {
    // ignore – some pages rely on SPA bootstrapping without load events
  }

  const candidates = getSelectorCandidates(group, key);
  const searchContexts: Array<Page | Frame> = [page, ...page.frames()];

  for (let i = 0; i < candidates.length; i++) {
    const selector = candidates[i];
    for (const ctx of searchContexts) {
      const locator = ctx.locator(selector).first();
      try {
        // Prefer a short wait so we don't instantly miss dynamic elements
        await locator.waitFor({ state: 'attached', timeout: 8000 });
        const count = await locator.count();
        if (count > 0) {
          if (i > 0) {
            logger.warn(
              'Fallback used for %s.%s: index=%d selector=%s',
              group,
              key,
              i,
              selector,
            );
          } else {
            logger.debug('Primary selector used for %s.%s: %s', group, key, selector);
          }
          return { locator, usedSelector: selector, fallbackIndex: i };
        }
      } catch (err) {
        logger.warn(
          'Error probing selector for %s.%s in %s: %s (%o)',
          group,
          key,
          ctx === page ? 'main' : 'frame',
          selector,
          err,
        );
      }
    }
  }
  logger.error('No selector candidates matched for %s.%s', group, key);
  throw new Error(`No selector candidates matched for ${group}.${key}`);
}

export async function click(page: Page, group: string, key: string): Promise<void> {
  const { locator, usedSelector, fallbackIndex } = await firstAvailableLocator(page, group, key);
  logger.info('Clicking %s.%s (selector=%s, fallbackIndex=%d)', group, key, usedSelector, fallbackIndex);
  await locator.click();
}

export async function fill(page: Page, group: string, key: string, value: string): Promise<void> {
  const { locator, usedSelector, fallbackIndex } = await firstAvailableLocator(page, group, key);
  logger.info('Filling %s.%s (selector=%s, fallbackIndex=%d)', group, key, usedSelector, fallbackIndex);
  await locator.fill(value);
}

export async function expectVisible(page: Page, group: string, key: string): Promise<void> {
  const { locator, usedSelector, fallbackIndex } = await firstAvailableLocator(page, group, key);
  logger.info('Expect visible %s.%s (selector=%s, fallbackIndex=%d)', group, key, usedSelector, fallbackIndex);
  await locator.waitFor({ state: 'visible' });
}


