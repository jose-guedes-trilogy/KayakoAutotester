import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs-extra';
import { createLogger } from './logger';
import { CreateRunSchema, CreateRunRequest, TestSchema } from './types';
import { RunManager } from './runManager';
import { artifactsDirForRun, readRuns, readTests, repoRoot, upsertRun, writeTests } from './storage';
import { spawnNpm, spawnNpx } from './utils/spawn';
import YAML from 'yaml';
import fg from 'fast-glob';
import { parse as parseJsonc } from 'jsonc-parser';
import fsNative from 'fs';

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
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Serve the Playwright HTML report statically at /report
app.use('/report', express.static(path.join(repoRoot(), 'playwright-report')));
// Serve a minimal control UI at /control
app.use('/control', express.static(path.join(__dirname, '..', 'public')));

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
  res.json({ specs: items });
});

// Run engine
const runs = new RunManager();

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

// SSE log stream
app.get('/api/runs/:id/stream', async (req, res) => {
  const id = String(req.params.id || '');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const client = {
    id: Math.random().toString(36).slice(2),
    write: (data: string) => res.write(data),
    close: () => res.end(),
  };
  runs.attachClient(id, client);
  req.on('close', () => runs.detachClient(id, client));
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


