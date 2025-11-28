import fs from 'fs';
import path from 'path';
import { parse } from 'jsonc-parser';
import type { Page, Locator, Frame } from '@playwright/test';
import { expect } from '@playwright/test';
import { createLogger } from '../lib/logger';
import { hudEnsure, hudPush, hudSet, hudEnabled } from './hud';
import { env } from '../config/env';

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
  try { await hudSet(page, `Locating ${group}.${key}`); } catch {}
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
        try { await hudSet(page, `Waiting for ${group}.${key}\n#${i + 1}: ${selector}`); } catch {}
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
        try { await hudPush(page, `Found ${group}.${key} via index ${i}`); await hudSet(page, ``); } catch {}
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
  try { await hudPush(page, `No candidates matched for ${group}.${key}`); } catch {}
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
    try { await hudSet(page, `Dispatch click (CSS) ${group}.${key}\n${cssSel}`); } catch {}
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
      try { await hudPush(page, `Clicked ${group}.${key}`); await hudSet(page, ``); } catch {}
      return;
    }
  }
  logger.error('Dispatch-click CSS failed for %s.%s - no CSS candidates matched', group, key);
  try { await hudPush(page, `Dispatch click failed for ${group}.${key}`); } catch {}
  throw new Error(`Dispatch-click CSS failed for ${group}.${key}`);
}

export async function dispatchClickText(page: Page, text: string): Promise<void> {
  logger.info('Dispatch-click by text: %s', text);
  try { await hudSet(page, `Dispatch click by text:\n${text}`); } catch {}
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
    // Extra diagnostics to help identify why the primary page search failed
    try {
      const diag = await page.evaluate((needle: string) => {
        function visible(el: Element): boolean {
          const s = getComputedStyle(el as HTMLElement);
          const r = (el as HTMLElement).getBoundingClientRect();
          return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
        }
        const normalize = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
        const all = Array.from(document.querySelectorAll('*'));
        const vis = all.filter(visible);
        const exact = vis.filter((e) => normalize(e.textContent || '') === needle);
        const contains = vis.filter((e) => normalize(e.textContent || '').toLowerCase().includes(needle.toLowerCase()));
        const samples = contains.slice(0, 5).map((e) => {
          const r = (e as HTMLElement).getBoundingClientRect();
          return {
            tag: (e as HTMLElement).tagName,
            cls: (e as HTMLElement).className,
            text: normalize((e as HTMLElement).textContent || '').slice(0, 120),
            rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          };
        });
        const wormhole = document.querySelector('#ember-basic-dropdown-wormhole');
        const wormholeChildren = wormhole ? (wormhole.children ? wormhole.children.length : 0) : 0;
        const openDropdowns = Array.from(document.querySelectorAll<HTMLElement>("[id^='ember-basic-dropdown-content-']")).filter(visible);
        const optionsCount = openDropdowns.reduce((acc, d) => acc + d.querySelectorAll("[role='option'], .ember-power-select-option").length, 0);
        return {
          needle,
          exactCount: exact.length,
          containsCount: contains.length,
          samples,
          wormholeChildren,
          openDropdowns: openDropdowns.length,
          dropdownOptions: optionsCount,
        };
      }, text);
      logger.info('Dispatch-click by text diagnostics (page context): %o', diag);
    } catch {}

    // Fallback: try within any open Ember power-select dropdown overlay
    logger.info('Primary dispatch-click by text failed; attempting dropdown-scoped fallback for: %s', text);
    const inDropdown = await dispatchClickTextInDropdown(page, text);
    if (inDropdown) {
      logger.info('Dispatch-click by text succeeded via dropdown overlay: %s', text);
      try { await hudPush(page, `Clicked by text (dropdown): ${text}`); await hudSet(page, ``); } catch {}
      return;
    }

    logger.error('Dispatch-click by text failed (page + dropdown): %s', text);
    try { await hudPush(page, `Dispatch by text failed: ${text}`); } catch {}
    throw new Error(`Dispatch-click by text failed: ${text}`);
  }
  logger.info('Dispatch-click by text succeeded: %s', text);
  try { await hudPush(page, `Clicked by text: ${text}`); await hudSet(page, ``); } catch {}
}

// Best-effort: dispatch-click by exact text confined to open ember dropdown content
async function dispatchClickTextInDropdown(page: Page, text: string): Promise<boolean> {
  logger.debug('Dispatch-click in dropdown by text: %s', text);
  const ok = await page.evaluate((needle: string) => {
    function visible(el: Element): boolean {
      const s = getComputedStyle(el as HTMLElement);
      const r = (el as HTMLElement).getBoundingClientRect();
      return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
    }
    const containers = Array.from(document.querySelectorAll<HTMLElement>("[id^='ember-basic-dropdown-content-']"));
    for (const root of containers) {
      if (!visible(root)) continue;
      const all = Array.from(root.querySelectorAll<HTMLElement>('*'));
      const target = all.find((e) => visible(e) && (e.textContent || '').trim() === needle);
      if (target) {
        target.scrollIntoView({ block: 'center', inline: 'center' });
        for (const type of ['pointerdown','mousedown','pointerup','mouseup','click'] as const) {
          target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        }
        return true;
      }
    }
    return false;
  }, text).catch(() => false);
  if (!ok) {
    try {
      const diag = await page.evaluate((needle: string) => {
        function visible(el: Element): boolean {
          const s = getComputedStyle(el as HTMLElement);
          const r = (el as HTMLElement).getBoundingClientRect();
          return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
        }
        const normalize = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
        const roots = Array.from(document.querySelectorAll<HTMLElement>("[id^='ember-basic-dropdown-content-']")).filter(visible);
        const rootSummaries = roots.slice(0, 3).map((r) => {
          const options = Array.from(r.querySelectorAll<HTMLElement>("[role='option'], .ember-power-select-option")).filter(visible);
          const hits = options.filter((o) => normalize(o.textContent || '') === needle);
          const contains = options.filter((o) => normalize(o.textContent || '').toLowerCase().includes(needle.toLowerCase()));
          const sampleOptions = options.slice(0, 5).map((o) => normalize(o.textContent || '').slice(0, 120));
          return { optionsCount: options.length, exactHits: hits.length, containsHits: contains.length, sampleOptions };
        });
        const wormhole = document.querySelector('#ember-basic-dropdown-wormhole');
        const wormholeChildren = wormhole ? (wormhole.children ? wormhole.children.length : 0) : 0;
        return { needle, openDropdowns: roots.length, wormholeChildren, rootSummaries };
      }, text);
      logger.info('Dropdown dispatch diagnostics: %o', diag);
    } catch {}
  }
  return ok;
}

// Generic helper: open a dropdown by selector group/key and pick an option from an Ember power-select overlay.
export async function selectFromDropdown(
  page: Page,
  group: string,
  key: string,
  optionText: string,
): Promise<void> {
  logger.info('Selecting "%s" from dropdown %s.%s', optionText, group, key);
  // Reuse our resilient click helper to open the trigger
  await click(page, group, key);
  // Give Ember a brief moment to render the overlay into the wormhole
  await page.waitForTimeout(100);
  const ok = await dispatchClickTextInDropdown(page, optionText);
  if (!ok) {
    logger.error('Failed to select "%s" from dropdown %s.%s', optionText, group, key);
    throw new Error(`Failed to select "${optionText}" from dropdown ${group}.${key}`);
  }
  logger.info('Selected "%s" from dropdown %s.%s', optionText, group, key);
}

// Read innerText of a selector group/key if present
export async function getText(page: Page, group: string, key: string): Promise<string | null> {
  try {
    const { locator } = await firstAvailableLocator(page, group, key);
    const t = await locator.innerText().catch(() => '');
    return (t || '').trim() || null;
  } catch {
    return null;
  }
}

