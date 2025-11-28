import { chromium, Browser, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env';
import { LoginPage } from '../pages/LoginPage';
import { createLogger, setLogContext } from '../lib/logger';
import { accessSync, constants } from 'fs';

const log = createLogger('capture');

type CaptureFlags = {
  crawlId?: string;
  url?: string;
  input?: string;
  output?: string;
  headless?: boolean;
  sections?: string[];
  click?: string[];
  screenshot?: boolean;
};

type CrawlGraphFile = {
  lastCrawlId?: string;
  crawls: Record<
    string,
    {
      crawlId: string;
      nodes: Record<
        string,
        {
          url: string;
          status: string;
        }
      >;
    }
  >;
};

function ensureArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseArgs(): CaptureFlags {
  const args = process.argv.slice(2);
  const flags: CaptureFlags = {};
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) continue;
    const eqIdx = token.indexOf('=');
    let key = '';
    let value = '';
    if (eqIdx !== -1) {
      key = token.slice(2, eqIdx);
      value = token.slice(eqIdx + 1);
    } else {
      key = token.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        value = next;
        i++;
      } else {
        value = 'true';
      }
    }
    const normalized = key.toLowerCase();
    switch (normalized) {
      case 'crawl-id':
      case 'crawl':
        flags.crawlId = value;
        break;
      case 'url':
        flags.url = value;
        break;
      case 'input':
        flags.input = value;
        break;
      case 'output':
        flags.output = value;
        break;
      case 'headless':
        flags.headless = value !== 'false';
        break;
      case 'section':
      case 'sections':
        flags.sections = flags.sections || [];
        flags.sections.push(value);
        break;
      case 'click':
        flags.click = flags.click || [];
        flags.click.push(value);
        break;
      case 'screenshot':
        flags.screenshot = value !== 'false';
        break;
      default:
        log.warn(`Unknown flag ignored: --${key}`);
    }
  }
  return flags;
}

async function readCrawlGraph(crawlId?: string): Promise<{ crawlId: string; urls: string[] }> {
  const graphPath = path.join(process.cwd(), 'storage', 'map', 'graph.json');
  let graph: CrawlGraphFile = { crawls: {} };
  try {
    accessSync(graphPath, constants.F_OK);
    const content = await fs.readFile(graphPath, 'utf8');
    graph = JSON.parse(content) as CrawlGraphFile;
  } catch {
    if (!crawlId) {
      throw new Error('No crawl graph found and no crawlId provided. Run crawl-kayako first.');
    }
  }
  const targetId = crawlId || graph.lastCrawlId;
  if (!targetId) {
    throw new Error('No crawl ID available. Run crawl-kayako or specify --crawl-id.');
  }
  const record = graph.crawls[targetId];
  if (!record) {
    throw new Error(`Crawl ID not found in graph: ${targetId}`);
  }
  const urls = Object.values(record.nodes)
    .filter((node) => node.status === 'success')
    .map((node) => node.url)
    .sort();
  return { crawlId: targetId, urls };
}

async function capturePage(
  page: Page,
  targetUrl: string,
  opts: {
    outputDir: string;
    sections?: string[];
    clicks?: string[];
    screenshot?: boolean;
  },
): Promise<void> {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  for (const selector of opts.clicks || []) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'attached', timeout: 4000 });
      await locator.click({ timeout: 4000 });
      await page.waitForTimeout(200);
    } catch (err) {
      log.warn(`Custom click failed for ${selector}: ${(err as Error)?.message || err}`);
    }
  }

  const sanitized = await page.evaluate((selectors: string[]) => {
    const removeBySelector = (...sel: string[]) => {
      sel.forEach((selector) => {
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

    const clean = (html: string) => html.replace(/>\s+</g, '>\n<').trim();

    const sections = selectors.map((selector) => {
      const nodes = Array.from(document.querySelectorAll(selector));
      return {
        selector,
        html: nodes.map((node) => clean(node.outerHTML)),
      };
    });

    return {
      full: clean(document.documentElement.outerHTML),
      sections,
    };
  }, opts.sections || []);

  await fs.mkdir(opts.outputDir, { recursive: true });
  const fileSlug = targetUrl.replace(/https?:\/\//, '').replace(/[^\w.-]/g, '_');
  const fullPath = path.join(opts.outputDir, `${fileSlug}.html`);
  await fs.writeFile(fullPath, sanitized.full, 'utf8');
  log.info(`Saved HTML ${fullPath}`);

  sanitized.sections
    .filter((section) => section.html.length > 0)
    .forEach(async (section, idx) => {
      const slug =
        section.selector
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase()
          .slice(0, 50) || 'section';
      const sectionPath = path.join(opts.outputDir, `${fileSlug}.section-${idx + 1}-${slug}.html`);
      await fs.writeFile(sectionPath, section.html.join('\n\n'), 'utf8');
      log.info(`Saved section ${section.selector} (${section.html.length}) to ${sectionPath}`);
    });

  if (opts.screenshot) {
    const screenshotPath = path.join(opts.outputDir, `${fileSlug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log.info(`Saved screenshot ${screenshotPath}`);
  }
}

async function main(): Promise<void> {
  const flags = parseArgs();
  const headless = flags.headless !== false;
  const screenshot = flags.screenshot !== false;
  const sections = flags.sections || [
    "[class*='ko-info-bar_item__container_']",
    "[class*='ko-checkbox__checkboxWrap_']",
  ];
  const clicks = flags.click || [];

  const { crawlId, urls } = await readCrawlGraph(flags.crawlId);
  if (urls.length === 0) {
    log.warn(`No URLs to capture for crawl ${crawlId}`);
    return;
  }

  setLogContext({ crawlId });

  const browser: Browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  if (process.env.KAYAKO_CRAWL_ID !== crawlId) {
    process.env.KAYAKO_CRAWL_ID = crawlId;
  }

  const login = new LoginPage(page);
  await login.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);

  const outputDir =
    flags.output ||
    path.join(process.cwd(), 'artifacts', 'structure', crawlId.toLowerCase().replace(/[^a-z0-9-]/g, '-'));

  log.info(`Capturing ${urls.length} URL(s) to ${outputDir}`);
  for (const url of urls) {
    try {
      await capturePage(page, url, { outputDir, sections, clicks, screenshot });
    } catch (error) {
      log.error(`Failed capturing ${url}: ${(error as Error).message || error}`);
    }
  }

  await browser.close();
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Capture failed', err);
    process.exitCode = 1;
  });
}


