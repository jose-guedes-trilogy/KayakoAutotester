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
  // First try standard Playwright click path
  try {
    const { locator, usedSelector, fallbackIndex } = await firstAvailableLocator(page, group, key);
    logger.info('Clicking %s.%s (selector=%s, fallbackIndex=%d)', group, key, usedSelector, fallbackIndex);
    try {
      await locator.click({ timeout: 4000 });
      return;
    } catch (err) {
      logger.warn('Primary click failed for %s.%s (%s). Trying scroll + event dispatch fallback. Error: %o', group, key, usedSelector, err);
    }
    // Fallback: scroll into view and dispatch pointer events manually (some Ember dropdowns need this)
    const handle = await locator.elementHandle().catch(() => null);
    if (!handle) {
      logger.error('Element handle unavailable for %s.%s (%s)', group, key, usedSelector);
      throw new Error(`Unable to click ${group}.${key}: element handle not available`);
    }
    await handle.evaluate((el: Element) => {
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
    });
    await handle.evaluate((el: Element) => {
      const types: Array<keyof DocumentEventMap> = ['pointerdown','mousedown','pointerup','mouseup','click'];
      for (const type of types) {
        const ev = new MouseEvent(type, { bubbles: true, cancelable: true, view: window });
        el.dispatchEvent(ev);
      }
    });
    logger.info('Fallback dispatched pointer events for %s.%s', group, key);
  } catch (outerErr) {
    // Final fallback: direct CSS query in page.evaluate for CSS-like selectors (ignore role= and text= patterns)
    logger.warn('Locator path failed for %s.%s; trying direct CSS query fallback. Error: %o', group, key, outerErr);
    const cssCandidates = getSelectorCandidates(group, key).filter((s) => !s.startsWith('role=') && !s.startsWith('text=') && s.indexOf(':has-text(') === -1);
    for (const cssSel of cssCandidates) {
      const ok = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
        const types: Array<keyof DocumentEventMap> = ['pointerdown','mousedown','pointerup','mouseup','click'];
        for (const type of types) {
          const ev = new MouseEvent(type, { bubbles: true, cancelable: true, view: window });
          el.dispatchEvent(ev);
        }
        return true;
      }, cssSel).catch(() => false);
      if (ok) {
        logger.info('Direct CSS event-dispatch click succeeded for %s.%s using %s', group, key, cssSel);
        return;
      }
    }
    logger.error('All click fallbacks failed for %s.%s', group, key);
    throw outerErr;
  }
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

export async function dispatchClickCss(page: Page, group: string, key: string): Promise<void> {
  const cssCandidates = getSelectorCandidates(group, key).filter((s) => !s.startsWith('role=') && !s.startsWith('text=') && s.indexOf(':has-text(') === -1);
  logger.info('Dispatch-click CSS for %s.%s with %d candidate(s)', group, key, cssCandidates.length);
  for (const cssSel of cssCandidates) {
    const ok = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
      const types: Array<keyof DocumentEventMap> = ['pointerdown','mousedown','pointerup','mouseup','click'];
      for (const type of types) {
        const ev = new MouseEvent(type, { bubbles: true, cancelable: true, view: window });
        el.dispatchEvent(ev);
      }
      return true;
    }, cssSel).catch(() => false);
    if (ok) {
      logger.info('Dispatch-click CSS succeeded for %s.%s using %s', group, key, cssSel);
      return;
    }
  }
  logger.error('Dispatch-click CSS failed for %s.%s - no CSS candidates matched', group, key);
  throw new Error(`Dispatch-click CSS failed for ${group}.${key}`);
}

export async function dispatchClickText(page: Page, text: string): Promise<void> {
  logger.info('Dispatch-click by text: %s', text);
  const ok = await page.evaluate((needle: string) => {
    function visible(el: Element): boolean {
      const s = getComputedStyle(el as HTMLElement);
      const r = (el as HTMLElement).getBoundingClientRect();
      return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
    }
    const all = Array.from(document.querySelectorAll('*'));
    const target = all.find((e) => visible(e) && (e.textContent || '').trim() === needle) as HTMLElement | undefined;
    if (!target) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    for (const type of ['pointerdown','mousedown','pointerup','mouseup','click'] as const) {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
    return true;
  }, text).catch(() => false);
  if (!ok) {
    logger.error('Dispatch-click by text failed: %s', text);
    throw new Error(`Dispatch-click by text failed: ${text}`);
  }
  logger.info('Dispatch-click by text succeeded: %s', text);
}
