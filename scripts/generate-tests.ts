import fs from 'fs/promises';
import path from 'path';
import { parse } from 'jsonc-parser';
import { createLogger } from '../lib/logger';
import YAML from 'yaml';

const log = createLogger('generate-tests');
const conversationViewRegex = /\/agent\/conversations\/view\/(\d+)(?:\?page=(\d+))?/i;

type CrawlGraph = {
  crawls: Record<
    string,
    {
      nodes: Record<
        string,
        {
          url: string;
          status: string;
        }
      >;
    }
  >;
  lastCrawlId?: string;
};

type FlowDefinition = {
  name: string;
  description?: string;
  urlPattern?: string;
  tags?: string[];
  steps: Array<Record<string, unknown>>;
};

type SelectorMap = Record<string, Record<string, string | string[]>>;

const SELECTORS_JSONC = path.join(process.cwd(), 'selectors', 'selectors.jsonc');
function extractSelectorKeysFromStep(step: Record<string, unknown>): string[] {
  const keys: string[] = [];
  if (typeof step.selectorKey === 'string') {
    keys.push(step.selectorKey);
  }
  if (Array.isArray(step.selectors)) {
    for (const maybeKey of step.selectors) {
      if (typeof maybeKey === 'string') {
        keys.push(maybeKey);
      }
    }
  }
  return keys;
}

async function readSelectorKeySet(): Promise<Set<string>> {
  const keySet = new Set<string>();
  try {
    const raw = await fs.readFile(SELECTORS_JSONC, 'utf8');
    const data = parse(raw) as SelectorMap;
    for (const [group, entries] of Object.entries(data || {})) {
      for (const key of Object.keys(entries || {})) {
        keySet.add(`${group}.${key}`);
      }
    }
  } catch (error) {
    log.warn(`Unable to read selectors.jsonc for flow validation: ${(error as Error).message}`);
  }
  return keySet;
}

function validateFlows(flows: FlowDefinition[], selectorKeys: Set<string>): void {
  for (const flow of flows) {
    for (const step of flow.steps || []) {
      for (const selectorKey of extractSelectorKeysFromStep(step as Record<string, unknown>)) {
        if (!selectorKeys.has(selectorKey)) {
          log.warn(
            `Template "${flow.name}" references missing selector ${selectorKey}. Add it to selectors/selectors.jsonc or fix the template.`,
          );
        }
      }
    }
  }
}

type GeneratorConfig = {
  crawlId: string;
  flowDir: string;
  outputDir: string;
  defaultFlow?: FlowDefinition;
  visitedUrls: string[];
  composites?: FlowDefinition[];
};

function ensureArray<T>(value?: T | T[]): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseViewIdFilter(value?: string): Set<string> | undefined {
  if (!value || value.trim().length === 0) {
    return new Set(['1']);
  }
  if (value.toLowerCase() === 'all') {
    return undefined;
  }
  const ids = value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return new Set(['1']);
  }
  return new Set(ids);
}

async function readCrawlGraph(crawlId?: string): Promise<{ crawlId: string; urls: string[] }> {
  const graphPath = path.join(process.cwd(), 'storage', 'map', 'graph.json');
  const raw = await fs.readFile(graphPath, 'utf8').catch(() => {
    throw new Error('Crawl graph not found. Run npm run crawl:kayako first.');
  });
  const graph = JSON.parse(raw) as CrawlGraph;
  const target = crawlId || graph.lastCrawlId;
  if (!target) {
    throw new Error('No crawlId provided and lastCrawlId missing in graph.');
  }
  const crawl = graph.crawls[target];
  if (!crawl) {
    throw new Error(`Crawl ID not found: ${target}`);
  }
  const urls = Object.values(crawl.nodes)
    .filter((node) => node.status === 'success')
    .map((node) => node.url)
    .sort();
  return { crawlId: target, urls };
}

