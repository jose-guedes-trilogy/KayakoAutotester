import type { Dirent } from 'fs';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs-extra';
import { createLogger } from './logger';
import { CreateRunSchema, CreateRunRequest, TestSchema } from './types';
import { RunManager } from './runManager';
import { PipelineManager } from './pipeline';
import { artifactsDirForRun, readRuns, readTests, repoRoot, upsertRun, writeTests } from './storage';
import { spawnNpm, spawnNpx } from './utils/spawn';
import YAML from 'yaml';
import fg from 'fast-glob';
import { parse as parseJsonc, modify as jsoncModify, applyEdits as jsoncApplyEdits } from 'jsonc-parser';
import fsNative from 'fs';

type CrawlGraph = {
  crawls: Record<
    string,
    {
      startedAt?: string;
      updatedAt?: string;
      nodes: Record<string, { url: string; status: string }>;
    }
  >;
  lastCrawlId?: string;
};

type CrawlSummary = {
  crawlId: string;
  totalNodes: number;
  successNodes: number;
  startedAt?: string;
  updatedAt?: string;
};

type StructureSummary = {
  crawlId: string;
  dir: string;
  fileCount: number;
  mtimeMs: number;
};

type SpecGroup = {
  id: string;
  label: string;
  specs: string[];
};

const structureRoot = path.join(repoRoot(), 'artifacts', 'structure');
const selectorSuggestionsFile = path.join(repoRoot(), 'selectors', 'extracted', 'pending.json');
const crawlGraphPath = path.join(repoRoot(), 'storage', 'map', 'graph.json');
const specGroupsPath = path.join(repoRoot(), 'storage', 'spec-groups.json');

async function readCrawlSummaries(): Promise<CrawlSummary[]> {
  try {
    const raw = await fs.readFile(crawlGraphPath, 'utf8');
    const graph = JSON.parse(raw) as CrawlGraph;
    return Object.entries(graph.crawls || {}).map(([crawlId, crawl]) => {
      const nodes = Object.values(crawl.nodes || {});
      const successNodes = nodes.filter((n) => n.status === 'success').length;
      return {
        crawlId,
        totalNodes: nodes.length,
        successNodes,
        startedAt: crawl.startedAt,
        updatedAt: crawl.updatedAt,
      };
    });
  } catch {
    return [];
  }
}

async function readStructureSummaries(): Promise<StructureSummary[]> {
  try {
    const entries = await fs.readdir(structureRoot, { withFileTypes: true });
    const dirs = entries.filter((entry: Dirent) => entry.isDirectory());
    const summaries: StructureSummary[] = [];
    for (const entry of dirs) {
      const dir = path.join(structureRoot, entry.name);
      const stat = await fs.stat(dir);
      const files = await fg(['**/*.html', '**/*.png'], { cwd: dir, onlyFiles: true });
      summaries.push({
        crawlId: entry.name,
        dir: path.relative(repoRoot(), dir).replace(/\\/g, '/'),
        fileCount: files.length,
        mtimeMs: stat.mtimeMs,
      });
    }
    summaries.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return summaries;
  } catch {
    return [];
  }
}

async function readSelectorSuggestionSummary(): Promise<{ pendingCount: number; file?: string } | null> {
  try {
    const raw = await fs.readFile(selectorSuggestionsFile, 'utf8');
    const data = JSON.parse(raw) as { suggestions?: Array<any> };
    return {
      pendingCount: data.suggestions?.length || 0,
      file: path.relative(repoRoot(), selectorSuggestionsFile).replace(/\\/g, '/'),
    };
  } catch {
    return null;
  }
}

// Add live selector validation via a small ts-node script
async function runSelectorValidate(body: any) {
  const { group, key, baseURL } = body || {};
  if (!group || !key) {
    return { ok: false, error: 'group and key are required' };
  }
  const root = repoRoot();
  let out = '';
  let err = '';
  const args = ['ts-node', 'orchestrator/scripts/validate-selector.ts', '--group', group, '--key', key];
  if (baseURL) {
    args.push('--baseURL', String(baseURL));
  }
  const child = spawnNpx(args, {
    cwd: root,
    onStdout: (b) => (out += b.toString('utf8')),
    onStderr: (b) => (err += b.toString('utf8')),
  });
  return await new Promise<{ ok: boolean; error?: string; data?: any }>((resolve) => {
    child.on('exit', (_code) => {
      try {
        const parsed = JSON.parse((out || '').trim() || '{}');
        resolve(parsed);
      } catch {
        resolve({ ok: false, error: (err || 'Failed to parse validator output').toString() });
      }
    });
  });
}