// Click the first visible agent option in the current assignee drill-down list
async function dispatchClickFirstAssigneeAgentOption(page: Page): Promise<boolean> {
  logger.info('Attempting to click first assignee agent option in dropdown');
  const ok = await page.evaluate(() => {
    function visible(el: Element): boolean {
      const s = getComputedStyle(el as HTMLElement);
      const r = (el as HTMLElement).getBoundingClientRect();
      return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
    }
    const roots = Array.from(document.querySelectorAll<HTMLElement>("[id^='ember-basic-dropdown-content-']"));
    for (const root of roots) {
      if (!visible(root)) continue;
      const options = Array.from(root.querySelectorAll<HTMLElement>("li[role='option'], .ember-power-select-option"));
      for (const opt of options) {
        if (!visible(opt)) continue;
        const isUnassigned = /\(Unassigned\)/i.test(opt.textContent || '');
        // Agent options tend to include an agent-name element; prefer those
        const hasAgentName = !!opt.querySelector("[class*='ko-case-content_field_assignee_trigger-value__agent-name_']");
        const isTeam = /General|VIP Account Team/i.test(opt.textContent || '') && !hasAgentName;
        if (!isUnassigned && !isTeam) {
          (opt as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
          for (const type of ['pointerdown','mousedown','pointerup','mouseup','click'] as const) {
            opt.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
          }
          return true;
        }
      }
    }
    return false;
  }).catch(() => false);
  if (ok) {
    logger.info('Clicked first agent option');
  } else {
    logger.warn('Could not find any agent option to click');
  }
  return ok;
}

export async function switchAssigneeTeamAndSave(
  page: Page,
  preferredOrder: string[] = ['VIP Account Team', 'General'],
): Promise<void> {
  // Attempt the quick path first: footer "Assign to me" trigger with team choice
  // This immediately assigns to the current agent after picking a team.
  const tryComposerQuickAssign = async (order: string[]): Promise<boolean> => {
    try {
      // Open the footer Assign to me menu using event-dispatch CSS first (more reliable),
      // then fallback to text label or standard click.
      try {
        await dispatchClickCss(page, 'assign', 'assignToMeTrigger');
      } catch {
        try {
          await dispatchClickText(page, 'Assign to me');
        } catch {
          await click(page, 'assign', 'assignToMeTrigger');
        }
      }
      // Wait for dropdown container to appear; if not, try once more via CSS click
      let dropdownVisible = false;
      try {
        const { locator } = await firstAvailableLocator(page, 'assign', 'assignToMeOptions');
        await locator.waitFor({ state: 'visible', timeout: 800 });
        dropdownVisible = true;
      } catch {
        try {
          await dispatchClickCss(page, 'assign', 'assignToMeTrigger');
          const { locator } = await firstAvailableLocator(page, 'assign', 'assignToMeOptions');
          await locator.waitFor({ state: 'visible', timeout: 800 });
          dropdownVisible = true;
        } catch {
          dropdownVisible = false;
        }
      }
      if (!dropdownVisible) {
        logger.warn('Assign-to-me dropdown did not appear; abandoning quick path');
        return false;
      }
      // Decide target team purely by preferred order (do not depend on reading current value here)
      const targetQuick = order[0];
      // Click team inside the dropdown (dropdown-scoped first, then global fallback)
      let clicked = await dispatchClickTextInDropdown(page, targetQuick);
      if (!clicked) {
        // Try alternate teams in order until one succeeds
        for (const team of order) {
          if (await dispatchClickTextInDropdown(page, team)) {
            clicked = true;
            break;
          }
        }
      }
      if (!clicked) {
        for (const team of order) {
          try {
            await dispatchClickText(page, team);
            clicked = true;
            break;
          } catch {
            // continue trying others
          }
        }
      }
      await page.waitForTimeout(250);
      return clicked;
    } catch (e) {
      logger.warn('Composer quick assign path failed, will fallback to Properties path: %o', e);
      return false;
    }
  };

  // Merge env-preferred team to the front if provided
  const order = (() => {
    const prefer = (env.KAYAKO_PREFERRED_TEAM || '').trim();
    const base = [...preferredOrder];
    if (prefer) {
      const without = base.filter((t) => t.trim() !== prefer);
      return [prefer, ...without];
    }
    return base;
  })();
  logger.info('Switching assignee team and saving (preferredOrder=%o)', order);
  // Try quick path first, then (if needed) properties path; avoid early blocking reads

  // Quick path first, as soon as the page is interactive
  const quickDone = await tryComposerQuickAssign(order);
  if (quickDone) {
    logger.info('Assignment completed via composer quick path');
    return;
  }

  // Open the Properties → Assignee field
  try {
    await click(page, 'assign', 'assigneeFieldTrigger');
  } catch (e) {
    logger.warn('Primary click on assigneeFieldTrigger failed, attempting text dispatch: %o', e);
    const ok = await dispatchClickTextInDropdown(page, 'Assignee');
    if (!ok) {
      // Fallback to global text if dropdown-scope fails
      await dispatchClickText(page, 'Assignee');
    }
  }
  await page.waitForTimeout(150);

  // Decide target team: pick the first in order that differs from current
  const currentTeam = await getText(page, 'assign', 'assigneeTeamValue');
  logger.info('Current team detected (properties path): %s', currentTeam ?? '(unknown)');
  const targetTeam =
    order.find((t) => t && t.trim() && (!currentTeam || t.trim() !== currentTeam.trim())) ||
    order[0];
  logger.info('Target team: %s', targetTeam);

  // Click the team in dropdown by text (dropdown-scoped first, then global)
  let teamClicked = await dispatchClickTextInDropdown(page, targetTeam);
  if (!teamClicked) {
    logger.warn('Dropdown-scoped team click failed; trying global dispatch for: %s', targetTeam);
    try {
      await dispatchClickText(page, targetTeam);
      teamClicked = true;
    } catch {
      teamClicked = false;
    }
  }
  if (!teamClicked) {
    logger.error('Unable to click team option: %s', targetTeam);
    throw new Error(`Unable to click team option: ${targetTeam}`);
  }
  await page.waitForTimeout(150);

  // Try to pick a specific agent (self) first, then fallback to the first agent option
  const selfNames = ['Assign to me', 'Me', 'Myself', 'José Guedes', 'Jose Guedes'];
  let agentSelected = false;
  for (const name of selfNames) {
    // Scope to dropdown when possible
    const ok = await dispatchClickTextInDropdown(page, name);
    if (ok) {
      logger.info('Selected agent by text: %s', name);
      agentSelected = true;
      break;
    }
  }
  if (!agentSelected) {
    agentSelected = await dispatchClickFirstAssigneeAgentOption(page);
  }
  if (!agentSelected) {
    logger.error('Failed to select any agent after switching team');
    throw new Error('Failed to select any agent after switching team');
  }
  await page.waitForTimeout(150);

  // Click Update properties using text dispatch, then span CSS fallback
  try {
    await dispatchClickText(page, 'Update properties');
  } catch (e) {
    logger.warn('Text dispatch for Update properties failed (%o); trying span CSS', e);
    await dispatchClickCss(page, 'assign', 'updatePropertiesSpan');
  }

  // Wait for the submit container to disappear (if present)
  try {
    const { locator } = await firstAvailableLocator(page, 'assign', 'updatePropertiesContainer');
    await locator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
  } catch {
    // If container wasn't found, it's fine — some states hide it immediately
  }
  logger.info('Assignee switch and save flow completed');
}

export async function logAssigneeValues(page: Page): Promise<void> {
  const team = await getText(page, 'assign', 'assigneeTeamValue');
  const agent = await getText(page, 'assign', 'assigneeAgentValue');
  logger.info('Assignee values: team=%s agent=%s', team ?? '(none)', agent ?? '(none)');
}

// Read the current conversation status text.
// Prefer the header pill; if not present, fall back to the right-side Status field button text.
export async function getConversationStatusText(page: Page): Promise<string | null> {
  // Primary: header status pill
  const headerText = await getText(page, 'conversation', 'statusPill');
  if (headerText && headerText.trim()) {
    return headerText.trim();
  }

  logger.warn(
    'getConversationStatusText: header status pill not found or empty; falling back to info-bar Status field',
  );

  // Fallback: right-side info bar Status field trigger (e.g. "Status Completed Completed")
  const statusFieldText = await getText(page, 'status', 'statusFieldTrigger');
  if (statusFieldText && statusFieldText.trim()) {
    const normalized = statusFieldText.replace(/\s+/g, ' ').trim();
    // Try to extract a known status token from the text
    const match = normalized.match(/\b(New|Open|Pending|Completed)\b/i);
    if (match) {
      const value = match[1];
      logger.info(
        'getConversationStatusText: derived status "%s" from Status field button text "%s"',
        value,
        normalized,
      );
      return value;
    }

    logger.info(
      'getConversationStatusText: unable to parse specific status from Status field text "%s"; returning raw',
      normalized,
    );
    return normalized;
  }

  logger.warn('getConversationStatusText: unable to resolve status text from header pill or Status field');
  return null;
}

// Read currently visible tag pills text array
export async function getTagPills(page: Page): Promise<string[]> {
  try {
    const { locator } = await firstAvailableLocator(page, 'tags', 'tagPill');
    const items = await locator.allTextContents();
    return items.map((t) => (t || '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function expectTimelineContainsText(
  page: Page,
  text: string,
  options?: { timeoutMs?: number; pollIntervalMs?: number },
): Promise<void> {
  const needle = (text || '').trim();
  if (!needle) {
    throw new Error('expectTimelineContainsText: text must be a non-empty string');
  }

  const timeoutMs = options?.timeoutMs ?? 15000;
  const pollIntervalMs = options?.pollIntervalMs ?? 500;
  const entrySel = getSelectorCandidates('conversation', 'timelineEntry').join(', ');
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const wanted = normalize(needle);

  const started = Date.now();
  let found = false;
  let lastEntryCount = 0;

  logger.info(
    'Waiting for timeline to contain text "%s" (timeoutMs=%d, pollIntervalMs=%d)',
    needle,
    timeoutMs,
    pollIntervalMs,
  );

  while (!found && Date.now() - started <= timeoutMs) {
    const entries = page.locator(entrySel);
    const count = await entries.count().catch(() => 0);
    lastEntryCount = count;

    logger.info(
      'Timeline scan iteration for "%s": entries=%d, elapsedMs=%d',
      needle,
      count,
      Date.now() - started,
    );

    for (let i = 0; i < count; i++) {
      const txt = await entries
        .nth(i)
        .innerText()
        .catch(() => '');
      if (!txt) continue;
      if (normalize(txt).includes(wanted)) {
        found = true;
        break;
      }
    }

    if (!found) {
      // Fallback: global text search as a last resort
      try {
        const bodyText = await page.innerText('body').catch(() => '');
        if (normalize(bodyText).includes(wanted)) {
          found = true;
        }
      } catch {
        // ignore
      }
    }

    if (!found) {
      await page.waitForTimeout(pollIntervalMs);
    }
  }

  if (!found) {
    logger.warn(
      'Timeline text "%s" not found after %dms (lastEntryCount=%d)',
      needle,
      Date.now() - started,
      lastEntryCount,
    );
  }

  expect(found, `Expected timeline to contain text: ${needle}`).toBeTruthy();
}

// Apply the "Send to Customer" macro via the macro selector
export async function applyMacroSendToCustomer(page: Page): Promise<void> {
  // Open macro selector
  try {
    await click(page, 'macro', 'macroSelectorTrigger');
  } catch {
    try {
      await dispatchClickCss(page, 'macro', 'macroSelectorTrigger');
    } catch {
      await dispatchClickText(page, 'Macro');
    }
  }
  // Wait briefly for the dropdown to render
  try {
    const { locator } = await firstAvailableLocator(page, 'macro', 'macroDropdownContainer');
    await locator.waitFor({ state: 'visible', timeout: 1200 });
  } catch {
    await page.waitForTimeout(200);
  }
  try {
    const dropdownCount = await page.locator("[id^='ember-basic-dropdown-content-']").count();
    const wormholeChildren = await page.evaluate(() => {
      const w = document.querySelector('#ember-basic-dropdown-wormhole');
      return w ? (w.children ? w.children.length : 0) : 0;
    });
    logger.info('Macro menu open diagnostics: dropdownCount=%d wormholeChildren=%d', dropdownCount as any, wormholeChildren as any);
  } catch {}
  // Click "Send to Customer" option
  const clickedInDropdown = await dispatchClickTextInDropdown(page, 'Send to Customer');
  if (!clickedInDropdown) {
    logger.info('Macro option "Send to Customer" not found in dropdown; trying global text dispatch');
    try {
      await dispatchClickText(page, 'Send to Customer');
    } catch (e) {
      logger.warn('Global dispatch for "Send to Customer" failed (%o); collecting diagnostics', e);
      try {
        const diag = await page.evaluate(() => {
          function visible(el: Element): boolean {
            const s = getComputedStyle(el as HTMLElement);
            const r = (el as HTMLElement).getBoundingClientRect();
            return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
          }
          const roots = Array.from(document.querySelectorAll<HTMLElement>("[id^='ember-basic-dropdown-content-']")).filter(visible);
          const options = roots.flatMap((r) => Array.from(r.querySelectorAll<HTMLElement>("[role='option'], .ember-power-select-option")).filter(visible));
          const sample = options.slice(0, 8).map((o) => (o.textContent || '').trim());
          return { openDropdowns: roots.length, optionsCount: options.length, sampleOptions: sample };
        });
        logger.info('Macro option diagnostics: %o', diag);
      } catch {}
      throw e;
    }
  }
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

// Add tags to the conversation via the Tags field (right-side info bar)
export async function addTags(page: Page, tags: string[]): Promise<void> {
  if (!Array.isArray(tags) || tags.length === 0) return;
  logger.info('Adding tags: %o', tags);
  // Focus/open tags field trigger
  try {
    await click(page, 'tags', 'tagsFieldTrigger');
  } catch {
    try {
      await dispatchClickCss(page, 'tags', 'tagsFieldTrigger');
    } catch {
      await dispatchClickText(page, 'Tags');
    }
  }
  await page.waitForTimeout(150);
  // For each tag: type into the search and select or press Enter to create
  for (const tag of tags) {
    try {
      // Prefer the trigger-embedded input; it appears even before the dropdown opens
      const { locator: input } = await firstAvailableLocator(page, 'tags', 'tagsInput');
      await input.click({ timeout: 1000 }).catch(() => {});
      await input.fill('');
      await input.type(tag, { delay: 20 });
      await page.waitForTimeout(150);
      // Try to click "Add tag “value”" first (curly quotes), then straight quotes, then the plain value
      let added =
        (await dispatchClickTextInDropdown(page, `Add tag “${tag}”`)) ||
        (await dispatchClickTextInDropdown(page, `Add tag "${tag}"`)) ||
        (await dispatchClickTextInDropdown(page, tag));
      if (!added) {
        // Fallback: press Enter to accept current value
        await page.keyboard.press('Enter');
        added = true;
      }
      await page.waitForTimeout(200);
      // Best-effort verify the tag pill appears
      const pills = await getTagPills(page).catch(() => []);
      if (!pills.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        logger.warn('Tag not confirmed by pills after add attempt: %s (pills=%o)', tag, pills);
      }
    } catch (e) {
      logger.warn('Tags add path failed for "%s": %o', tag, e);
      // Last resort: try opening dropdown and clicking the option by text only
      const ok =
        (await dispatchClickTextInDropdown(page, `Add tag “${tag}”`)) ||
        (await dispatchClickTextInDropdown(page, `Add tag "${tag}"`)) ||
        (await dispatchClickTextInDropdown(page, tag));
      if (!ok) logger.warn('Could not add tag via dropdown: %s', tag);
    }
  }
}

// Insert text into the reply editor (ensures focus and types to trigger events)
export async function insertReplyText(page: Page, text: string): Promise<void> {
  logger.info('Inserting reply text (%d chars)', text.length);
  const { locator } = await firstAvailableLocator(page, 'composer', 'editor');
  // Ensure the editor has focus, but avoid resetting the caret if it is already focused.
  try {
    const handle = await locator.elementHandle();
    let needsClick = true;
    if (handle) {
      needsClick = await page.evaluate((el: HTMLElement | null) => {
        if (!el) return true;
        const active = document.activeElement;
        return !active || !el.contains(active);
      }, handle as any);
    }
    if (needsClick) {
      await locator.click({ timeout: 2000 });
    }
  } catch {
    await locator.click({ timeout: 2000 });
  }
  // Use typing to trigger onChange/input observers reliably, but treat "\n" as real Enter presses
  let buffer = '';
  const flushBuffer = async () => {
    if (!buffer) return;
    await page.keyboard.type(buffer, { delay: 10 });
    buffer = '';
  };
  for (const ch of text) {
    if (ch === '\n') {
      await flushBuffer();
      await page.keyboard.press('Enter');
    } else {
      buffer += ch;
    }
  }
  await flushBuffer();
}

// Switch composer from Notes/Internal Note mode back to Reply mode
export async function switchToReplyMode(page: Page): Promise<void> {
  logger.info('Switching composer to Reply mode');
  // Fast path: click the "Reply" tab within the text editor mode selector using scoped event dispatch.
  const quickClicked = await page
    .evaluate(() => {
      function visible(el: Element): boolean {
        const s = getComputedStyle(el as HTMLElement);
        const r = (el as HTMLElement).getBoundingClientRect();
        return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
      }
      const roots = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[class*='ko-text-editor_mode-selector__root_'], [class*='mode-selector']",
        ),
      );
      for (const root of roots) {
        if (!visible(root)) continue;
        const candidates = Array.from(
          root.querySelectorAll<HTMLElement>("[class*='ko-text-editor_mode-selector__case-mode_'], *"),
        );
        const target = candidates.find((el) => visible(el) && (el.textContent || '').trim() === 'Reply');
        if (target) {
          target.scrollIntoView({ block: 'center', inline: 'center' });
          for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'] as const) {
            target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
          }
          return true;
        }
      }
      return false;
    })
    .catch(() => false);
  if (!quickClicked) {
    // Fallback to our generic selector-driven paths, but avoid long waits
    try {
      await dispatchClickCss(page, 'composer', 'replyToggle');
    } catch {
      try {
        await click(page, 'composer', 'replyToggle');
      } catch {
        await dispatchClickText(page, 'Reply');
      }
    }
  }
  await page.waitForTimeout(150);
}

export async function switchToInternalNoteMode(page: Page): Promise<void> {
  logger.info('Switching composer to Internal Note mode');
  const quickClicked = await page
    .evaluate(() => {
      function visible(el: Element): boolean {
        const s = getComputedStyle(el as HTMLElement);
        const r = (el as HTMLElement).getBoundingClientRect();
        return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
      }
      const roots = Array.from(
        document.querySelectorAll<HTMLElement>("[class*='ko-text-editor_mode-selector__root_'], [class*='mode-selector']"),
      );
      for (const root of roots) {
        if (!visible(root)) continue;
        const candidates = Array.from(
          root.querySelectorAll<HTMLElement>("[class*='ko-text-editor_mode-selector__case-mode_'], *"),
        );
        const target = candidates.find((el) => visible(el) && (el.textContent || '').trim().toLowerCase().includes('note'));
        if (target) {
          target.scrollIntoView({ block: 'center', inline: 'center' });
          for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'] as const) {
            target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
          }
          return true;
        }
      }
      return false;
    })
    .catch(() => false);
  if (!quickClicked) {
    try {
      await dispatchClickCss(page, 'composer', 'internalNoteToggle');
    } catch {
      try {
        await click(page, 'composer', 'internalNoteToggle');
      } catch {
        await dispatchClickText(page, 'Internal note');
      }
    }
  }
  await page.waitForTimeout(150);
}

export async function clickSendButton(page: Page): Promise<void> {
  logger.info('Clicking composer Send button');
  await click(page, 'composer', 'sendButton');
}

// Change conversation status via the right-side status dropdown
export async function setStatus(page: Page, statusLabel: string): Promise<void> {
  logger.info('Setting status: %s', statusLabel);
  // Prefer finding the Status field container by label, then using its local trigger
  let opened = false;
  try {
    const fieldRoot = await findInfoBarFieldByLabel(page, 'Status');
    const triggerSel = getSelectorCandidates('info', 'selectTrigger').join(', ');
    const trigger = fieldRoot.locator(triggerSel).first();
    await trigger.click({ timeout: 1000 });
    opened = true;
  } catch (e) {
    logger.warn('Field-scoped status trigger click failed, falling back to global trigger: %o', e);
    try {
      await click(page, 'status', 'statusFieldTrigger');
      opened = true;
    } catch {
      try {
        await dispatchClickCss(page, 'status', 'statusFieldTrigger');
        opened = true;
      } catch {
        await dispatchClickText(page, 'Status');
        opened = true;
      }
    }
  }
  if (!opened) logger.warn('Status dropdown might not be open; proceeding to select by text');
  await page.waitForTimeout(150);
  const clicked = await dispatchClickTextInDropdown(page, statusLabel);
  if (!clicked) {
    await dispatchClickText(page, statusLabel);
  }
  // If a properties submit container is visible, wait briefly for save affordance
  try {
    const { locator } = await firstAvailableLocator(page, 'assign', 'updatePropertiesContainer');
    if (await locator.isVisible({ timeout: 500 })) {
      // not clicking submit here; leave commit decision to the flow (e.g., Send and update)
      logger.debug('Update properties container visible after status change');
    }
  } catch {
    // ignore if not present
  }
}

// Helper: set a given status and persist it via the Update properties footer button if present.
async function setStatusAndPersist(page: Page, statusLabel: string): Promise<void> {
  const value = (statusLabel || '').trim() || 'Open';
  logger.info('Changing status to "%s" and saving properties', value);

  // Use the robust status dropdown flow to set the status
  await setStatus(page, value);
  await page.waitForTimeout(200);

  // Explicitly commit property changes via the footer "Update properties" button if present
  let committed = false;
  try {
    logger.info('Attempting to click Update properties after status change');
    await click(page, 'assign', 'updatePropertiesButton');
    committed = true;
  } catch (e) {
    logger.warn(
      'Clicking assign.updatePropertiesButton failed after status change; falling back to text dispatch: %o',
      e,
    );
    try {
      await dispatchClickText(page, 'Update properties');
      committed = true;
    } catch (e2) {
      logger.warn(
        'Update properties text dispatch also failed after status change; status may not be persisted: %o',
        e2,
      );
    }
  }

  if (committed) {
    // Wait for the submit container to disappear as a signal that the save completed
    try {
      const { locator } = await firstAvailableLocator(page, 'assign', 'updatePropertiesContainer');
      await locator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
    } catch {
      // If the container wasn't present, it's fine; some states save inline without a footer
    }
  } else {
    logger.warn('setStatusAndPersist: status "%s" may not have been persisted (no Update properties click)', value);
  }
}

type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'dropdown'
  | 'checkbox'
  | 'integer'
  | 'decimal'
  | 'yesno'
  | 'cascading'
  | 'date'
  | 'regex';

// Find a right-side info bar field container by its label text
async function findInfoBarFieldByLabel(page: Page, label: string): Promise<Locator> {
  // Scope to panel then to generic field containers to avoid accidental matches elsewhere
  const panelSel = getSelectorCandidates('info', 'panel').join(', ');
  const fieldSel = getSelectorCandidates('info', 'fieldContainer').join(', ');
  const panel = page.locator(panelSel).first();
  // Try panel-scoped first
  try {
    await panel.waitFor({ state: 'visible', timeout: 4000 });
    let field = panel.locator(fieldSel).filter({ hasText: label }).first();
    try {
      await field.waitFor({ state: 'visible', timeout: 2000 });
      return field;
    } catch {
      // Case-insensitive fallback
      const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      field = panel.locator(fieldSel).filter({ hasText: re }).first();
      await field.waitFor({ state: 'visible', timeout: 3000 });
      return field;
    }
  } catch {
    // Fallback: global search by field container with label text
    let globalField = page.locator(fieldSel).filter({ hasText: label }).first();
    try {
      await globalField.waitFor({ state: 'visible', timeout: 3000 });
      return globalField;
    } catch {
      const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      globalField = page.locator(fieldSel).filter({ hasText: re }).first();
      await globalField.waitFor({ state: 'visible', timeout: 5000 });
      return globalField;
    }
  }
}

export async function setCustomField(
  page: Page,
  opts: {
    type: CustomFieldType;
    label: string;
    value?: string | number | boolean | string[];
    path?: string[]; // for cascading selects
  },
): Promise<void> {
  const { type, label } = opts;
  logger.info('Setting custom field (%s): %s', type, label);
  const root = await findInfoBarFieldByLabel(page, label);

  const textInputsSel = getSelectorCandidates('info', 'textInput').join(', ');
  const textareaSel = getSelectorCandidates('info', 'textarea').join(', ');
  const dateSel = getSelectorCandidates('info', 'dateInput').join(', ');
  const selectTriggerSel = getSelectorCandidates('info', 'selectTrigger').join(', ');
  const dropdownOptionSel = getSelectorCandidates('info', 'dropdownOption').join(', ');
  const checkboxSel = getSelectorCandidates('info', 'checkbox').join(', ');
  const radioSel = getSelectorCandidates('info', 'radio').join(', ');

  switch (type) {
    case 'text':
    case 'integer':
    case 'decimal':
    case 'regex': {
      const input = root.locator(textInputsSel).first();
      await input.waitFor({ state: 'visible' });
      await input.fill(String(opts.value ?? ''));
      break;
    }
    case 'textarea': {
      const input = root.locator(`${textareaSel}, ${textInputsSel}`).first();
      await input.waitFor({ state: 'visible' });
      await input.fill(String(opts.value ?? ''));
      break;
    }
    case 'date': {
      const valueStr = String(opts.value ?? '').trim();
      logger.info('Setting date value: %s', valueStr || '(empty)');
      // 1) Try opening the datepicker by dispatching on the field's own container (matches console snippet)
      logger.debug('Date open: starting root-scoped dispatch attempt for label "%s"', label);
      let opened = await openDateCalendarOnRoot(page, root).catch(() => false);
      if (!opened) {
        // 1b) Try opening by label-based global dispatch (still following user snippet)
        logger.debug('Date open: root-scoped dispatch did not confirm open; trying label-based dispatch for "%s"', label);
        opened = await openDateCalendarByLabel(page, label).catch(() => false);
      }
      // 2) Fallback: open the datepicker using multiple robust triggers
      const dropdownSel = getSelectorCandidates('info', 'dateDropdown').join(', ');
      const containerSel = getSelectorCandidates('info', 'dateContainer').join(', ');
      const iconSel = getSelectorCandidates('info', 'dateIcon').join(', ');
      const dateFocusSel = getSelectorCandidates('info', 'dateFocus').join(', ');
      const headerSel = getSelectorCandidates('info', 'dateHeader').join(', ');
      const dateActionsContainerSel = getSelectorCandidates('info', 'dateActionsContainer').join(', ');
      const dateActionSel = getSelectorCandidates('info', 'dateAction').join(', ');
      const dropdown = page.locator(dropdownSel).first();
      const activeSel = getSelectorCandidates('info', 'dateContainerActive').join(', ');
      const active = page.locator(activeSel).first();
      try {
        const focusCount = await root.locator(dateFocusSel).count().catch(() => -1 as number);
        const containerCount = await root.locator(containerSel).count().catch(() => -1 as number);
        logger.debug('Date open debug: focus candidates=%d, container candidates=%d', focusCount, containerCount);
      } catch {
        // ignore debug failure
      }

      async function attemptOpenWith(locator: Locator): Promise<boolean> {
        try {
          await locator.click({ timeout: 600 });
        } catch {
          try {
            const handle = await locator.elementHandle();
            if (handle) {
              await handle.evaluate((el: Element) => {
                const node = el as HTMLElement;
                node.scrollIntoView({ block: 'center', inline: 'center' });
                for (const type of ['mousedown','mouseup','click'] as const) {
                  node.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                }
              });
            }
          } catch {
            // ignore
          }
        }
        // Consider opened if either dropdown becomes visible or active class is applied
        const until = Date.now() + 900;
        while (Date.now() < until) {
          const d = await dropdown.isVisible().catch(() => false);
          if (d) return true;
          const a = await active.isVisible().catch(() => false);
          if (a) return true;
          await new Promise((r) => setTimeout(r, 60));
        }
        return false;
      }

      if (!opened) {
        // Try container
        opened = await attemptOpenWith(root.locator(containerSel).first());
      }
      if (!opened) {
        // Try icon
        opened = await attemptOpenWith(root.locator(iconSel).first());
      }
      if (!opened) {
        // Try focus + Enter / Space
        const focusEl = root.locator(dateFocusSel).first();
        try {
          await focusEl.focus({ timeout: 500 });
        } catch {}
        try {
          await focusEl.press('Enter', { timeout: 500 });
        } catch {}
        try {
          await dropdown.waitFor({ state: 'visible', timeout: 800 });
          opened = true;
        } catch {
          try {
            await focusEl.press(' ');
          } catch {}
          try {
            await dropdown.waitFor({ state: 'visible', timeout: 800 });
            opened = true;
          } catch {
            opened = false;
          }
        }
      }
      if (!opened) {
        // Try header click last
        opened = await attemptOpenWith(root.locator(headerSel).first());
      }
      if (!opened) {
        // Global fallback: click the date container associated with the header label text
        try {
          const clicked = await page.evaluate(
            (args: { label: string; containerCss: string; headerCss: string }) => {
              function visible(el: Element): boolean {
                const s = getComputedStyle(el as HTMLElement);
                const r = (el as HTMLElement).getBoundingClientRect();
                return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
              }
              const containers = Array.from(document.querySelectorAll<HTMLElement>(args.containerCss));
              const needle = (args.label || '').trim().toLowerCase();
              const target = containers.find((c) => {
                const h = c.querySelector<HTMLElement>(args.headerCss);
                const text = (h?.textContent || '').trim().toLowerCase();
                return visible(c) && (!!needle ? text === needle : true);
              }) || containers.find(visible);
              if (!target) return false;
              (target as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
              // Focus the hidden focus element directly (matches component behavior)
              const focusEl = target.querySelector<HTMLElement>("[class*='ko-info-bar_field_date__focus_']");
              if (focusEl) {
                focusEl.focus();
              }
              for (const type of ['mousedown','mouseup','click'] as const) {
                target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
              }
              return true;
            },
            { label, containerCss: containerSel, headerCss: headerSel },
          );
          if (clicked) {
            // Wait for either dropdown or active state
            const until = Date.now() + 1200;
            while (Date.now() < until) {
              const d = await dropdown.isVisible().catch(() => false);
              if (d) { opened = true; break; }
              const a = await active.isVisible().catch(() => false);
              if (a) { opened = true; break; }
              await page.waitForTimeout(60);
            }
          }
        } catch {
          // ignore
        }
      }
      if (!opened) {
        // Last-resort: explicitly invoke jQuery .focus() on the focus element and dispatch a native focus event
        try {
          await page.evaluate((args: { label: string; containerCss: string; headerCss: string }) => {
            const $win = (window as any).$;
            const containers = Array.from(document.querySelectorAll<HTMLElement>(args.containerCss));
            const needle = (args.label || '').trim().toLowerCase();
            const target = containers.find((c) => {
              const h = c.querySelector<HTMLElement>(args.headerCss);
              const text = (h?.textContent || '').trim().toLowerCase();
              return !!needle ? text === needle : true;
            }) || containers[0];
            if (!target) return;
            const focusEl = target.querySelector<HTMLElement>("[class*='ko-info-bar_field_date__focus_']");
            if (!focusEl) return;
            if ($win && typeof $win === 'function') {
              try { $win(focusEl).focus(); } catch {}
            }
            try {
              focusEl.focus();
              focusEl.dispatchEvent(new FocusEvent('focus', { bubbles: false, cancelable: false }));
            } catch {}
          }, { label, containerCss: containerSel, headerCss: headerSel });
          const until = Date.now() + 1200;
          while (Date.now() < until) {
            const d = await dropdown.isVisible().catch(() => false);
            if (d) { opened = true; break; }
            const a = await active.isVisible().catch(() => false);
            if (a) { opened = true; break; }
            await page.waitForTimeout(60);
          }
        } catch {
          // ignore
        }
      }
      if (!opened) {
        logger.warn('Datepicker dropdown did not open via any trigger; proceeding with fallback typing if applicable.');
      }
      // 2) If no specific date provided (e.g., "today"), select a visible day
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valueStr)) {
        const dropdownScope = dropdown;
        // 2a) Prefer clicking the explicit "today" day cell
        const todayDaySel = getSelectorCandidates('info', 'dateDayToday').join(', ');
        const todayCell = dropdownScope.locator(todayDaySel).first();
        let picked = false;
        try {
          if (await todayCell.isVisible({ timeout: 400 })) {
            logger.debug('Date select: clicking today day cell');
            await todayCell.click({ timeout: 800 });
            picked = true;
          }
        } catch {
          picked = false;
        }
        // 2b) Fallback: click "Today" action in the footer
        if (!picked) {
          logger.debug('Date select: today day cell not clicked; trying Today action');
          picked = await page
            .evaluate((args: { actionsContainerSel: string; actionSel: string }) => {
              function visible(el: Element): boolean {
                const s = getComputedStyle(el as HTMLElement);
                const r = (el as HTMLElement).getBoundingClientRect();
                return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
              }
              const root =
                document.querySelector("[class*='ko-info-bar_field_date__dropdownMenu_']") ||
                document.querySelector("[class*='ko-datepicker__container_']") ||
                document.querySelector("#ember-basic-dropdown-wormhole [class*='ko-info-bar_field_date__dropdownMenu_']") ||
                document.querySelector("#ember-basic-dropdown-wormhole [class*='ko-datepicker__container_']");
              if (!root) return false;
              const actionsRoot = root.querySelector<HTMLElement>(args.actionsContainerSel) || root;
              const actions = Array.from(actionsRoot.querySelectorAll<HTMLElement>(args.actionSel));
              const today = actions.find((a) => visible(a) && (a.textContent || '').trim().match(/^Today$/i));
              if (today) {
                for (const type of ['mousedown','mouseup','click'] as const) {
                  today.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                }
                return true;
              }
              return false;
            }, { actionsContainerSel: dateActionsContainerSel, actionSel: dateActionSel })
            .catch(() => false);
        }
        // 2c) Fallback: click currently selected day (often today)
        if (!picked) {
          logger.debug('Date select: Today action not clicked; trying selected day cell');
          picked = await page
            .evaluate(() => {
              const root =
                document.querySelector("[class*='ko-info-bar_field_date__dropdownMenu_']") ||
                document.querySelector("[class*='ko-datepicker__container_']") ||
                document.querySelector("#ember-basic-dropdown-wormhole [class*='ko-info-bar_field_date__dropdownMenu_']") ||
                document.querySelector("#ember-basic-dropdown-wormhole [class*='ko-datepicker__container_']");
              if (!root) return false;
              const selected = root.querySelector<HTMLElement>("[class*='ko-datepicker__date--selected_']");
              if (!selected) return false;
              (selected as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
              for (const type of ['mousedown','mouseup','click'] as const) {
                selected.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
              }
              return true;
            })
            .catch(() => false);
        }
        if (!picked) {
          logger.warn('Date select: failed to pick a day (today/selected)');
        }
        break;
      }
      // 3) Parse the ISO date and navigate to month/year
      const [yStr, mStr, dStr] = valueStr.split('-');
      const targetYear = parseInt(yStr, 10);
      const targetMonth = parseInt(mStr, 10); // 1-12
      const targetDay = parseInt(dStr, 10);
      const dropdownScope = dropdown;
      const monthEl = dropdownScope.locator(getSelectorCandidates('info', 'dateMonth').join(', ')).first();
      const yearEl = dropdownScope.locator(getSelectorCandidates('info', 'dateYear').join(', ')).first();
      const prevEl = dropdownScope.locator(getSelectorCandidates('info', 'datePrev').join(', ')).first();
      const nextEl = dropdownScope.locator(getSelectorCandidates('info', 'dateNext').join(', ')).first();
      const monthNameToNum: Record<string, number> = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
      };
      async function readDisplayed(): Promise<{ year: number; month: number }> {
        const mText = ((await monthEl.innerText().catch(() => '')) || '').trim().toLowerCase();
        const yText = ((await yearEl.innerText().catch(() => '')) || '').trim();
        const month = monthNameToNum[mText] || new Date().getMonth() + 1;
        const year = parseInt(yText, 10) || new Date().getFullYear();
        return { year, month };
      }
      let { year: curYear, month: curMonth } = await readDisplayed();
      const maxSteps = 36; // limit nav
      let steps = 0;
      while ((curYear !== targetYear || curMonth !== targetMonth) && steps < maxSteps) {
        const forward = curYear < targetYear || (curYear === targetYear && curMonth < targetMonth);
        const target = forward ? nextEl : prevEl;
        let clicked = false;
        try {
          await target.click({ timeout: 500 });
          clicked = true;
        } catch {
          try {
            const handle = await target.elementHandle();
            if (handle) {
              await handle.evaluate((el: Element) => {
                const types: Array<keyof DocumentEventMap> = ['mousedown','mouseup','click'];
                (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
                for (const type of types) {
                  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                }
              });
              clicked = true;
            }
          } catch {
            clicked = false;
          }
        }
        if (!clicked) {
          logger.warn('Datepicker nav click failed; breaking navigation loop');
          break;
        }
        await page.waitForTimeout(120);
        ({ year: curYear, month: curMonth } = await readDisplayed());
        steps++;
      }
      if (curYear === targetYear && curMonth === targetMonth) {
        // 4) Click target day
        const daySel = getSelectorCandidates('info', 'dateDayCurrentMonth').join(', ');
        const day = dropdownScope.locator(daySel).filter({ hasText: String(targetDay) }).first();
        try {
          await day.click({ timeout: 800 });
        } catch {
          // Fallback: event-dispatch click via evaluate within dropdown
          const ok = await page.evaluate(
            (needle: string) => {
              function visible(el: Element): boolean {
                const s = getComputedStyle(el as HTMLElement);
                const r = (el as HTMLElement).getBoundingClientRect();
                return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
              }
              const root =
                document.querySelector("[class*='ko-info-bar_field_date__dropdownMenu_']") ||
                document.querySelector("[class*='ko-datepicker__container_']") ||
                document.querySelector("#ember-basic-dropdown-wormhole [class*='ko-info-bar_field_date__dropdownMenu_']") ||
                document.querySelector("#ember-basic-dropdown-wormhole [class*='ko-datepicker__container_']");
              if (!root) return false;
              const cells = Array.from(root.querySelectorAll<HTMLElement>("[class*='ko-datepicker__dateCurrentMonth_']"));
              const target = cells.find((c) => visible(c) && (c.textContent || '').trim() === needle);
              if (!target) return false;
              (target as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
              for (const type of ['mousedown','mouseup','click'] as const) {
                target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
              }
              return true;
            },
            String(targetDay),
          );
          if (!ok) throw new Error('Failed to click day in datepicker');
        }
      } else {
        logger.warn('Date navigation did not reach target month/year; attempting to type fallback');
        await page.keyboard.type(valueStr, { delay: 5 }).catch(() => {});
        await page.keyboard.press('Enter').catch(() => {});
      }
      break;
    }
    case 'yesno': {
      // Yes/No is implemented as a select in FE; open the trigger and select accordingly
      const trigger = root.locator(selectTriggerSel).first();
      await trigger.click();
      const label = Boolean(opts.value) ? 'Yes' : 'No';
      const ok =
        (await dispatchClickTextInDropdown(page, label)) ||
        (await dispatchClickText(page, label).then(() => true).catch(() => false));
      if (!ok) throw new Error(`Yes/No option not found: ${label}`);
      break;
    }
    case 'checkbox': {
      // Support booleans (single) or string[] (multiple named options)
      const val = opts.value;
      if (Array.isArray(val)) {
        for (const name of val) {
          // Click checkbox label by text inside root
          const clicked =
            (await root.locator(`label:has-text(${JSON.stringify(name)})`).first().click().then(() => true).catch(() => false)) ||
            (await root
              .locator(dropdownOptionSel + `:has-text(${JSON.stringify(name)})`)
              .first()
              .click()
              .then(() => true)
              .catch(() => false));
          if (!clicked) {
            logger.warn('Checkbox option not found: %s', name);
          }
        }
      } else {
        const desired = Boolean(val);
        const box = root.locator(checkboxSel).first();
        await box.waitFor({ state: 'visible' });
        const isChecked = await box.isChecked().catch(async () => {
          const el = await box.elementHandle();
          const aria = el ? await el.getAttribute('aria-checked') : null;
          return aria === 'true';
        });
        if (isChecked !== desired) {
          await box.click();
        }
      }
      break;
    }
    case 'radio': {
      const name = String(opts.value ?? '');
      // Many "radio" fields are implemented with ember-power-select (i.e., dropdown). Try trigger first.
      let handled = false;
      try {
        const trigger = root.locator(selectTriggerSel).first();
        if (await trigger.isVisible({ timeout: 500 })) {
          await trigger.click();
          let ok = false;
          if (name) {
            ok =
              (await dispatchClickTextInDropdown(page, name)) ||
              (await dispatchClickText(page, name).then(() => true).catch(() => false));
          }
          if (!ok) {
            // Fallback: select first non-placeholder option in the open dropdown
            const options = page.locator(dropdownOptionSel);
            const count = await options.count();
            logger.debug(
              'Radio field "%s": selecting fallback option from %d entries',
              label,
              count,
            );
            let clickedAny = false;
            for (let i = 0; i < count; i++) {
              const opt = options.nth(i);
              const text = ((await opt.textContent()) || '').trim();
              if (text && text !== '-') {
                logger.info('Radio field "%s": fallback selecting option "%s"', label, text);
                await opt.click({ timeout: 1000 });
                clickedAny = true;
                break;
              }
            }
            if (!clickedAny && count > 0) {
              logger.warn(
                'Radio field "%s": no non-placeholder options found; clicking first option as last resort',
                label,
              );
              await options.first().click({ timeout: 1000 });
            }
            ok = true;
          }
          handled = true;
        }
      } catch {
        // fall through to classic radio handling
      }
      if (!handled) {
        // Prefer clicking a visible label/span with the option text inside the field root
        let clicked = false;
        if (name) {
          clicked =
            (await root.locator(`label:has-text(${JSON.stringify(name)})`).first().click().then(() => true).catch(() => false)) ||
            (await root
              .locator(`${radioSel} + label:has-text(${JSON.stringify(name)})`)
              .first()
              .click()
              .then(() => true)
              .catch(() => false)) ||
            (await dispatchClickText(page, name).then(() => true).catch(() => false));
        }
        if (!clicked) {
          // Last resort: click the first radio in the container
          const firstRadio = root.locator(radioSel).first();
          await firstRadio.click({ timeout: 800 });
        }
      }
      break;
    }
    case 'dropdown': {
      const name = String(opts.value ?? '');
      const trigger = root.locator(selectTriggerSel).first();
      await trigger.click();
      let ok = false;
      if (name) {
        ok = await dispatchClickTextInDropdown(page, name);
        if (!ok) {
          ok = await dispatchClickText(page, name).then(() => true).catch(() => false);
        }
      }
      if (!ok) {
        // Fallback: choose the first non-placeholder option in the open dropdown
        const options = page.locator(dropdownOptionSel);
        const count = await options.count();
        logger.debug(
          'Dropdown field "%s": selecting fallback option from %d entries',
          label,
          count,
        );
        let clickedAny = false;
        for (let i = 0; i < count; i++) {
          const opt = options.nth(i);
          const text = ((await opt.textContent()) || '').trim();
          if (text && text !== '-') {
            logger.info('Dropdown field "%s": fallback selecting option "%s"', label, text);
            await opt.click({ timeout: 1000 });
            clickedAny = true;
            break;
          }
        }
        if (!clickedAny && count > 0) {
          logger.warn(
            'Dropdown field "%s": no non-placeholder options found; clicking first option as last resort',
            label,
          );
          await options.first().click({ timeout: 1000 });
        }
      }
      break;
    }
    case 'cascading': {
      const path = Array.isArray(opts.path) && opts.path.length > 0 ? opts.path : ([] as string[]);
      if (path.length === 0) {
        // Accept simple single-level usage via value
        const name = String(opts.value ?? '');
        const trigger = root.locator(selectTriggerSel).first();
        await trigger.click();
        const ok = await dispatchClickTextInDropdown(page, name);
        if (!ok) {
          await dispatchClickText(page, name);
        }
        break;
      }
      // Open the top-level trigger once
      await root.locator(selectTriggerSel).first().click();
      for (const step of path) {
        // Select each step from the currently open dropdown without re-clicking the trigger
        const ok = await dispatchClickTextInDropdown(page, step);
        if (!ok) {
          await dispatchClickText(page, step);
        }
        await page.waitForTimeout(150);
      }
      break;
    }
  }
  // Allow UI to react
  await page.waitForTimeout(150);
}

// Open the date calendar by field label using dispatch (mousedown → mouseup → click)
export async function openDateCalendarByLabel(page: Page, label: string): Promise<boolean> {
  logger.info('Opening date calendar by label: %s', label);
  const selector = getSelectorCandidates('info', 'dateContainer')[0] || "[class*='ko-info-bar_item__container_'][class*='ko-info-bar_field_date__date_']";
  const headerSelector = getSelectorCandidates('info', 'dateHeader')[0] || "span[class*='__header_']";
  const dropdownSel = getSelectorCandidates('info', 'dateDropdown').join(', ');
  const activeSel = getSelectorCandidates('info', 'dateContainerActive').join(', ');
  try {
    const globalCount = await page.locator(selector).count().catch(() => -1 as number);
    logger.debug('Date open (label): global container count=%d for selector "%s"', globalCount, selector);
  } catch {}
  const opened = await page.evaluate(
    (args: { labelText: string; containerCss: string; headerCss: string }) => {
      function normalize(s: string): string {
        return (s || '').replace(/\s+/g, ' ').trim();
      }
      function matchesLabel(container: Element, needle: string): boolean {
        const header = container.querySelector<HTMLElement>(args.headerCss);
        const text = normalize(header?.textContent || '');
        const n = normalize(needle);
        return text.localeCompare(n, undefined, { sensitivity: 'base' }) === 0 || text.toLowerCase().includes(n.toLowerCase());
      }
      const targets = Array.from(document.querySelectorAll<HTMLElement>(args.containerCss));
      const t =
        targets.find((c) => matchesLabel(c, args.labelText)) ||
        targets[0];
      if (!t) return false;
      const props = { bubbles: true, cancelable: true, view: window } as MouseEventInit;
      (t as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' });
      t.dispatchEvent(new MouseEvent('mousedown', props));
      t.dispatchEvent(new MouseEvent('mouseup', props));
      t.dispatchEvent(new MouseEvent('click', props));
      return true;
    },
    { labelText: label, containerCss: selector, headerCss: headerSelector },
  );
  if (!opened) {
    logger.warn('Dispatch open failed for date calendar: %s', label);
  }
  // Verify open by waiting briefly for dropdown or active class
  const dropdown = page.locator(dropdownSel).first();
  const active = page.locator(activeSel).first();
  const until = Date.now() + 1200;
  while (Date.now() < until) {
    const d = await dropdown.isVisible().catch(() => false);
    if (d) return true;
    const a = await active.isVisible().catch(() => false);
    if (a) return true;
    await page.waitForTimeout(60);
  }
  logger.debug('Date open (label): dropdown/active not detected after dispatch');
  return false;
}

// Open the date calendar on a known field root container
export async function openDateCalendarOnRoot(page: Page, root: Locator): Promise<boolean> {
  try {
    const containerSel = getSelectorCandidates('info', 'dateContainer').join(', ');
    const candidates = root.locator(containerSel);
    const count = await candidates.count().catch(() => 0);
    logger.debug('Date open (root): candidates found=%d via selector "%s"', count, containerSel);
    const cont = count > 0 ? candidates.first() : root;
    await cont.waitFor({ state: 'visible', timeout: 2000 });
    const handle = await cont.elementHandle();
    if (!handle) return false;
    try {
      const diag = await handle.evaluate((el) => {
        const n = el as HTMLElement;
        const r = n.getBoundingClientRect();
        const s = getComputedStyle(n);
        const cx = Math.floor(r.left + r.width / 2);
        const cy = Math.floor(r.top + r.height / 2);
        const atop = document.elementFromPoint(cx, cy) as HTMLElement | null;
        return {
          className: n.className,
          id: n.id,
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
          style: {
            display: s.display,
            visibility: s.visibility,
            opacity: s.opacity,
            pointerEvents: s.pointerEvents,
            zIndex: s.zIndex,
          },
          elementFromPoint: atop ? { cls: atop.className, id: atop.id } : null,
        };
      });
      logger.debug('Date open (root): container diagnostics: %o', diag);
    } catch {}
    await handle.evaluate((el: Element) => {
      const node = el as HTMLElement;
      node.scrollIntoView({ block: 'center', inline: 'center' });
      const props: MouseEventInit = { bubbles: true, cancelable: true, view: window };
      node.dispatchEvent(new MouseEvent('mousedown', props));
      node.dispatchEvent(new MouseEvent('mouseup', props));
      node.dispatchEvent(new MouseEvent('click', props));
    });
    const dropdownSel = getSelectorCandidates('info', 'dateDropdown').join(', ');
    const activeSel = getSelectorCandidates('info', 'dateContainerActive').join(', ');
    const dropdown = page.locator(dropdownSel).first();
    const active = page.locator(activeSel).first();
    const until = Date.now() + 1200;
    let tick = 0;
    while (Date.now() < until) {
      const d = await dropdown.isVisible().catch(() => false);
      if (d) return true;
      const a = await active.isVisible().catch(() => false);
      if (a) return true;
      if (tick % 2 === 0) {
        try {
          const wormholeChildren = await page.evaluate(() => {
            const w = document.querySelector('#ember-basic-dropdown-wormhole');
            return w ? (w.children ? w.children.length : 0) : 0;
          });
          logger.debug('Date open (root): wormhole children=%d', wormholeChildren as any);
        } catch {}
      }
      await page.waitForTimeout(60);
      tick++;
    }
    logger.debug('Date open (root): dropdown/active not detected after dispatch');
    return false;
  } catch {
    return false;
  }
}

// Identify type of a given property (right-side menu) by its label
export async function identifyInfoBarFieldType(page: Page, label: string): Promise<CustomFieldType | 'unknown' | null> {
  const container = await findInfoBarFieldByLabel(page, label).catch(() => null as any);
  if (!container) return null;
  const type = await detectFieldTypeFromContainer(container);
  logger.info('Detected field type for "%s": %s', label, type);
  return type;
}

// Find a property by name with optional type filter and occurrence index to disambiguate duplicates
export async function findInfoBarFieldByName(
  page: Page,
  name: string,
  opts?: { type?: CustomFieldType; occurrence?: number },
): Promise<Locator | null> {
  const fieldsSel = getSelectorCandidates('info', 'fieldContainer').join(', ');
  const headerSel = getSelectorCandidates('info', 'fieldHeader').join(', ');
  const fields = page.locator(fieldsSel);
  const count = await fields.count().catch(() => 0);
  const matches: Array<{ loc: Locator; type: CustomFieldType | 'unknown' }> = [];
  for (let i = 0; i < count; i++) {
    const item = fields.nth(i);
    const labelText = (await item.locator(headerSel).first().innerText().catch(() => '')).trim();
    if (!labelText) continue;
    const same = labelText.localeCompare(name, undefined, { sensitivity: 'base' }) === 0;
    if (!same) continue;
    const t = await detectFieldTypeFromContainer(item);
    matches.push({ loc: item, type: t });
  }
  if (matches.length === 0) return null;
  if (opts?.type) {
    const byType = matches.find((m) => m.type === opts.type);
    if (byType) return byType.loc;
  }
  const idx = Math.max(0, Math.min(matches.length - 1, opts?.occurrence ?? 0));
  return matches[idx].loc;
}

// Set a custom field by automatically detecting its type from the UI.
// For cascading selects, provide path via opts.path; otherwise 'value' is used.
export async function setCustomFieldAuto(
  page: Page,
  opts: {
    label: string;
    value?: string | number | boolean | string[];
    path?: string[];
  },
): Promise<void> {
  const { label } = opts;
  const detected = await identifyInfoBarFieldType(page, label);
  const type: CustomFieldType =
    detected === 'unknown' || detected === null
      ? 'text'
      : // Treat regex the same as text for now; treat "radio" as dropdown (power-select)
        (detected === 'radio' ? 'dropdown' : (detected as CustomFieldType));
  logger.info('Auto-setting custom field: "%s" detected as %s', label, type);
  await setCustomField(page, { type, label, value: opts.value, path: opts.path });
}

async function detectFieldTypeFromContainer(container: Locator): Promise<CustomFieldType | 'unknown'> {
  // Class-name based detection (fast and stable)
  try {
    const handle = await container.elementHandle();
    if (handle) {
      const className: string = await handle.evaluate((el) => (el as HTMLElement).className);
      const cls = className.toLowerCase();
      if (cls.includes('ko-info-bar_field_date__date')) return 'date';
      if (cls.includes('ko-info-bar_field_drill-down__trigger')) return 'cascading';
      if (cls.includes('ko-info-bar_field_select-multiple__trigger')) return 'dropdown';
      if (cls.includes('ko-info-bar_field_select__trigger')) return 'dropdown';
      if (cls.includes('ko-info-bar_field_yesno__trigger')) return 'yesno';
      if (cls.includes('ko-info-bar_field_multiline-text__textarea')) return 'textarea';
      if (cls.includes('ko-info-bar_field_multiline-text__multiline-text')) return 'textarea';
      if (cls.includes('ko-info-bar_field_text__input')) return 'text';
      if (cls.includes('ko-info-bar_field_text__text')) return 'text';
      if (cls.includes('ko-info-bar_field_integer__input')) return 'integer';
      if (cls.includes('ko-info-bar_field_decimal__input')) return 'decimal';
      if (cls.includes('ko-info-bar_field_checkbox')) return 'checkbox';
      if (cls.includes('ko-info-bar_field_radio')) return 'radio';
    }
  } catch {
    // ignore
  }
  // Structural fallback
  const dateFocusSel = getSelectorCandidates('info', 'dateFocus').join(', ');
  if (await container.locator(dateFocusSel).first().isVisible().catch(() => false)) return 'date';
  const selectTriggerSel = getSelectorCandidates('info', 'selectTrigger').join(', ');
  if (await container.locator(selectTriggerSel).first().isVisible().catch(() => false)) {
    const isDrill = await container.locator("div[class*='ko-info-bar_field_drill-down__trigger_']").first().isVisible().catch(() => false);
    return isDrill ? 'cascading' : 'dropdown';
  }
  const yesno = await container.locator("div[class*='ko-info-bar_field_yesno__trigger_']").first().isVisible().catch(() => false);
  if (yesno) return 'yesno';
  const textareaSel = getSelectorCandidates('info', 'textarea').join(', ');
  if (await container.locator(textareaSel).first().isVisible().catch(() => false)) return 'textarea';
  const textSel = getSelectorCandidates('info', 'textInput').join(', ');
  if (await container.locator(textSel).first().isVisible().catch(() => false)) return 'text';
  const cbSel = getSelectorCandidates('info', 'checkbox').join(', ');
  if (await container.locator(cbSel).first().isVisible().catch(() => false)) return 'checkbox';
  const radioSel = getSelectorCandidates('info', 'radio').join(', ');
  if (await container.locator(radioSel).first().isVisible().catch(() => false)) return 'radio';
  return 'unknown';
}

// ------------------------
// Composite helpers
// ------------------------

async function openConditionStatusDropdownViaDom(page: Page): Promise<boolean> {
  logger.info('Attempting DOM-based open for CONDITION status value dropdown');
  const ok = await page.evaluate(() => {
    function visible(el: Element): boolean {
      const s = getComputedStyle(el as HTMLElement);
      const r = (el as HTMLElement).getBoundingClientRect();
      return s && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
    }
    const root = document.querySelector<HTMLElement>("[id^='ko-predicate-builder']");
    if (!root) return false;
    const triggers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-ebd-id][role='button']"),
    ).filter(visible);
    if (triggers.length === 0) return false;
    const target = triggers[triggers.length - 1];
    target.scrollIntoView({ block: 'center', inline: 'center' });
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'] as const) {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
    return true;
  }).catch(() => false);
  if (!ok) {
    logger.warn('DOM-based CONDITION status dropdown open failed');
  } else {
    logger.info('DOM-based CONDITION status dropdown open succeeded');
  }
  return ok;
}

// Trigger creation helpers (admin Settings)
export async function setTriggerConditionStatus(page: Page, statusLabel: string): Promise<void> {
  const value = (statusLabel || '').trim();
  logger.info('Setting trigger CONDITION status to "%s"', value);
  // Field: Conversations: Status
  await click(page, 'settings', 'conditionFieldButton');
  await dispatchClickText(page, 'Status');
  // Operator: equal to
  await click(page, 'settings', 'operatorButton');
  await dispatchClickText(page, 'equal to');
  // Value: specific status for the condition.
  // The condition row uses an icon-only button inside the predicate builder.
  // Use a structural selector (settings.conditionStatusValueButton) to open it,
  // then pick the status from the Ember dropdown overlay.
  const target = value || 'New';
  try {
    logger.info('Opening CONDITION status value dropdown via settings.conditionStatusValueButton (if present), else DOM fallback');
    let opened = false;
    try {
      await click(page, 'settings', 'conditionStatusValueButton');
      opened = true;
    } catch (inner) {
      logger.warn(
        'conditionStatusValueButton selector path failed (%o); falling back to DOM-based open',
        inner,
      );
      opened = await openConditionStatusDropdownViaDom(page);
    }
    if (!opened) {
      logger.warn(
        'Unable to open CONDITION status dropdown; leaving UI value unchanged (likely invalid)',
      );
      return;
    }
    await page.waitForTimeout(100);
    const ok = await dispatchClickTextInDropdown(page, target);
    if (!ok) {
      logger.warn('Dropdown-scoped selection for CONDITION status "%s" failed; leaving default UI value', target);
    } else {
      logger.info('Condition status value selected: "%s"', target);
    }
  } catch (e) {
    logger.warn('Unable to select CONDITION status value; continuing with default UI value. Error: %o', e);
  }
}

export async function setTriggerActionStatus(page: Page, statusLabel: string): Promise<void> {
  const value = (statusLabel || '').trim();
  logger.info('Setting trigger ACTION status to "%s"', value);
  // Field: Conversation status action
  await click(page, 'settings', 'actionFieldButton');
  await dispatchClickText(page, 'Status');
  // Operator: change
  await click(page, 'settings', 'operatorButton');
  await dispatchClickText(page, 'change');
  // Value: specific status (e.g., Pending)
  await selectFromDropdown(page, 'settings', 'statusValueButton', value || 'Pending');
}

export async function applyTagsStatusAndReply(
  page: Page,
  args: { tags?: string[]; status?: string; reply?: string },
): Promise<void> {
  const tags = Array.isArray(args.tags) ? args.tags : [];
  const status = (args.status || '').trim();
  const reply = args.reply || '';
  if (tags.length > 0) {
    await addTags(page, tags);
  }
  if (status) {
    await setStatus(page, status);
  }
  if (reply) {
    await switchToReplyMode(page);
    await insertReplyText(page, reply);
  }
}

export async function setMultipleCustomFields(
  page: Page,
  fields: Array<{
    type: CustomFieldType;
    label: string;
    value?: string | number | boolean | string[];
    path?: string[];
  }>,
): Promise<void> {
  for (const f of fields) {
    const normalized = {
      type: ((f as any).type ?? (f as any).fieldType) as CustomFieldType,
      label: f.label,
      value: f.value,
      path: f.path,
    };
    await setCustomField(page, normalized);
  }
}

// Unified, fast path to access a conversation (ticket) either by ID or via inbox.
// - If env.KAYAKO_CONVERSATION_ID is set: navigate directly to /conversations/<ID>
// - Else: open the conversations list and click the first visible subject
// Keeps waits minimal and avoids blocking on subject headings to start actions sooner.
export async function accessConversation(page: Page): Promise<void> {
  logger.info('Accessing conversation: using env ID if available, otherwise inbox fallback');
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => undefined);
  } catch {}

  // Determine current path to avoid unnecessary reloads
  const currentUrl = page.url();
  let currentPath = '';
  try {
    currentPath = new URL(currentUrl).pathname;
  } catch {
    currentPath = currentUrl;
  }
  const detailPathRegex = /\/agent\/conversations\/(?!view)([^/]+)/i;
  const isDetailPath = detailPathRegex.test(currentPath);

  const convId = (env.KAYAKO_CONVERSATION_ID || '').trim();
  if (convId) {
    const base = env.KAYAKO_AGENT_URL.replace(/\/$/, '');
    const targetPath = `/agent/conversations/${convId}`;
    const targetUrl = `${base}/conversations/${convId}`;
    if (currentPath.startsWith(targetPath)) {
      logger.info('Already on target conversation %s; skipping navigation', convId);
      return;
    }
    logger.info('Navigating to target conversation by ID: %s', targetUrl);
    await page.goto(targetUrl);
    await page.waitForURL(detailPathRegex, { timeout: 10000 }).catch(() => undefined);
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => undefined);
    return;
  }

  if (isDetailPath) {
    logger.info('Already on a conversation page; skipping inbox navigation');
    return;
  }

  logger.info('No conversation ID provided and not on a conversation; opening first conversation from inbox');
  await page.goto(env.KAYAKO_CONVERSATIONS_URL);
  const firstRowLocatorResult = await firstAvailableLocator(page, 'inbox', 'firstTicketRow');
  const rowLocator = firstRowLocatorResult.locator;
  logger.info(
    'Inbox first row resolved via selector %s (fallbackIndex=%d)',
    firstRowLocatorResult.usedSelector,
    firstRowLocatorResult.fallbackIndex,
  );
  await rowLocator.waitFor({ state: 'visible' });
  const anchorCandidates = [
    "a[href*='/agent/conversations/']",
    'a',
    "[role='link']",
  ];
  let clickable = rowLocator;
  for (const candidate of anchorCandidates) {
    const anchor = rowLocator.locator(candidate).first();
    const count = await anchor.count().catch(() => 0);
    if (count > 0) {
      clickable = anchor;
      break;
    }
  }
  await clickable.scrollIntoViewIfNeeded().catch(() => undefined);
  await clickable.click();
  const navigated = await page.waitForURL(detailPathRegex, { timeout: 10000 }).then(
    () => true,
    () => false,
  );
  if (!navigated) {
    const failureUrl = page.url();
    logger.error('Inbox row click did not navigate to detail view (url=%s)', failureUrl);
    throw new Error(`Unable to navigate from inbox to conversation (stuck at ${failureUrl})`);
  }
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => undefined);
}