async function readFlowDefinitions(flowDir: string): Promise<FlowDefinition[]> {
  const entries = await fs.readdir(flowDir, { withFileTypes: true }).catch(() => []);
  const flows: FlowDefinition[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.yml')) continue;
    const fullPath = path.join(flowDir, entry.name);
    const yamlContent = await fs.readFile(fullPath, 'utf8');
    const data = YAML.parse(yamlContent) as FlowDefinition;
    if (!data || !data.steps || data.steps.length === 0) continue;
    flows.push({ ...data, name: data.name || entry.name.replace(/\.yml$/, '') });
  }
  return flows;
}

function flowMatches(flow: FlowDefinition, url: string): boolean {
  if (!flow.urlPattern) return false;
  try {
    const re = new RegExp(flow.urlPattern);
    return re.test(url);
  } catch {
    return false;
  }
}

function sanitizeTestName(url: string): string {
  const slug = url.replace(/^https?:\/\//, '').replace(/[^\w-]/g, '-');
  return slug.replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function writeFlowYaml(flowDir: string, flow: FlowDefinition): Promise<string> {
  const fileName = `${flow.name.replace(/\s+/g, '-').toLowerCase()}.yml`;
  const fullPath = path.join(flowDir, fileName);
  await fs.writeFile(fullPath, YAML.stringify(flow), 'utf8');
  return fullPath;
}

async function runFlowToSpec(flowPath: string): Promise<void> {
  const converterScript = path.join(process.cwd(), 'scripts', 'flow-to-pw.ts');
  const { spawn } = await import('child_process');
  const tsNodeBin = require.resolve('ts-node/dist/bin.js');
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [tsNodeBin, converterScript, flowPath], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`flow-to-pw exited with code ${code}`));
    });
  });
}

