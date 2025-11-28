import { chromium, Page, BrowserContext, Frame, Response } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { env } from '../config/env';
import { LoginPage } from '../pages/LoginPage';
import { createLogger, setLogContext } from '../lib/logger';

type CliFlags = {
  seeds?: string[];
  maxDepth?: number;
  include?: string[];
  exclude?: string[];
  headless?: boolean;
  delayMs?: number;
  crawlId?: string;
  retryCount?: number;
  throttleMs?: number;
  screenshots?: boolean;
};

type CrawlNode = {
  url: string;
  depth: number;
  status: 'pending' | 'skipped' | 'success' | 'error';
  statusCode?: number;
  parent?: string;
  linkText?: string;
  discoveredAt: string;
  lastVisitedAt?: string;
  error?: string;
  children: string[];
  domHash?: string;
  previousDomHash?: string;
  diffStatus?: 'new' | 'changed' | 'unchanged';
  lastDiffAt?: string;
  responseHeaders?: HeaderEntry[];
  frameTree?: FrameSnapshot;
  authContext?: AuthContextSnapshot;
  screenshotPath?: string;
  metrics?: {
    durationMs: number;
    attempts: number;
  };
  redirectedTo?: string;
  discoveredLinks?: DiscoveredLink[];
};

type CrawlRecord = {
  crawlId: string;
  startedAt: string;
  updatedAt: string;
  baseUrl: string;
  nodes: Record<string, CrawlNode>;
  edges: CrawlEdge[];
};

type CrawlGraphFile = {
  lastCrawlId?: string;
  crawls: Record<string, CrawlRecord>;
};

type QueueEntry = {
  url: string;
  depth: number;
  parent?: string;
  viaText?: string;
  discoveredAt?: string;
  sourceFrame?: string;
};

type FrontierEntry = {
  queue: QueueEntry[];
  enqueued: string[];
  visited?: string[];
  updatedAt?: string;
};

type FrontierFile = {
  crawls: Record<string, FrontierEntry>;
};

type HeaderEntry = {
  name: string;
  value: string;
};

type FrameSnapshot = {
  url: string | null;
  name?: string | null;
  childCount: number;
  children: FrameSnapshot[];
};

type AuthContextSnapshot = {
  cookies: Array<{
    name: string;
    domain: string;
    path: string;
    expires: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite?: string;
    valueDigest: string;
  }>;
  origins: Array<{
    origin: string;
    localStorageKeys: string[];
  }>;
};

type RawLinkCandidate = {
  href: string;
  text?: string;
  title?: string;
  rel?: string;
  dataTestId?: string;
  target?: string | null;
  outerHtml?: string;
  frameUrl?: string;
  frameName?: string;
};

type DiscoveredLink = {
  url: string;
  text?: string;
  title?: string;
  rel?: string;
  dataTestId?: string;
  target?: string | null;
  frameUrl?: string;
  frameName?: string;
  discoveredAt: string;
  outerHtmlSnippet?: string;
};

type CrawlEdge = {
  from: string;
  to: string;
  viaText?: string;
  via?: 'anchor' | 'frame' | 'manual' | 'unknown';
  discoveredAt: string;
  frameUrl?: string;
};

const log = createLogger('crawl');

function parseArgs(): CliFlags {
  const flags: CliFlags = {};
  const args = process.argv.slice(2);
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
    const normalizedKey = key.trim().toLowerCase();
    switch (normalizedKey) {
      case 'seed':
      case 'seeds':
        flags.seeds = flags.seeds || [];
        flags.seeds.push(value);
        break;
      case 'max-depth':
      case 'depth':
        flags.maxDepth = Number(value);
        break;
      case 'include':
        flags.include = flags.include || [];
        flags.include.push(value);
        break;
      case 'exclude':
        flags.exclude = flags.exclude || [];
        flags.exclude.push(value);
        break;
      case 'headless':
        flags.headless = value !== 'false';
        break;
      case 'delay':
      case 'delayms':
        flags.delayMs = Number(value);
        break;
      case 'crawl-id':
      case 'crawl':
        flags.crawlId = value;
        break;
      case 'retry':
      case 'retries':
        flags.retryCount = Number(value);
        break;
      case 'throttle':
      case 'throttle-ms':
        flags.throttleMs = Number(value);
        break;
      case 'screenshots':
      case 'screenshot':
        flags.screenshots = value !== 'false';
        break;
      default:
        log.warn(`Unknown flag ignored: --${key}`);
    }
  }
  return flags;
}

