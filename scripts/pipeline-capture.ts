import { chromium, Browser, Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { accessSync, constants } from 'fs';
import { createHash } from 'crypto';
import { env } from '../config/env';
import { LoginPage } from '../pages/LoginPage';
import { createLogger, setLogContext } from '../lib/logger';

const log = createLogger('capture-pipeline');

type PipelineFlags = {
  crawlId?: string;
  captureId?: string;
  include?: string[];
  exclude?: string[];
  sections?: string[];
  clicks?: string[];
  headless?: boolean;
  screenshot?: boolean;
  limit?: number;
  output?: string;
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

type ArtifactRegistry = {
  lastCaptureId?: string;
  captures: Record<string, CaptureRunRecord>;
};

type CaptureRunRecord = {
  captureId: string;
  crawlId: string;
  startedAt: string;
  completedAt?: string;
  outputDir: string;
  headless: boolean;
  screenshot: boolean;
  include?: string[];
  exclude?: string[];
  sections: string[];
  clicks: string[];
  urls: Record<string, ArtifactEntry>;
};

type CaptureRunHistory = {
  latest?: string;
  runs: Record<string, CaptureRunSummary>;
};

type CaptureRunSummary = {
  captureId: string;
  crawlId: string;
  startedAt: string;
  completedAt?: string;
  success: number;
  failures: number;
  outputDir: string;
  artifactRegistry: string;
};

type ArtifactEntry = {
  url: string;
  htmlPath: string;
  htmlHash: string;
  sections: Array<{
    id: string;
    selector: string;
    path: string;
    hash: string;
  }>;
  screenshotPath?: string;
  screenshotHash?: string;
  capturedAt: string;
};

type CaptureResult = {
  entry: ArtifactEntry;
  warnings: string[];
};

function ensureArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseFlags(): PipelineFlags {
  const args = process.argv.slice(2);
  const flags: PipelineFlags = {};
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
      case 'crawl':
      case 'crawl-id':
        flags.crawlId = value;
        break;
      case 'capture':
      case 'capture-id':
        flags.captureId = value;
        break;
      case 'include':
        flags.include = flags.include || [];
        flags.include.push(value);
        break;
      case 'exclude':
        flags.exclude = flags.exclude || [];
        flags.exclude.push(value);
        break;
      case 'section':
      case 'sections':
        flags.sections = flags.sections || [];
        flags.sections.push(value);
        break;
      case 'click':
      case 'clicks':
        flags.clicks = flags.clicks || [];
        flags.clicks.push(value);
        break;
      case 'headless':
        flags.headless = value !== 'false';
        break;
      case 'screenshot':
        flags.screenshot = value !== 'false';
        break;
      case 'limit':
        flags.limit = Number(value);
        break;
      case 'output':
        flags.output = value;
        break;
      default:
        log.warn(`Unknown flag ignored: --${key}`);
    }
  }
  return flags;
}

function regexpList(values?: string[]): RegExp[] {
  return ensureArray(values).map((pattern) => {
    try {
      return new RegExp(pattern);
    } catch {
      log.warn(`Invalid regex ignored: ${pattern}`);
      return /.*/;
    }
  });
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

async function readArtifactRegistry(filePath: string): Promise<ArtifactRegistry> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as ArtifactRegistry;
  } catch {
    return { captures: {} };
  }
}

async function writeArtifactRegistry(filePath: string, data: ArtifactRegistry): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function readCaptureRuns(filePath: string): Promise<CaptureRunHistory> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as CaptureRunHistory;
  } catch {
    return { runs: {} };
  }
}