async function generateTests(config: GeneratorConfig, flows: FlowDefinition[]): Promise<void> {
  await fs.mkdir(config.outputDir, { recursive: true });

  for (const url of config.visitedUrls) {
    const matchingFlow = flows.find((flow) => flowMatches(flow, url));
    if (!matchingFlow && !config.defaultFlow) {
      log.info(`No flow matches ${url}; skipping.`);
      continue;
    }
    const normalizedGoto = normalizeGotoTarget(url);
    const flowToUse = matchingFlow || {
      ...(config.defaultFlow as FlowDefinition),
      name: config.defaultFlow?.name || sanitizeTestName(url),
      steps: [
        { type: 'goto', url: normalizedGoto },
        ...(ensureArray(config.defaultFlow?.steps) || []),
      ],
    };
    if (!flowToUse.steps.find((step) => step.type === 'goto')) {
      flowToUse.steps.unshift({ type: 'goto', url: normalizedGoto });
    }
    const flowPath = await writeFlowYaml(config.flowDir, flowToUse);
    const relFlowPath = path.relative(process.cwd(), flowPath).replace(/\\/g, '/');
    log.info(`Generating spec for ${url} via ${relFlowPath}`);
    await runFlowToSpec(relFlowPath);

    if (Array.isArray(config.composites) && config.composites.length > 0) {
      for (const composite of config.composites) {
        const compositeFlow: FlowDefinition = {
          name: `${composite.name}-${sanitizeTestName(url)}`,
          description: `${composite.description || composite.name} (${url})`,
          steps: [{ type: 'goto', url: normalizedGoto }, ...ensureArray(composite.steps)],
        };
        const compositePath = await writeFlowYaml(config.flowDir, compositeFlow);
        const relCompositePath = path.relative(process.cwd(), compositePath).replace(/\\/g, '/');
        log.info(`Generating composite "${composite.name}" for ${url} via ${relCompositePath}`);
        await runFlowToSpec(relCompositePath);
      }
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let crawlId: string | undefined;
  let includePattern: RegExp | undefined;
  let defaultTags: string[] = [];
  let compositeFilters: string[] | undefined;
  let viewIdFilter: Set<string> | undefined = new Set(['1']);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--crawl-id') {
      crawlId = args[i + 1];
      i++;
    } else if (arg.startsWith('--crawl-id=')) {
      crawlId = arg.split('=')[1];
    } else if (arg === '--include') {
      includePattern = new RegExp(args[i + 1]);
      i++;
    } else if (arg.startsWith('--include=')) {
      includePattern = new RegExp(arg.split('=')[1]);
    } else if (arg === '--tags') {
      defaultTags = args[i + 1].split(',').map((t) => t.trim()).filter(Boolean);
      i++;
    } else if (arg.startsWith('--tags=')) {
      defaultTags = arg.split('=')[1].split(',').map((t) => t.trim()).filter(Boolean);
    } else if (arg === '--composites') {
      compositeFilters = args[i + 1].split(',').map((t) => t.trim()).filter(Boolean);
      i++;
    } else if (arg.startsWith('--composites=')) {
      compositeFilters = arg
        .split('=')[1]
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (arg === '--view-ids') {
      viewIdFilter = parseViewIdFilter(args[i + 1]);
      i++;
    } else if (arg.startsWith('--view-ids=')) {
      viewIdFilter = parseViewIdFilter(arg.split('=')[1]);
    }
  }

  if (compositeFilters && compositeFilters.length === 1 && compositeFilters[0].toLowerCase() === 'all') {
    compositeFilters = undefined;
  }

  const { crawlId: resolvedCrawlId, urls } = await readCrawlGraph(crawlId);
  const filteredUrls = includePattern ? urls.filter((url) => includePattern!.test(url)) : urls;
  const filteredByView =
    viewIdFilter === undefined
      ? filteredUrls
      : filteredUrls.filter((url) => {
          const match = url.match(conversationViewRegex);
          if (!match) return true;
          const [, viewId, page] = match;
          if (!viewIdFilter.has(viewId)) {
            return false;
          }
          if (page && page !== '1') {
            return false;
          }
          return true;
        });
  if (filteredByView.length === 0) {
    log.warn('No URLs to generate tests for after filtering.');
    return;
  }

  const flowDir = path.join(process.cwd(), 'mcp', 'flows', 'autogen');
  await fs.mkdir(flowDir, { recursive: true });
  const templatesDir = path.join(process.cwd(), 'mcp', 'flows', 'templates');
  const templateFlows = await readFlowDefinitions(templatesDir);
  const manualFlows = await readFlowDefinitions(path.join(process.cwd(), 'mcp', 'flows'));
  const templateNames = new Set(templateFlows.map((flow) => flow.name));
  const baseFlows = [
    ...templateFlows,
    ...manualFlows.filter((flow) => flow.urlPattern && !templateNames.has(flow.name)),
  ];
  const selectorKeys = await readSelectorKeySet();
  validateFlows(baseFlows, selectorKeys);
  const compositeDir = path.join(process.cwd(), 'mcp', 'flows', 'composites');
  const compositeFlows = await readFlowDefinitions(compositeDir);
  const composites =
    compositeFilters && compositeFilters.length > 0
      ? compositeFlows.filter((flow) => compositeFilters?.includes(flow.name))
      : compositeFlows;
  const selectedCompositeNames = composites.map((c) => c.name);
  if (compositeFilters && selectedCompositeNames.length === 0) {
    log.warn(`No composites matched filters: ${compositeFilters.join(', ')}`);
  }
  const outputDir = path.join(process.cwd(), 'tests', 'generated');

  const defaultFlow: FlowDefinition = {
    name: 'crawl-default',
    description: 'Default autogenerated flow from crawl graph',
    steps: [{ type: 'wait-loadstate', state: 'networkidle' }],
    tags: defaultTags,
  };

  await generateTests(
    {
      crawlId: resolvedCrawlId,
      flowDir,
      outputDir,
      defaultFlow,
      visitedUrls: filteredByView,
      composites,
    },
    baseFlows,
  );

  log.info(`Generated tests for ${filteredByView.length} URL(s).`);
}

function normalizeGotoTarget(url: string): string {
  if (conversationViewRegex.test(url)) {
    return 'env.KAYAKO_INBOX_VIEW_URL';
  }
  return url;
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Test generation failed', err);
    process.exitCode = 1;
  });
}