const normalize = (value?: string | null): string | undefined => {
  const trimmed = (value || '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

function ensureArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function canonicalize(rawUrl: string, baseUrl: string, origin: string): string | null {
  try {
    const resolved = new URL(rawUrl, baseUrl);
    if (resolved.origin !== origin) return null;
    const pathname = resolved.pathname.replace(/\/+$/, '') || '/';
    return `${resolved.origin}${pathname}${resolved.search}`;
  } catch {
    return null;
  }
}

function regexpList(values: string[] | undefined): RegExp[] {
  return ensureArray(values).map((pattern) => {
    try {
      return new RegExp(pattern);
    } catch {
      log.warn(`Invalid regex ignored: ${pattern}`);
      return /.*/;
    }
  });
}

async function readGraph(graphPath: string): Promise<CrawlGraphFile> {
  try {
    const content = await fs.readFile(graphPath, 'utf8');
    return JSON.parse(content) as CrawlGraphFile;
  } catch {
    return { crawls: {} };
  }
}

async function writeGraph(graphPath: string, data: CrawlGraphFile): Promise<void> {
  await fs.mkdir(path.dirname(graphPath), { recursive: true });
  await fs.writeFile(graphPath, JSON.stringify(data, null, 2), 'utf8');
}

async function readFrontier(frontierPath: string): Promise<FrontierFile> {
  try {
    const raw = await fs.readFile(frontierPath, 'utf8');
    return JSON.parse(raw) as FrontierFile;
  } catch {
    return { crawls: {} };
  }
}

async function writeFrontier(frontierPath: string, data: FrontierFile): Promise<void> {
  await fs.mkdir(path.dirname(frontierPath), { recursive: true });
  await fs.writeFile(frontierPath, JSON.stringify(data, null, 2), 'utf8');
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const flags = parseArgs();
  const baseAgentUrl = env.KAYAKO_AGENT_URL.replace(/\/$/, '');
  const baseOrigin = new URL(baseAgentUrl).origin;
  const headless = flags.headless !== false;
  const maxDepth = Number.isFinite(flags.maxDepth) ? Math.max(0, flags.maxDepth!) : 2;
  const delayMs = Number.isFinite(flags.delayMs) ? Math.max(0, flags.delayMs!) : 250;
  const retryCount = Number.isFinite(flags.retryCount) ? Math.max(1, flags.retryCount!) : 2;
  const throttleMs = Number.isFinite(flags.throttleMs) ? Math.max(0, flags.throttleMs!) : delayMs;
  const seedsInput = ensureArray(flags.seeds).filter((v) => v && v.trim().length > 0);
  const seeds = seedsInput.length > 0 ? seedsInput : [`${baseAgentUrl}/conversations`];
  const includeMatchers = regexpList(flags.include);
  const excludeMatchers = regexpList(flags.exclude);
  const captureScreenshots = flags.screenshots !== false;
  const crawlId =
    normalize(flags.crawlId) ||
    `crawl-${new Date().toISOString().replace(/[:.]/g, '-').toLowerCase()}`;

  setLogContext({ crawlId });
  log.info(
    `Starting crawl`,
    JSON.stringify({
      crawlId,
      seeds,
      maxDepth,
      headless,
    }),
  );

  const graphPath = path.join(process.cwd(), 'storage', 'map', 'graph.json');
  const graphData = await readGraph(graphPath);
  const frontierPath = path.join(process.cwd(), 'storage', 'map', 'frontier.json');
  const frontierData = await readFrontier(frontierPath);
  const existingRecord = graphData.crawls[crawlId];
  const record: CrawlRecord =
    existingRecord || {
      crawlId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      baseUrl: baseAgentUrl,
      nodes: {},
      edges: [],
    };
  record.edges = record.edges || [];
  const nodes = record.nodes;
  const edgeMap = new Map<string, CrawlEdge>();
  for (const edge of record.edges) {
    const key = `${edge.from}→${edge.to}`;
    edgeMap.set(key, {
      ...edge,
      discoveredAt: edge.discoveredAt || record.startedAt,
    });
  }

  const screenshotDir = path.join(process.cwd(), 'storage', 'map', 'screenshots', crawlId);
  if (captureScreenshots) {
    await fs.mkdir(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  const login = new LoginPage(page);
  await login.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);

  const throttler = createThrottler(throttleMs);

  let queue: QueueEntry[] = [];
  const enqueued = new Set<string>();
  const visited = new Set<string>();

  const frontierEntry = frontierData.crawls[crawlId];
  if (frontierEntry && frontierEntry.queue && frontierEntry.queue.length > 0) {
    queue = frontierEntry.queue;
    (frontierEntry.enqueued || []).forEach((url) => enqueued.add(url));
    (frontierEntry.visited || []).forEach((url) => visited.add(url));
    log.info(`Resuming crawl with ${queue.length} queued URLs from frontier.`);
  } else {
    for (const seed of seeds) {
      const canonical = canonicalize(seed, baseAgentUrl, baseOrigin);
      if (!canonical) continue;
      queue.push({ url: canonical, depth: 0, discoveredAt: new Date().toISOString() });
      enqueued.add(canonical);
      if (!nodes[canonical]) {
        nodes[canonical] = {
          url: canonical,
          depth: 0,
          status: 'pending',
          discoveredAt: new Date().toISOString(),
          children: [],
        };
      }
    }
    frontierData.crawls[crawlId] = {
      queue: [...queue],
      enqueued: Array.from(enqueued),
      visited: Array.from(visited),
      updatedAt: new Date().toISOString(),
    };
    await writeFrontier(frontierPath, frontierData);
  }

  async function processNode(entry: QueueEntry): Promise<void> {
    const node = nodes[entry.url] || {
      url: entry.url,
      depth: entry.depth,
      status: 'pending',
      discoveredAt: new Date().toISOString(),
      children: [],
      parent: entry.parent,
    };
    nodes[entry.url] = node;
    node.depth = Math.min(node.depth ?? entry.depth, entry.depth);
    if (entry.viaText && !node.linkText) {
      node.linkText = entry.viaText;
    }
    if (entry.parent) {
      node.parent = entry.parent;
      const parentNode = nodes[entry.parent];
      if (parentNode && !parentNode.children.includes(entry.url)) {
        parentNode.children.push(entry.url);
      }
      const key = `${entry.parent}→${entry.url}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          from: entry.parent,
          to: entry.url,
          viaText: entry.viaText,
          via: entry.sourceFrame ? 'frame' : 'manual',
          discoveredAt: entry.discoveredAt || node.discoveredAt || new Date().toISOString(),
          frameUrl: entry.sourceFrame,
        });
      }
    }
    if (entry.depth > maxDepth) {
      node.status = 'skipped';
      return;
    }
    try {
      await throttler();
      const visitStart = Date.now();
      const visitOutcome = await visitWithRetry(page, entry.url, retryCount);
      const response = visitOutcome.response;
      const visitEnd = Date.now();
      node.status = 'success';
      node.statusCode = response?.status();
      node.redirectedTo = response && response.url() !== entry.url ? response.url() : node.redirectedTo;
      node.lastVisitedAt = new Date().toISOString();
      node.metrics = {
        durationMs: visitEnd - visitStart,
        attempts: visitOutcome.attempts,
      };
      node.responseHeaders = response
        ? Object.entries(response.headers()).map(([name, value]) => ({
            name,
            value,
          }))
        : undefined;
      try {
        node.frameTree = snapshotFrameTree(page);
      } catch (frameErr) {
        log.warn(
          `Frame tree snapshot failed for ${entry.url}: ${
            (frameErr as Error)?.message || frameErr
          }`,
        );
      }
      try {
        node.authContext = await snapshotAuthContext(context);
      } catch (authErr) {
        log.warn(`Auth context snapshot failed: ${(authErr as Error)?.message || authErr}`);
      }
      const html = await page.content();
      const previousDomHash = node.domHash;
      node.previousDomHash = previousDomHash;
      node.domHash = createHash('sha256').update(html).digest('hex');
      if (!previousDomHash) {
        node.diffStatus = 'new';
      } else if (previousDomHash === node.domHash) {
        node.diffStatus = 'unchanged';
      } else {
        node.diffStatus = 'changed';
        node.lastDiffAt = node.lastVisitedAt;
      }

      const links = await extractLinks(page);
      const nodeLinks: DiscoveredLink[] = [];
      node.discoveredLinks = nodeLinks;
      const nextDepth = entry.depth + 1;
      const discoveredAt = new Date().toISOString();
      for (const link of links) {
        const canonical = canonicalize(link.href, entry.url, baseOrigin);
        if (!canonical) continue;
        if (!passesFilters(canonical, includeMatchers, excludeMatchers)) continue;
        const parentNode = nodes[entry.url];
        if (parentNode && !parentNode.children.includes(canonical)) {
          parentNode.children.push(canonical);
        }
        const edgeKey = `${entry.url}→${canonical}`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            from: entry.url,
            to: canonical,
            viaText: link.text,
            via: link.frameUrl && link.frameUrl !== entry.url ? 'frame' : 'anchor',
            discoveredAt,
            frameUrl: link.frameUrl,
          });
        }
        nodeLinks.push({
          url: canonical,
          text: link.text,
          title: link.title,
          rel: link.rel,
          dataTestId: link.dataTestId,
          target: link.target ?? undefined,
          frameUrl: link.frameUrl,
          frameName: link.frameName,
          discoveredAt,
          outerHtmlSnippet: link.outerHtml,
        });
        if (!nodes[canonical]) {
          nodes[canonical] = {
            url: canonical,
            depth: nextDepth,
            status: 'pending',
            discoveredAt: new Date().toISOString(),
            parent: entry.url,
            children: [],
            linkText: link.text,
          };
        } else if (link.text && !nodes[canonical].linkText) {
          nodes[canonical].linkText = link.text;
        }
        if (!enqueued.has(canonical)) {
          queue.push({
            url: canonical,
            depth: nextDepth,
            parent: entry.url,
            viaText: link.text,
            discoveredAt,
            sourceFrame: link.frameUrl,
          });
          enqueued.add(canonical);
        }
      }
      if (captureScreenshots) {
        const screenshotPath = await captureNodeScreenshot(page, screenshotDir, crawlId, entry.url);
        if (screenshotPath) {
          node.screenshotPath = screenshotPath;
        }
      }
      log.info(
        `Node captured`,
        JSON.stringify({
          url: entry.url,
          statusCode: node.statusCode,
          links: node.discoveredLinks?.length ?? 0,
          diff: node.diffStatus,
          screenshot: !!node.screenshotPath,
        }),
      );
    } catch (error: any) {
      node.status = 'error';
      node.error = error?.message || String(error);
      log.warn(`Failed to crawl ${entry.url}: ${node.error}`);
    }
    await wait(delayMs);
  }

  while (queue.length > 0) {
    const entry = queue.shift()!;
    if (visited.has(entry.url)) {
      log.info(`Skipping already-visited node`, entry.url);
      frontierData.crawls[crawlId] = {
        queue: queue.map((item) => ({ ...item })),
        enqueued: Array.from(enqueued),
        visited: Array.from(visited),
        updatedAt: new Date().toISOString(),
      };
      await writeFrontier(frontierPath, frontierData);
      continue;
    }
    visited.add(entry.url);
    log.info(`Visiting depth=${entry.depth}`, entry.url);
    await processNode(entry);
    frontierData.crawls[crawlId] = {
      queue: queue.map((item) => ({ ...item })),
      enqueued: Array.from(enqueued),
      visited: Array.from(visited),
      updatedAt: new Date().toISOString(),
    };
    await writeFrontier(frontierPath, frontierData);
  }

  record.updatedAt = new Date().toISOString();
  record.edges = Array.from(edgeMap.values());
  graphData.crawls[crawlId] = record;
  graphData.lastCrawlId = crawlId;
  await writeGraph(graphPath, graphData);
  delete frontierData.crawls[crawlId];
  await writeFrontier(frontierPath, frontierData);

  const nodesDir = path.join(process.cwd(), 'storage', 'map', 'nodes');
  await fs.mkdir(nodesDir, { recursive: true });
  await fs.writeFile(
    path.join(nodesDir, `${crawlId}.json`),
    JSON.stringify(record.nodes, null, 2),
    'utf8',
  );

  log.info(
    `Crawl complete`,
    JSON.stringify({
      crawlId,
      visited: visited.size,
      totalNodes: Object.keys(nodes).length,
      edges: record.edges.length,
    }),
  );

  await browser.close();
}

async function extractLinks(page: Page): Promise<RawLinkCandidate[]> {
  const frames = page.frames();
  const collected: RawLinkCandidate[] = [];
  for (const frame of frames) {
    try {
      const links = await frame.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).map((anchor) => ({
          href: anchor.getAttribute('href') || '',
          text: (anchor.textContent || '').trim() || undefined,
          title: anchor.getAttribute('title') || undefined,
          rel: anchor.getAttribute('rel') || undefined,
          dataTestId:
            anchor.getAttribute('data-testid') ||
            anchor.getAttribute('data-test-id') ||
            anchor.getAttribute('data-test') ||
            undefined,
          target: anchor.getAttribute('target'),
          outerHtml: anchor.outerHTML.slice(0, 200),
        })),
      );
      links
        .filter((link) => !!link.href)
        .forEach((link) =>
          collected.push({
            ...link,
            frameUrl: frame.url() || undefined,
            frameName: frame.name() || undefined,
          }),
        );
    } catch (error) {
      log.warn(
        `Skipping frame link extraction (${frame.url() || 'unknown'}): ${
          (error as Error)?.message || error
        }`,
      );
    }
  }
  return collected;
}

function passesFilters(url: string, include: RegExp[], exclude: RegExp[]): boolean {
  if (exclude.length > 0 && exclude.some((re) => re.test(url))) return false;
  if (include.length === 0) return true;
  return include.some((re) => re.test(url));
}

async function captureNodeScreenshot(
  page: Page,
  screenshotDir: string,
  crawlId: string,
  url: string,
): Promise<string | undefined> {
  try {
    const slug = slugifyUrl(url);
    const fileName = `${crawlId}_${slug}.png`;
    const target = path.join(screenshotDir, fileName);
    await page.screenshot({ path: target, fullPage: true });
    return target;
  } catch (error) {
    log.warn(`Screenshot failed for ${url}: ${(error as Error)?.message || error}`);
    return undefined;
  }
}

function slugifyUrl(url: string): string {
  const normalized = url.replace(/^https?:\/\//, '');
  const safe = normalized.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'page';
  const hash = createHash('md5').update(url).digest('hex').slice(0, 8);
  return `${safe}_${hash}`;
}

function createThrottler(minIntervalMs: number): () => Promise<void> {
  if (minIntervalMs <= 0) {
    return async () => undefined;
  }
  let lastInvocation = 0;
  return async () => {
    const now = Date.now();
    const waitDuration = Math.max(0, lastInvocation + minIntervalMs - now);
    if (waitDuration > 0) {
      await wait(waitDuration);
    }
    lastInvocation = Date.now();
  };
}

function snapshotFrameTree(page: Page): FrameSnapshot {
  return snapshotFrame(page.mainFrame());
}

function snapshotFrame(frame: Frame): FrameSnapshot {
  const children = frame.childFrames().map((child) => snapshotFrame(child));
  return {
    url: frame.url() || null,
    name: frame.name() || undefined,
    childCount: children.length,
    children,
  };
}

async function snapshotAuthContext(context: BrowserContext): Promise<AuthContextSnapshot> {
  const state = await context.storageState();
  const cookies = state.cookies || [];
  const originEntries = state.origins || [];
  return {
    cookies: cookies.map((cookie) => ({
      name: cookie.name,
      domain: cookie.domain,
      path: cookie.path,
      expires: cookie.expires,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      valueDigest: createHash('sha1').update(cookie.value || '').digest('hex').slice(0, 10),
    })),
    origins: originEntries.map((originEntry) => ({
      origin: originEntry.origin,
      localStorageKeys: (originEntry.localStorage || []).map((item) => item.name),
    })),
  };
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Crawl failed', err);
    process.exitCode = 1;
  });
}

async function visitWithRetry(
  page: Page,
  url: string,
  retries: number,
): Promise<{ response: Response | null; attempts: number }> {
  let attempt = 0;
  let lastError: any;
  while (attempt < retries) {
    attempt += 1;
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      return { response, attempts: attempt };
    } catch (err) {
      lastError = err;
      log.warn(`visit attempt ${attempt} failed for ${url}: ${err}`);
      if (attempt >= retries) {
        throw lastError;
      }
      await wait(500 * attempt);
    }
  }
  throw lastError;
}