async function writeCaptureRuns(filePath: string, data: CaptureRunHistory): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function slugifyUrl(url: string): string {
  return url.replace(/https?:\/\//, '').replace(/[^\w.-]/g, '_');
}

function sanitizeSectionSlug(selector: string, index: number): string {
  const base =
    selector
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 50) || 'section';
  return `${index + 1}-${base}`;
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function hashFile(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

function toRelative(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

async function captureUrl(
  page: Page,
  url: string,
  options: {
    outputDir: string;
    sections: string[];
    clicks: string[];
    screenshot: boolean;
  },
): Promise<CaptureResult> {
  const warnings: string[] = [];
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);

  for (const selector of options.clicks) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'attached', timeout: 4000 });
      await locator.click({ timeout: 4000 });
      await page.waitForTimeout(200);
    } catch (error) {
      const message = `Custom click failed for ${selector}: ${(error as Error)?.message || error}`;
      warnings.push(message);
      log.warn(message);
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
  }, options.sections);

  await fs.mkdir(options.outputDir, { recursive: true });
  const slug = slugifyUrl(url);
  const htmlPath = path.join(options.outputDir, `${slug}.html`);
  await fs.writeFile(htmlPath, sanitized.full, 'utf8');

  const sectionsMeta: ArtifactEntry['sections'] = [];
  let sectionIndex = 0;
  for (const section of sanitized.sections) {
    if (section.html.length === 0) continue;
    const slugSuffix = sanitizeSectionSlug(section.selector, sectionIndex);
    const sectionPath = path.join(options.outputDir, `${slug}.section-${slugSuffix}.html`);
    const combined = section.html.join('\n\n');
    await fs.writeFile(sectionPath, combined, 'utf8');
    sectionsMeta.push({
      id: slugSuffix,
      selector: section.selector,
      path: toRelative(sectionPath),
      hash: hashString(combined),
    });
    sectionIndex += 1;
  }

  let screenshotPath: string | undefined;
  let screenshotHash: string | undefined;
  if (options.screenshot) {
    screenshotPath = path.join(options.outputDir, `${slug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    screenshotHash = await hashFile(screenshotPath);
  }

  const entry: ArtifactEntry = {
    url,
    htmlPath: toRelative(htmlPath),
    htmlHash: hashString(sanitized.full),
    sections: sectionsMeta,
    screenshotPath: screenshotPath ? toRelative(screenshotPath) : undefined,
    screenshotHash,
    capturedAt: new Date().toISOString(),
  };

  return { entry, warnings };
}

async function main(): Promise<void> {
  const flags = parseFlags();
  const { crawlId, urls } = await readCrawlGraph(flags.crawlId);
  if (urls.length === 0) {
    log.warn(`No URLs available for crawl ${crawlId}`);
    return;
  }

  const includeMatchers = regexpList(flags.include);
  const excludeMatchers = regexpList(flags.exclude);
  const filteredUrls = urls
    .filter((url) => {
      if (excludeMatchers.length > 0 && excludeMatchers.some((re) => re.test(url))) {
        return false;
      }
      if (includeMatchers.length === 0) return true;
      return includeMatchers.some((re) => re.test(url));
    })
    .slice(0, Number.isFinite(flags.limit) && flags.limit! > 0 ? flags.limit : undefined);

  if (filteredUrls.length === 0) {
    log.warn('No URLs remain after include/exclude filters.');
    return;
  }

  const captureId =
    flags.captureId ||
    `capture-${new Date().toISOString().replace(/[:.]/g, '-').toLowerCase()}`;
  const sections =
    flags.sections && flags.sections.length > 0
      ? flags.sections
      : ["[class*='ko-info-bar_item__container_']", "[class*='ko-checkbox__checkboxWrap_']"];
  const clicks = flags.clicks || [];
  const headless = flags.headless !== false;
  const screenshot = flags.screenshot !== false;
  const defaultOutputDir = path.join(
    process.cwd(),
    'artifacts',
    'structure',
    captureId.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
  );
  const requestedOutputDir = flags.output ? path.normalize(flags.output) : defaultOutputDir;
  const outputDir = path.isAbsolute(requestedOutputDir)
    ? requestedOutputDir
    : path.join(process.cwd(), requestedOutputDir);

  setLogContext({ crawlId, flowId: captureId });
  if (process.env.KAYAKO_CRAWL_ID !== crawlId) {
    process.env.KAYAKO_CRAWL_ID = crawlId;
  }
  if (process.env.KAYAKO_FLOW_ID !== captureId) {
    process.env.KAYAKO_FLOW_ID = captureId;
  }

  const artifactPath = path.join(process.cwd(), 'storage', 'map', 'artifacts.json');
  const registry = await readArtifactRegistry(artifactPath);
  const captureRunsPath = path.join(process.cwd(), 'storage', 'map', 'capture-runs.json');
  const captureRuns = await readCaptureRuns(captureRunsPath);

  registry.captures[captureId] = registry.captures[captureId] || {
    captureId,
    crawlId,
    startedAt: new Date().toISOString(),
    outputDir: toRelative(outputDir),
    headless,
    screenshot,
    include: includeMatchers.length > 0 ? flags.include : undefined,
    exclude: excludeMatchers.length > 0 ? flags.exclude : undefined,
    sections,
    clicks,
    urls: {},
  };

  registry.lastCaptureId = captureId;
  await writeArtifactRegistry(artifactPath, registry);
  captureRuns.runs[captureId] = captureRuns.runs[captureId] || {
    captureId,
    crawlId,
    startedAt: registry.captures[captureId].startedAt,
    success: 0,
    failures: 0,
    outputDir: registry.captures[captureId].outputDir,
    artifactRegistry: toRelative(artifactPath),
  };
  captureRuns.latest = captureId;
  await writeCaptureRuns(captureRunsPath, captureRuns);

  log.info(
    `Starting capture`,
    JSON.stringify({
      crawlId,
      captureId,
      urls: filteredUrls.length,
      headless,
      screenshot,
    }),
  );

  const browser: Browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  const login = new LoginPage(page);
  await login.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);

  let successCount = 0;
  let failureCount = 0;
  for (const url of filteredUrls) {
    log.info(`Capturing ${url}`);
    try {
      const { entry, warnings } = await captureUrl(page, url, {
        outputDir,
        sections,
        clicks,
        screenshot,
      });
      registry.captures[captureId].urls[url] = entry;
      registry.lastCaptureId = captureId;
      await writeArtifactRegistry(artifactPath, registry);
      successCount += 1;
      captureRuns.runs[captureId].success = successCount;
      await writeCaptureRuns(captureRunsPath, captureRuns);
      log.info(
        `Captured ${url}`,
        JSON.stringify({
          htmlHash: entry.htmlHash,
          sections: entry.sections.length,
          screenshot: !!entry.screenshotPath,
          warnings: warnings.length,
        }),
      );
    } catch (error) {
      failureCount += 1;
      const message = (error as Error)?.message || String(error);
      log.error(`Failed capturing ${url}: ${message}`);
      captureRuns.runs[captureId].failures = failureCount;
      await writeCaptureRuns(captureRunsPath, captureRuns);
    }
  }

  registry.captures[captureId].completedAt = new Date().toISOString();
  await writeArtifactRegistry(artifactPath, registry);
  captureRuns.runs[captureId].completedAt = registry.captures[captureId].completedAt;
  captureRuns.runs[captureId].success = successCount;
  captureRuns.runs[captureId].failures = failureCount;
  await writeCaptureRuns(captureRunsPath, captureRuns);

  await browser.close();

  log.info(
    `Capture complete`,
    JSON.stringify({
      captureId,
      crawlId,
      success: successCount,
      failures: failureCount,
      outputDir: registry.captures[captureId].outputDir,
      artifactPath: toRelative(artifactPath),
    }),
  );
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Pipeline capture failed', err);
    process.exitCode = 1;
  });
}