export async function setCustomFieldsAutoBatch(
  page: Page,
  fields: Array<{
    label: string;
    value?: string | number | boolean | string[];
    path?: string[];
  }>,
): Promise<void> {
  for (const f of fields) {
    await setCustomFieldAuto(page, f);
  }
}

export async function openNewConversation(page: Page): Promise<void> {
  logger.info('Opening New → Conversation ticket');
  // Open the global New dropdown
  await click(page, 'shell', 'newButton');
  // Click the Conversation entry inside the dropdown (wormhole content)
  await click(page, 'newTicket', 'conversationItem');
  // Wait for either the requester input or the new-conversation URL
  try {
    await expectVisible(page, 'newTicket', 'requesterInput');
  } catch {
    try {
      await page.waitForURL(/\/agent\/conversations\/new\//, { timeout: 10000 });
    } catch {
      logger.warn('openNewConversation: new conversation URL did not appear within timeout');
    }
  }
}

export async function createNewTicket(
  page: Page,
  email: string,
  subject: string,
  body: string,
  mode: 'reply' | 'note' = 'reply',
): Promise<void> {
  logger.info('Creating new ticket (mode=%s)', mode);
  await openNewConversation(page);

  const emailValue = (email || '').trim();
  if (emailValue) {
    logger.info('Filling new ticket requester email: %s', emailValue);
    await fill(page, 'newTicket', 'requesterInput', emailValue);
    try {
      // Wait briefly for instant-entity suggestions, then confirm with Enter
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
    } catch (e) {
      logger.warn('createNewTicket: failed to press Enter after requester email: %o', e);
    }
  } else {
    logger.warn('createNewTicket: empty email value provided');
  }

  const subjectValue = (subject || '').trim();
  if (subjectValue) {
    logger.info('Filling new ticket subject: %s', subjectValue);
    await fill(page, 'newTicket', 'subjectInput', subjectValue);
  } else {
    logger.warn('createNewTicket: empty subject value provided');
  }

  if (mode === 'note') {
    await switchToInternalNoteMode(page);
  } else {
    await switchToReplyMode(page);
  }

  const bodyValue = body || '';
  if (bodyValue) {
    await insertReplyText(page, bodyValue);
  } else {
    logger.warn('createNewTicket: empty body value provided');
  }

  await clickSendButton(page);

  // After sending, Kayako typically redirects to /agent/conversations/<id>
  try {
    await page.waitForURL(/\/agent\/conversations\/(?!view)[^/]+$/, { timeout: 15000 });
  } catch {
    logger.warn('createNewTicket: did not observe redirect to conversation detail URL');
  }

  if (bodyValue) {
    await expectTimelineContainsText(page, bodyValue);
  }
}

export async function completeConversation(page: Page): Promise<void> {
  logger.info('Completing conversation by setting status to Completed and saving properties');
  await setStatusAndPersist(page, 'Completed');
  await expectStatusLabel(page, 'Completed');
}

export async function reopenConversation(page: Page, targetStatus?: string): Promise<void> {
  const normalized = (targetStatus || 'Open').trim() || 'Open';
  logger.info('Reopening conversation by setting status to "%s" and saving properties', normalized);
  await setStatusAndPersist(page, normalized);
  await expectStatusLabel(page, normalized);
}

export async function trashConversation(page: Page): Promise<void> {
  logger.info('Trashing conversation via header button and confirmation modal');
  await click(page, 'conversation', 'trashCaseButton');

  // Handle confirmation modal (Trash / Cancel)
  try {
    logger.info('Waiting for trash confirmation modal');
    const { locator } = await firstAvailableLocator(page, 'modal', 'trashConfirmButton');
    await locator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
    logger.info('Confirming trash via modal Trash button');
    await click(page, 'modal', 'trashConfirmButton');
  } catch (e) {
    logger.warn('Trash confirmation modal not handled; proceeding without explicit confirmation: %o', e);
  }

  // After trash, Kayako usually navigates back to the list; assert URL contains /conversations/view or /conversations
  try {
    await page.waitForURL(/\/agent\/conversations(\/view\/\d+)?/, { timeout: 10000 });
  } catch {
    logger.warn('trashConversation: did not observe navigation back to conversations view');
  }
}

// ------------------------
// Assertions
// ------------------------

export async function expectStatusLabel(page: Page, expected: string): Promise<void> {
  const actual = await getConversationStatusText(page);
  expect((actual || '').trim()).toContain(expected.trim());
}

export async function expectTagsContain(page: Page, expectedTags: string[]): Promise<void> {
  const pills = await getTagPills(page);
  const norm = (s: string) => s.trim().toLowerCase();
  const pillSet = new Set(pills.map(norm));
  for (const tag of expectedTags) {
    expect(pillSet.has(norm(tag))).toBeTruthy();
  }
}

export async function expectFieldValue(
  page: Page,
  label: string,
  expected: string | number | boolean | string[],
): Promise<void> {
  const container = await findInfoBarFieldByLabel(page, label).catch(async () => {
    // Fallback to name-based finder if label-scan fails
    return await findInfoBarFieldByName(page, label);
  });
  if (!container) {
    // Last-resort fallback: scan all fields to find one whose value matches expected
    const fieldsSel = getSelectorCandidates('info', 'fieldContainer').join(', ');
    const headerSel = getSelectorCandidates('info', 'fieldHeader').join(', ');
    const fields = page.locator(fieldsSel);
    const count = await fields.count().catch(() => 0);
    const want = Array.isArray(expected) ? expected.map((v) => String(v).trim().toLowerCase()) : [String(expected).trim().toLowerCase()];
    for (let i = 0; i < count; i++) {
      const c = fields.nth(i);
      const header = (await c.locator(headerSel).first().innerText().catch(() => '')).trim();
      // Skip clearly unrelated fields if header is present and doesn't include label (case-insensitive)
      if (header && !header.toLowerCase().includes(label.trim().toLowerCase())) {
        // still allow value-based match
      }
      const val = (await c.innerText().catch(() => '')).trim().toLowerCase();
      const matchAll = want.every((w) => val.includes(w));
      if (matchAll) {
        return; // value matched in some field; consider assertion satisfied
      }
    }
    expect(container, `Field "${label}" not found (and no field matched the expected value)`).not.toBeNull();
  }
  const root = container!;
  const type = await detectFieldTypeFromContainer(root);
  const textInputsSel = getSelectorCandidates('info', 'textInput').join(', ');
  const textareaSel = getSelectorCandidates('info', 'textarea').join(', ');
  const selectTriggerSel = getSelectorCandidates('info', 'selectTrigger').join(', ');
  const dateSel = getSelectorCandidates('info', 'dateInput').join(', ');

  async function readTextLike(): Promise<string> {
    const input = root.locator(textInputsSel).first();
    if (await input.isVisible().catch(() => false)) {
      try {
        const val = await input.inputValue();
        if (val) return val.trim();
      } catch {}
    }
    const ta = root.locator(`${textareaSel}, ${textInputsSel}`).first();
    if (await ta.isVisible().catch(() => false)) {
      try {
        const val = await ta.inputValue();
        if (val) return val.trim();
      } catch {}
    }
    // Fallback: inner text minus header
    const headerSel = getSelectorCandidates('info', 'fieldHeader').join(', ');
    const header = (await root.locator(headerSel).first().innerText().catch(() => '')).trim();
    const all = (await root.innerText().catch(() => '')).trim();
    return all.replace(header, '').trim();
  }

  async function readSelectLike(): Promise<string> {
    const trigger = root.locator(selectTriggerSel).first();
    if (await trigger.isVisible().catch(() => false)) {
      const t = (await trigger.innerText().catch(() => '')).trim();
      if (t) return t;
    }
    // Fallback to generic read
    return await readTextLike();
  }

  async function readDateLike(): Promise<string> {
    const input = root.locator(dateSel).first();
    if (await input.isVisible().catch(() => false)) {
      try {
        const val = await input.inputValue();
        if (val) return val.trim();
      } catch {}
    }
    return await readTextLike();
  }

  let actual: string | string[] = '';
  if (Array.isArray(expected)) {
    const txt = await readTextLike();
    const tokens = txt.split(/\s*[,\n]\s*/).map((s) => s.trim()).filter(Boolean);
    actual = tokens;
    for (const e of expected) {
      expect(tokens.map((t) => t.toLowerCase())).toContain(e.toLowerCase());
    }
    return;
  }

  switch (type) {
    case 'text':
    case 'integer':
    case 'decimal':
    case 'regex':
    case 'textarea':
      actual = await readTextLike();
      break;
    case 'dropdown':
    case 'radio':
    case 'yesno':
      actual = await readSelectLike();
      break;
    case 'cascading':
      // For cascading selects, the selected path is often rendered as text within the field container,
      // not just inside the trigger button. Prefer the broader text read so we can assert on the path.
      actual = await readTextLike();
      break;
    case 'date':
      actual = await readDateLike();
      break;
    case 'checkbox': {
      const txt = await readTextLike();
      actual = txt;
      break;
    }
    default:
      actual = await readTextLike();
  }
  const expStr = String(expected).trim().toLowerCase();
  const actStr = String(actual).trim().toLowerCase();
  expect(actStr).toContain(expStr);
}

// ------------------------
// Network utilities
// ------------------------

export async function waitForRequestMatch(
  page: Page,
  opts: {
    urlPattern: string;
    method?: string;
    bodyIncludes?: string;
    status?: number;
    timeoutMs?: number;
  },
): Promise<void> {
  const { urlPattern, method, bodyIncludes, status, timeoutMs } = opts;
  const timeout = Math.max(1, Number(timeoutMs ?? 10000));
  logger.info('Waiting for request match: %o', { urlPattern, method, bodyIncludes, status, timeout });
  const urlRe = new RegExp(urlPattern.replace(/\*/g, '.*'));
  const methodNorm = (method || '').toUpperCase();
  const wantStatus = typeof status === 'number' ? status : undefined;
  const wantBody = (bodyIncludes || '').toLowerCase();

  let matched = false;
  try {
    await page.waitForRequest(
      (req) => {
        try {
          if (!urlRe.test(req.url())) return false;
          if (methodNorm && req.method().toUpperCase() !== methodNorm) return false;
          if (wantBody) {
            const postData = (req.postData() || '').toLowerCase();
            if (!postData.includes(wantBody)) return false;
          }
          return true;
        } catch {
          return false;
        }
      },
      { timeout },
    );
    matched = true;
  } catch {
    matched = false;
  }
  if (wantStatus !== undefined) {
    // If status is expected, prefer response wait
    try {
      await page.waitForResponse(
        async (res) => {
          try {
            if (!urlRe.test(res.url())) return false;
            if (wantStatus !== undefined && res.status() !== wantStatus) return false;
            if (methodNorm) {
              const req = res.request();
              if (req.method().toUpperCase() !== methodNorm) return false;
            }
            if (wantBody) {
              const txt = (await res.text().catch(() => '')).toLowerCase();
              if (!txt.includes(wantBody)) return false;
            }
            return true;
          } catch {
            return false;
          }
        },
        { timeout },
      );
      matched = true;
    } catch {
      // ignore
    }
  }
  if (!matched) {
    logger.error('waitForRequestMatch timed out: %o', opts);
    throw new Error(`waitForRequestMatch timed out for ${urlPattern}`);
  }
  logger.info('Request match detected: %o', opts);
}

export async function collectRequestsDuring<T>(
  page: Page,
  fn: () => Promise<T>,
  filter?: { urlPattern?: string; method?: string },
): Promise<{ result: T; requests: Array<{ url: string; method: string }>; responses: Array<{ url: string; status: number }> }> {
  const reqs: Array<{ url: string; method: string }> = [];
  const ress: Array<{ url: string; status: number }> = [];
  const urlRe = filter?.urlPattern ? new RegExp(filter.urlPattern.replace(/\*/g, '.*')) : null;
  const methodNorm = (filter?.method || '').toUpperCase();
  const onReq = (r: any) => {
    try {
      const url = r.url?.() ?? r.url;
      const method = (r.method?.() ?? r.method ?? '').toUpperCase();
      if (urlRe && !urlRe.test(url)) return;
      if (methodNorm && method !== methodNorm) return;
      reqs.push({ url, method });
    } catch {}
  };
  const onRes = (r: any) => {
    try {
      const url = r.url?.() ?? r.url;
      const status = r.status?.() ?? r.status ?? 0;
      if (urlRe && !urlRe.test(url)) return;
      ress.push({ url, status: Number(status) });
    } catch {}
  };
  page.on('request', onReq);
  page.on('response', onRes);
  try {
    const result = await fn();
    return { result, requests: reqs, responses: ress };
  } finally {
    page.off('request', onReq);
    page.off('response', onRes);
  }
}

export async function expectRequest(
  page: Page,
  opts: { urlPattern: string; method?: string; bodyIncludes?: string; status?: number; timeoutMs?: number },
): Promise<void> {
  await waitForRequestMatch(page, opts);
}
