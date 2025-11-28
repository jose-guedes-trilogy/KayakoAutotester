import { chromium, Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
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
};

type CrawlNode = {
  url: string;
  depth: number;
  status: 'pending' | 'skipped' | 'success' | 'error';
  statusCode?: number;
  parent?: string;
  discoveredAt: string;
  lastVisitedAt?: string;
  error?: string;
  children: string[];
};

type CrawlRecord = {
  crawlId: string;
  startedAt: string;
  updatedAt: string;
  baseUrl: string;
  nodes: Record<string, CrawlNode>;
  edges: Array<{ from: string; to: string }>;
};

type CrawlGraphFile = {
  lastCrawlId?: string;
  crawls: Record<string, CrawlRecord>;
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
  const seedsInput = ensureArray(flags.seeds).filter((v) => v && v.trim().length > 0);
  const seeds = seedsInput.length > 0 ? seedsInput : [`${baseAgentUrl}/conversations`];
  const includeMatchers = regexpList(flags.include);
  const excludeMatchers = regexpList(flags.exclude);
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
  const nodes = record.nodes;
  const edgeSet = new Set(record.edges.map((edge) => `${edge.from}→${edge.to}`));

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  const login = new LoginPage(page);
  await login.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);

  const queue: Array<{ url: string; depth: number; parent?: string }> = [];
  const enqueued = new Set<string>();
  const visited = new Set<string>();

  for (const seed of seeds) {
    const canonical = canonicalize(seed, baseAgentUrl, baseOrigin);
    if (!canonical) continue;
    queue.push({ url: canonical, depth: 0 });
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

  async function processNode(entry: { url: string; depth: number; parent?: string }): Promise<void> {
    const node = nodes[entry.url] || {
      url: entry.url,
      depth: entry.depth,
      status: 'pending',
      discoveredAt: new Date().toISOString(),
      children: [],
      parent: entry.parent,
    };
    nodes[entry.url] = node;
    node.depth = Math.min(node.depth, entry.depth);
    if (entry.parent) {
      node.parent = entry.parent;
      const parentNode = nodes[entry.parent];
      if (parentNode && !parentNode.children.includes(entry.url)) {
        parentNode.children.push(entry.url);
      }
      const key = `${entry.parent}→${entry.url}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
      }
    }
    if (entry.depth > maxDepth) {
      node.status = 'skipped';
      return;
    }
    try {
      const response = await page.goto(entry.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      node.status = 'success';
      node.statusCode = response?.status();
      node.lastVisitedAt = new Date().toISOString();
      const links = await extractLinks(page, baseAgentUrl, baseOrigin);
      const nextDepth = entry.depth + 1;
      for (const href of links) {
        const canonical = canonicalize(href, entry.url, baseOrigin);
        if (!canonical) continue;
        if (!passesFilters(canonical, includeMatchers, excludeMatchers)) continue;
        const parentNode = nodes[entry.url];
        if (parentNode && !parentNode.children.includes(canonical)) {
          parentNode.children.push(canonical);
        }
        const edgeKey = `${entry.url}→${canonical}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
        }
        if (!nodes[canonical]) {
          nodes[canonical] = {
            url: canonical,
            depth: nextDepth,
            status: 'pending',
            discoveredAt: new Date().toISOString(),
            parent: entry.url,
            children: [],
          };
        }
        if (!enqueued.has(canonical)) {
          queue.push({ url: canonical, depth: nextDepth, parent: entry.url });
          enqueued.add(canonical);
        }
      }
    } catch (error: any) {
      node.status = 'error';
      node.error = error?.message || String(error);
      log.warn(`Failed to crawl ${entry.url}: ${node.error}`);
    }
    await wait(delayMs);
  }

  while (queue.length > 0) {
    const entry = queue.shift()!;
    if (visited.has(entry.url)) continue;
    visited.add(entry.url);
    log.info(`Visiting depth=${entry.depth}`, entry.url);
    await processNode(entry);
  }

  record.updatedAt = new Date().toISOString();
  record.edges = Array.from(edgeSet).map((key) => {
    const [from, to] = key.split('→');
    return { from, to };
  });
  graphData.crawls[crawlId] = record;
  graphData.lastCrawlId = crawlId;
  await writeGraph(graphPath, graphData);

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

async function extractLinks(page: Page, baseUrl: string, origin: string): Promise<string[]> {
  const links = await page.$$eval('a[href]', (anchors) =>
    anchors
      .map((a) => {
        const href = a.getAttribute('href');
        if (!href) return null;
        try {
          const resolved = new URL(href, window.location.href);
          return resolved.href;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[],
  );
  return links
    .map((href) => {
      try {
        const url = new URL(href);
        return url.href;
      } catch {
        return null;
      }
    })
    .filter((href): href is string => !!href)
    .filter((href) => {
      try {
        const url = new URL(href, baseUrl);
        return url.origin === origin;
      } catch {
        return false;
      }
    });
}

function passesFilters(url: string, include: RegExp[], exclude: RegExp[]): boolean {
  if (exclude.length > 0 && exclude.some((re) => re.test(url))) return false;
  if (include.length === 0) return true;
  return include.some((re) => re.test(url));
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Crawl failed', err);
    process.exitCode = 1;
  });
}


