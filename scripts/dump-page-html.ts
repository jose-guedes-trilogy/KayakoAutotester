import { chromium, Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

const log = createLogger('dump-html');

type CliArgs = {
  url?: string;
  output?: string;
  headless?: string;
  section?: string | string[];
  click?: string | string[];
};

function ensureArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pushArg(target: CliArgs, key: keyof CliArgs, value: string): void {
  const current = target[key];
  if (current === undefined) {
    (target as Record<string, string | string[]>)[key] = value;
  } else if (Array.isArray(current)) {
    current.push(value);
  } else {
    (target as Record<string, string | string[]>)[key] = [current as string, value];
  }
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) continue;
    const eqIdx = token.indexOf('=');
    if (eqIdx !== -1) {
      const key = token.slice(2, eqIdx) as keyof CliArgs;
      const value = token.slice(eqIdx + 1);
      pushArg(result, key, value);
      continue;
    }
    const key = token.slice(2) as keyof CliArgs;
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      pushArg(result, key, next);
      i++;
    } else {
      pushArg(result, key, 'true');
    }
  }
  return result;
}

function resolveTargetUrl(inputUrl?: string): string {
  if (!inputUrl || !inputUrl.trim()) {
    return `${env.KAYAKO_AGENT_URL.replace(/\/$/, '')}/conversations/view/1`;
  }
  if (/^https?:\/\//i.test(inputUrl)) {
    return inputUrl;
  }
  const base = env.KAYAKO_BASE_URL.replace(/\/$/, '');
  const normalized = inputUrl.startsWith('/') ? inputUrl : `/${inputUrl}`;
  return `${base}${normalized}`;
}

function cleanHtml(html: string): string {
  let result = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  result = result.replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '');
  result = result.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '');
  result = result.replace(/<meta\b[^>]*>/gi, '');
  result = result.replace(/<!--[\s\S]*?-->/g, '');
  result = result.replace(/>\s+</g, '>\n<');
  return result.trim();
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function cleanFragment(fragment: string): string {
  return fragment.replace(/>\s+</g, '>\n<').trim();
}

type SanitizedPayload = {
  full: string;
  sections: Array<{ selector: string; html: string[] }>;
};

async function sanitizeDomHtml(page: Page, sectionSelectors: string[]): Promise<SanitizedPayload> {
  const sanitized = await page.evaluate(({ selectors }) => {
    const removeBySelector = (...selectors: string[]) => {
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => node.remove());
      });
    };

    removeBySelector(
      'script',
      'style',
      'link[rel="stylesheet"]',
      'link[rel*="icon"]',
      'meta',
      'noscript',
      'svg',
      '#kayako-messenger',
      '#kayako-messenger *',
      '#kayako-messenger-frame',
      '#ember-basic-dropdown-wormhole',
    );

    const head = document.head;
    if (head) {
      const keep = new Set(['title', 'base']);
      Array.from(head.children).forEach((child) => {
        const tag = child.tagName?.toLowerCase() ?? '';
        if (!keep.has(tag)) {
          child.remove();
        }
      });
    }

    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof Element)) continue;
      node.removeAttribute('style');
      Array.from(node.attributes).forEach((attr) => {
        if (attr.name.toLowerCase().startsWith('on')) {
          node.removeAttribute(attr.name);
        }
      });
    }

    const sections = selectors.map((selector) => {
      const nodes = Array.from(document.querySelectorAll(selector));
      return {
        selector,
        html: nodes.map((node) => node.outerHTML),
      };
    });

    return {
      full: document.documentElement.outerHTML,
      sections,
    };
  }, { selectors: sectionSelectors });

  return {
    full: cleanHtml(sanitized.full),
    sections: sanitized.sections.map((entry) => ({
      selector: entry.selector,
      html: entry.html.map(cleanFragment),
    })),
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const targetUrl = resolveTargetUrl(args.url);
  const defaultOutput = path.resolve(
    process.cwd(),
    'artifacts',
    'html',
    `dump-${Date.now()}.html`,
  );
  const outputPath = path.resolve(args.output ? args.output : defaultOutput);
  const headless = args.headless !== 'false';
  const clickSelectors = ensureArray(args.click).filter((selector) => selector && selector !== 'true');
  const sectionSelectors = ensureArray(args.section).filter((selector) => selector && selector !== 'true');

  log.info('Launching browser (headless=%s) to capture %s', headless, targetUrl);
  const browser = await chromium.launch({ headless });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const login = new LoginPage(page);

    log.info('Logging in as %s', env.KAYAKO_USERNAME.replace(/@.*/, '@***'));
    await login.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);

    log.info('Navigating to target %s', targetUrl);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      log.warn('networkidle wait timed out; continuing with available DOM');
    }

    for (const selector of clickSelectors) {
      log.info('Executing custom click for selector: %s', selector);
      try {
        const locator = page.locator(selector).first();
        await locator.waitFor({ state: 'attached', timeout: 5000 });
        await locator.click({ timeout: 5000 });
        await page.waitForTimeout(250);
      } catch (err) {
        log.warn('Custom click failed for %s (%o)', selector, err);
      }
    }

    const sanitized = await sanitizeDomHtml(page, sectionSelectors);
    const cleaned = sanitized.full;

    await ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, cleaned, 'utf8');
    log.info('Saved cleaned HTML (%d bytes) to %s', cleaned.length, outputPath);

    if (sanitized.sections.length > 0) {
      const baseName = path.basename(outputPath, path.extname(outputPath));
      const dir = path.dirname(outputPath);
      for (let index = 0; index < sanitized.sections.length; index++) {
        const section = sanitized.sections[index];
        if (section.html.length === 0) continue;
        const slug =
          section.selector
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase()
            .slice(0, 50) || 'section';
        const sectionPath = path.join(dir, `${baseName}.section-${index + 1}-${slug}.html`);
        const content = section.html.join('\n\n');
        await fs.writeFile(sectionPath, content, 'utf8');
        log.info('Saved section (%s) with %d node(s) to %s', section.selector, section.html.length, sectionPath);
      }
    }
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Failed to dump HTML', err);
    process.exitCode = 1;
  });
}