const log = createLogger('server');
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 7333;

// Allow localhost/127.0.0.1 UIs on common dev ports (5173/5174/3000) by default.
// Also allow an explicit UI_ORIGIN env override.
const uiOrigin = process.env.UI_ORIGIN;
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (uiOrigin && origin === uiOrigin) return cb(null, true);
      const ok = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin);
      return cb(null, ok);
    },
  }),
);
// Avoid compressing Server-Sent Events; compression can buffer SSE and prevent real-time logs
app.use(
  compression({
    filter: (req: express.Request, res: express.Response) => {
      const url = req.url || '';
      if (url.startsWith('/api/runs/') && url.endsWith('/stream')) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Serve the Playwright HTML report statically at /report
app.use('/report', express.static(path.join(repoRoot(), 'playwright-report')));
// Serve a minimal control UI at /control
app.use('/control', express.static(path.join(__dirname, '..', 'public')));

// Serve per-run HTML reports and artifacts from runs/<RUN_ID> when available
app.use('/runs/:id/html', (req, res, next) => {
  const id = String(req.params.id || '');
  const dir = path.join(repoRoot(), 'runs', id, 'html');
  express.static(dir)(req, res, next);
});
app.use('/runs/:id/artifacts', (req, res, next) => {
  const id = String(req.params.id || '');
  const dir = path.join(repoRoot(), 'runs', id, 'artifacts');
  express.static(dir)(req, res, next);
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Tests CRUD (backed by storage/tests.json)
app.get('/api/tests', async (_req, res) => {
  const tests = await readTests();
  res.json({ tests });
});

app.post('/api/tests', async (req, res) => {
  const body = req.body;
  const parse = TestSchema.safeParse(body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid test payload', details: parse.error.format() });
  }
  const test = parse.data;
  const list = await readTests();
  const idx = list.findIndex((t) => t.id === test.id);
  if (idx >= 0) list[idx] = test;
  else list.push(test);
  await writeTests(list);
  res.json({ ok: true, test });
});

app.delete('/api/tests/:id', async (req, res) => {
  const id = String(req.params.id || '');
  const list = await readTests();
  const next = list.filter((t) => t.id !== id);
  await writeTests(next);
  res.json({ ok: true });
});

// Generate flow YAML from a saved Test and convert to Playwright spec via existing script
app.post('/api/flows/generate', async (req, res) => {
  const { testId } = req.body || {};
  if (!testId || typeof testId !== 'string') return res.status(400).json({ error: 'testId required' });
  const tests = await readTests();
  const test = tests.find((t) => t.id === testId);
  if (!test) return res.status(404).json({ error: 'Test not found' });
  const flow = {
    name: test.name,
    description: test.description || test.name,
    steps: test.steps,
  };
  const root = repoRoot();
  const flowsDir = path.join(root, 'mcp', 'flows');
  await fs.mkdirp(flowsDir);
  const flowPath = path.join(flowsDir, `${test.name}.yml`);
  await fs.writeFile(flowPath, YAML.stringify(flow), 'utf8');
  // Invoke converter
  const args = ['ts-node', 'scripts/flow-to-pw.ts', flowPath];
  let out = '';
  let err = '';
  const child = spawnNpx(args, {
    cwd: root,
    onStdout: (b) => (out += b.toString('utf8')),
    onStderr: (b) => (err += b.toString('utf8')),
  });
  child.on('exit', (code) => {
    res.json({ ok: code === 0, code, stdout: out, stderr: err, flowPath });
  });
});

// List flows under mcp/flows
app.get('/api/flows', async (_req, res) => {
  const root = repoRoot();
  const dir = path.join(root, 'mcp', 'flows');
  const files = await fg(['*.yml', '!schema.yml', '!README.md'], { cwd: dir, absolute: true }).catch(() => [] as string[]);
  const items = await Promise.all(
    files.map(async (f) => {
      const content = await fs.readFile(f, 'utf8').catch(() => '');
      let name = path.basename(f, '.yml');
      let description = '';
      try {
        const y = YAML.parse(content) as any;
        if (y && typeof y.name === 'string') name = y.name;
        if (y && typeof y.description === 'string') description = y.description;
      } catch {}
      const stat = await fs.stat(f).catch(() => null);
      return {
        name,
        file: path.basename(f),
        size: stat ? stat.size : 0,
        mtimeMs: stat ? stat.mtimeMs : 0,
        description,
      };
    }),
  );
  items.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ flows: items });
});

// Read a specific flow file's raw YAML content
app.get('/api/flows/:file/content', async (req, res) => {
  try {
    const file = String(req.params.file || '');
    if (!/^[a-zA-Z0-9._-]+\.yml$/i.test(file)) {
      return res.status(400).json({ error: 'invalid file' });
    }
    const p = path.join(repoRoot(), 'mcp', 'flows', file);
    if (!(await fs.pathExists(p))) return res.status(404).json({ error: 'Flow not found' });
    const content = await fs.readFile(p, 'utf8');
    res.json({ file, content });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to read flow' });
  }
});

// Save (create/update) a flow file from raw YAML content
app.post('/api/flows/save', async (req, res) => {
  try {
    const { file, content } = req.body || {};
    if (typeof file !== 'string' || typeof content !== 'string') {
      return res.status(400).json({ error: 'file and content required' });
    }
    if (!/^[a-zA-Z0-9._-]+\.yml$/i.test(file)) {
      return res.status(400).json({ error: 'invalid file' });
    }
    // Validate parsable YAML and minimal shape
    try {
      const parsed = YAML.parse(String(content));
      if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as any).steps)) {
        return res.status(400).json({ error: 'YAML must include steps: [...]' });
      }
    } catch (e: any) {
      return res.status(400).json({ error: `Invalid YAML: ${e?.message || 'parse error'}` });
    }
    const p = path.join(repoRoot(), 'mcp', 'flows', file);
    await fs.mkdirp(path.dirname(p));
    await fs.writeFile(p, String(content), 'utf8');
    res.json({ ok: true, file });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to save flow' });
  }
});

// Convert a specific flow file to spec
app.post('/api/flows/convert', async (req, res) => {
  const root = repoRoot();
  const dir = path.join(root, 'mcp', 'flows');
  const { file } = req.body || {};
  if (!file || typeof file !== 'string') return res.status(400).json({ error: 'file required (e.g., login-and-open-inbox.yml)' });
  const flowPath = path.join(dir, file);
  if (!(await fs.pathExists(flowPath))) return res.status(404).json({ error: 'Flow not found' });
  let out = '';
  let err = '';
  const child = spawnNpx(['ts-node', 'scripts/flow-to-pw.ts', flowPath], {
    cwd: root,
    onStdout: (b) => (out += b.toString('utf8')),
    onStderr: (b) => (err += b.toString('utf8')),
  });
  child.on('exit', (code) => res.json({ ok: code === 0, code, stdout: out, stderr: err }));
});

// List selectors (groups/keys)
app.get('/api/selectors', async (_req, res) => {
  const root = repoRoot();
  const file = path.join(root, 'selectors', 'selectors.jsonc');
  try {
    const raw = fsNative.readFileSync(file, 'utf8');
    const data = parseJsonc(raw) as Record<string, Record<string, string[] | string>>;
    const groups: Array<{ group: string; items: Array<{ key: string; candidates: string[] }> }> = [];
    for (const [group, obj] of Object.entries(data)) {
      if (!obj || typeof obj !== 'object') continue;
      const items: Array<{ key: string; candidates: string[] }> = [];
      for (const [key, val] of Object.entries(obj)) {
        if (Array.isArray(val)) items.push({ key, candidates: val });
        else if (typeof val === 'string') items.push({ key, candidates: [val] });
      }
      items.sort((a, b) => a.key.localeCompare(b.key));
      groups.push({ group, items });
    }
    groups.sort((a, b) => a.group.localeCompare(b.group));
    res.json({ groups });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to read selectors' });
  }
});

// Update selectors for a specific group/key in selectors.jsonc, preserving comments
app.post('/api/selectors/update', async (req, res) => {
  const root = repoRoot();
  const file = path.join(root, 'selectors', 'selectors.jsonc');
  const { group, key, candidates } = req.body || {};
  if (typeof group !== 'string' || typeof key !== 'string' || !Array.isArray(candidates)) {
    return res.status(400).json({ error: 'group, key, candidates[] required' });
  }
  // sanitize and de-duplicate
  const rawList = candidates.map((s: any) => String(s || '').trim()).filter((s: string) => s.length > 0);
  const seen = new Set<string>();
  const list: string[] = [];
  for (const s of rawList) {
    if (seen.has(s)) continue;
    seen.add(s);
    list.push(s);
  }
  // prefer [class*= selectors first to increase resilience
  list.sort((a, b) => {
    const ra = /^\s*\[class\*\=/.test(a) ? 0 : 1;
    const rb = /^\s*\[class\*\=/.test(b) ? 0 : 1;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
  try {
    const text = fsNative.readFileSync(file, 'utf8');
    const pathJson = [group, key];
    const edits = jsoncModify(text, pathJson, list, {
      formattingOptions: { insertSpaces: true, tabSize: 2, eol: '\n' },
    });
    const newText = jsoncApplyEdits(text, edits);
    fsNative.writeFileSync(file, newText, 'utf8');
    res.json({ ok: true, group, key, candidates: list });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to update selectors.jsonc' });
  }
});

// List generated tests (specs) under tests/generated
app.get('/api/specs', async (_req, res) => {
  const root = repoRoot();
  const dir = path.join(root, 'tests', 'generated');
  const files = await fg(['*.spec.ts'], { cwd: dir, absolute: false }).catch(() => [] as string[]);
  const items = files.map((f) => ({
    name: f.replace(/\.spec\.ts$/i, ''),
    file: path.join('tests', 'generated', f),
  }));
  items.sort((a, b) => a.name.localeCompare(b.name));
  let specGroups: SpecGroup[] = [];
  try {
    const raw = await fs.readFile(specGroupsPath, 'utf8');
    const data = JSON.parse(raw) as { groups?: SpecGroup[] };
    const set = new Set(items.map((i) => i.name));
    specGroups = (data.groups || []).map((g) => ({
      ...g,
      specs: (g.specs || []).filter((name) => set.has(name)),
    }));
  } catch {
    specGroups = [];
  }
  res.json({ specs: items, specGroups });
});

// Run engine
const runs = new RunManager();
const pipeline = new PipelineManager();

app.get('/api/runs', async (_req, res) => {
  const list = await readRuns();
  res.json({ runs: list });
});

app.get('/api/runs/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '');
    const run = await runs.getRun(id);
    res.json({ run });
  } catch (e: any) {
    res.status(404).json({ error: e?.message || 'Not found' });
  }
});

// List video artifacts (.webm) for a specific run, newest first
app.get('/api/runs/:id/videos', async (req, res) => {
  try {
    const id = String(req.params.id || '');
    // Ensure run exists
    await runs.getRun(id);
    const root = repoRoot();
    const dir = path.join(root, 'runs', id, 'artifacts');
    if (!(await fs.pathExists(dir))) {
      return res.json({ videos: [] });
    }
    const files = await fg(['**/*.webm'], { cwd: dir, absolute: true }).catch(() => [] as string[]);
    const items = await Promise.all(
      files.map(async (abs) => {
        const stat = await fs.stat(abs).catch(() => null as any);
        const rel = path.relative(dir, abs).replace(/\\/g, '/');
        const url = `/runs/${encodeURIComponent(id)}/artifacts/${rel}`;
        return { url, file: rel, mtimeMs: stat ? stat.mtimeMs : 0, size: stat ? stat.size : 0 };
      }),
    );
    items.sort((a, b) => b.mtimeMs - a.mtimeMs);
    res.json({ videos: items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to list videos' });
  }
});

app.post('/api/runs', async (req, res) => {
  const parse = CreateRunSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid run request', details: parse.error.format() });
  }
  const run = await runs.startRun(parse.data as CreateRunRequest);
  res.json({ runId: run.id });
});

app.post('/api/runs/:id/stop', async (req, res) => {
  const id = String(req.params.id || '');
  const ok = await runs.stopRun(id);
  res.json({ ok });
});

// Force kill all running Playwright processes (escape hatch)
app.post('/api/runs/kill-all', async (_req, res) => {
  const count = await runs.killAll();
  res.json({ ok: true, count });
});

app.get('/api/crawls', async (_req, res) => {
  const crawls = await readCrawlSummaries();
  res.json({ crawls });
});

app.get('/api/reporting', async (_req, res) => {
  const [crawls, structures, selectorSuggestions, pipelineData] = await Promise.all([
    readCrawlSummaries(),
    readStructureSummaries(),
    readSelectorSuggestionSummary(),
    pipeline.getPipelines(),
  ]);
  const runsList = await readRuns();
  const runsSummary = runsList.reduce(
    (acc, run) => {
      acc.total += 1;
      if (run.status === 'running') acc.running += 1;
      else if (run.status === 'passed') acc.passed += 1;
      else if (run.status === 'failed') acc.failed += 1;
      return acc;
    },
    { total: 0, running: 0, passed: 0, failed: 0 },
  );
  const specFiles = await fg(['*.spec.ts'], { cwd: path.join(repoRoot(), 'tests', 'generated'), onlyFiles: true }).catch(
    () => [] as string[],
  );
  const compositeSpecsCount = specFiles.filter((f) => path.basename(f).startsWith('composite-')).length;
  res.json({
    crawls,
    structures,
    selectorSuggestions,
    runsSummary,
    specsCount: specFiles.length,
    compositeSpecsCount,
    pipeline: pipelineData,
  });
});

app.get('/api/pipeline', async (_req, res) => {
  const data = await pipeline.getPipelines();
  res.json(data);
});

app.post('/api/pipeline/start', async (req, res) => {
  try {
    const record = await pipeline.startPipeline(req.body || {});
    res.json({ pipelineId: record.id });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to start pipeline' });
  }
});
// Receive direct log lines from test processes and broadcast to SSE
app.post('/api/runs/:id/log', async (req, res) => {
  const id = String(req.params.id || '');
  const body = (req.body || {}) as { line?: string };
  const line = String(body.line ?? '').trim();
  if (!line) {
    return res.status(400).json({ error: 'line required' });
  }
  try {
    // Ensure run exists (throws if not)
    await runs.getRun(id);
    runs.ingestExternalLog(id, line);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(404).json({ error: e?.message || 'Run not found' });
  }
});

// SSE log stream
app.get('/api/runs/:id/stream', async (req, res) => {
  const id = String(req.params.id || '');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Prevent intermediaries from buffering
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  const client = {
    id: Math.random().toString(36).slice(2),
    write: (data: string) => res.write(data),
    close: () => res.end(),
  };
  runs.attachClient(id, client);
  // Heartbeat to keep connection alive and help proxies flush
  const iv = setInterval(() => {
    try {
      res.write('event: ping\ndata: {}\n\n');
    } catch {
      // ignore
    }
  }, 15000);
  req.on('close', () => {
    clearInterval(iv);
    runs.detachClient(id, client);
  });
});

// Selectors lint (exec existing script)
app.post('/api/selectors/lint', async (_req, res) => {
  const root = repoRoot();
  let out = '';
  let err = '';
  const child = spawnNpm(['run', '-s', 'validate:selectors'], {
    cwd: root,
    onStdout: (b) => (out += b.toString('utf8')),
    onStderr: (b) => (err += b.toString('utf8')),
  });
  child.on('exit', (code) => {
    res.json({ ok: code === 0, code, stdout: out, stderr: err });
  });
});

// Selectors live validate
app.post('/api/selectors/validate', async (req, res) => {
  const result = await runSelectorValidate(req.body || {});
  res.json(result);
});

// Ensure artifacts base dir exists
fs.mkdirp(path.join(repoRoot(), 'artifacts')).catch(() => {});

app.listen(PORT, '127.0.0.1', () => {
  log.info(`Orchestrator listening on http://127.0.0.1:${PORT}`);
});


