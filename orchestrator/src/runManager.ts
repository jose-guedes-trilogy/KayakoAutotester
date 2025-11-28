import path from 'path';
import fs from 'fs-extra';
import { ChildProcess, spawn } from 'child_process';
import treeKill from 'tree-kill';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from './logger';
import { artifactsDirForRun, repoRoot, upsertRun, readTests } from './storage';
import { spawnNpx, spawnNpm } from './utils/spawn';
import YAML from 'yaml';
import type { CreateRunRequest, RunRecord } from './types';


type SSEClient = {
  id: string;
  write: (data: string) => void;
  close: () => void;
};

const log = createLogger('runManager');

export class RunManager {
  private processes = new Map<string, ChildProcess>();
  private logs = new Map<string, string[]>(); // small ring buffer
  private clients = new Map<string, Set<SSEClient>>();

  constructor() {}

  private broadcast(runId: string, event: string, payload: any) {
    const set = this.clients.get(runId);
    const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const c of set || []) {
      c.write(msg);
    }
  }

  attachClient(runId: string, client: SSEClient) {
    if (!this.clients.has(runId)) this.clients.set(runId, new Set());
    this.clients.get(runId)!.add(client);
    // send buffered logs
    const buf = this.logs.get(runId) || [];
    for (const line of buf) {
      client.write(`event: log\ndata: ${JSON.stringify({ line })}\n\n`);
    }
  }

  detachClient(runId: string, client: SSEClient) {
    this.clients.get(runId)?.delete(client);
  }

  async startRun(req: CreateRunRequest): Promise<RunRecord> {
    const runId = uuidv4();
    const root = repoRoot();
    const artifactsDir = artifactsDirForRun(runId);
    await fs.mkdirp(artifactsDir);

    // Build Playwright CLI arguments (without the executable itself)
    const pwArgs: string[] = ['test', '-c', 'config/playwright.config.ts'];

    const target = req.target || {};
    const options = req.options || {};

    const requestedTests = Array.isArray(target.tests)
      ? target.tests.map((s) => String(s || '').trim()).filter((s) => s.length > 0)
      : [];
    const sanitizedTests = requestedTests.map((name) => name.replace(/[^a-zA-Z0-9_-]/g, '')).filter((s) => s.length > 0);
    const useQueueRunner = sanitizedTests.length > 1;
    // Ensure the spec exists (generate on the fly from flow or stored Test if missing)
    if (!useQueueRunner && sanitizedTests.length === 1) {
      await this.ensureGeneratedSpec(runId, sanitizedTests[0]).catch((e) => {
        this.pushLog(runId, `[orchestrator] warn: failed to ensure spec for ${sanitizedTests[0]}: ${(e && (e as any).message) || e}`);
      });
    }
    if (useQueueRunner) {
      pwArgs.push(path.posix.join('tests', 'runtime', 'queue-runner.spec.ts'));
    } else if (sanitizedTests.length === 1) {
      pwArgs.push(path.posix.join('tests', 'generated', `${sanitizedTests[0]}.spec.ts`));
    }
    if (target.grep) {
      pwArgs.push('--grep', target.grep);
    }
    if (options.project) {
      pwArgs.push('--project', options.project);
    }
    if (options.workers) {
      // Pass workers as-is; Playwright supports values like "50%" or numbers
      pwArgs.push('--workers', String(options.workers));
    } else if (options.headed) {
      // Safety: when headed, default to a single worker to avoid opening many windows
      pwArgs.push('--workers', '1');
    }
    if (options.headed) {
      pwArgs.push('--headed');
    }
    if (typeof options.retries === 'number') {
      pwArgs.push('--retries', String(options.retries));
    }
    if (options.trace) {
      pwArgs.push('--trace', options.trace);
    }
    // Note: video/screenshot are configured via env in Playwright config (no CLI flags)

    const contextInfo = req.context || {};

    const run: RunRecord = {
      id: runId,
      status: 'running',
      startedAt: new Date().toISOString(),
      args: ['playwright', ...pwArgs],
      artifactsDir,
      context: contextInfo,
    };

    await upsertRun(run);

    this.logs.set(runId, []);

    // Resolve playwright binary directly to avoid npx spawning issues on Windows
    const exe = process.platform === 'win32'
      ? path.join(root, 'node_modules', '.bin', 'playwright.cmd')
      : path.join(root, 'node_modules', '.bin', 'playwright');

    // On Windows, spawning .cmd with non-ASCII paths or spaces can throw EINVAL if not run via a shell.
    // Build a shell command string on Windows; use direct spawn with args on POSIX.
    const envVars = {
      ...process.env,
      RUN_ID: runId,
      PW_TEST_HTML_REPORT_OPEN: 'never',
      // Allow tests to forward logs directly to orchestrator even if Playwright buffers stdio
      KAYAKO_ORCH_URL: process.env.KAYAKO_ORCH_URL || 'http://127.0.0.1:7333',
      KAYAKO_HUD: options.headed ? '1' : (process.env.KAYAKO_HUD || '0'),
      ...(req.env || {}),
    } as Record<string, string>;
    if (contextInfo.crawlId) {
      envVars.KAYAKO_CRAWL_ID = contextInfo.crawlId;
    }
    if (contextInfo.flowId) {
      envVars.KAYAKO_FLOW_ID = contextInfo.flowId;
    }
    if (useQueueRunner) {
      envVars.KAYAKO_QUEUE = sanitizedTests.join(',');
      envVars.KAYAKO_RUN_MODE = 'queue';
    } else {
      envVars.KAYAKO_RUN_MODE = '';
      delete envVars.KAYAKO_QUEUE;
    }
    let child: ChildProcess;
    if (process.platform === 'win32') {
      const quote = (s: string) => {
        if (/["\s]/.test(s)) return `"${s.replace(/"/g, '\\"')}"`;
        return s;
      };
      const cmdLine = `${quote(exe)} ${pwArgs.map(quote).join(' ')}`;
      child = spawn(cmdLine, {
        cwd: root,
        env: envVars,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });
    } else {
      child = spawn(exe, pwArgs, {
        cwd: root,
        env: envVars,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    }

    // Announce spawn so UI shows immediate activity
    this.pushLog(runId, `[orchestrator] spawn: ${exe} ${pwArgs.join(' ')}`);
    if (child.stdout) child.stdout.on('data', (buf) => this.pushLog(runId, buf.toString('utf8')));
    if (child.stderr) child.stderr.on('data', (buf) => this.pushLog(runId, buf.toString('utf8')));

    this.processes.set(runId, child);
    child.on('error', (err) => {
      this.pushLog(runId, `[orchestrator] process error: ${(err && (err as any).message) || err}\n`);
    });

    child.on('exit', async (code) => {
      const endedAt = new Date().toISOString();
      let status: RunRecord['status'] = code === 0 ? 'passed' : 'failed';
      if (status === 'failed') {
        // could be stopped; check if process was killed
        // we can't easily distinguish here; leave as failed unless stopRun sets status
      }
      // Prefer per-run outputs when RUN_ID is set in Playwright config
      let htmlReportUrl = `/runs/${runId}/html/index.html`;
      try {
        const runBase = path.join(root, 'runs', runId);
        const runJson = path.join(runBase, 'report.json');
        if (await fs.pathExists(runJson)) {
          const summary = await this.summarizeResults(runJson);
          const updated: RunRecord = {
            ...run,
            status,
            endedAt,
            summary,
            htmlReportUrl,
          };
          await upsertRun(updated);
          this.broadcast(runId, 'end', { status, summary });
          return;
        }
      } catch (e) {
        log.warn('Failed reading per-run report.json', e);
      }
      // Fallback to legacy test-results path
      try {
        const resultsJson = path.join(root, 'test-results', 'results.json');
        if (await fs.pathExists(resultsJson)) {
          await fs.copy(resultsJson, path.join(artifactsDir, 'results.json'));
          const summary = await this.summarizeResults(resultsJson);
          const updated: RunRecord = {
            ...run,
            status,
            endedAt,
            summary,
            htmlReportUrl: '/report/index.html',
          };
          await upsertRun(updated);
          this.broadcast(runId, 'end', { status, summary });
          return;
        }
      } catch (e) {
        log.warn('Failed reading/copying results.json', e);
      }
      const updated: RunRecord = { ...run, status, endedAt, htmlReportUrl };
      await upsertRun(updated);
      this.broadcast(runId, 'end', { status });
    });

    this.broadcast(runId, 'begin', { args: run.args });
    return run;
  }

  // Generate tests/generated/<name>.spec.ts if missing by:
  // 1) Converting mcp/flows/<name>.yml if it exists
  // 2) Else, reading storage Test with id or name == <name>, writing a flow YAML, and converting
  private async ensureGeneratedSpec(runId: string, name: string): Promise<void> {
    const root = repoRoot();
    const specPath = path.join(root, 'tests', 'generated', `${name}.spec.ts`);
    if (await fs.pathExists(specPath)) {
      try {
        const content = await fs.readFile(specPath, 'utf8');
        const hasTests = /(^|\W)test\(/.test(content);
        const hasQueueGating = /const\s+queueMode\s*=|if\s*\(!queueMode\)/.test(content);
        if (hasTests && !hasQueueGating) {
          return; // already good
        }
      } catch {
        // fall through to regenerate
      }
    }
    const flowsDir = path.join(root, 'mcp', 'flows');
    const flowPath = path.join(flowsDir, `${name}.yml`);
    await fs.mkdirp(flowsDir);
    if (!(await fs.pathExists(flowPath))) {
      // Try to synthesize flow YAML from saved Test
      const tests = await readTests().catch(() => []);
      const test = (tests || []).find((t) => String(t.id) === name || String(t.name) === name);
      if (!test) {
        // Nothing to convert; leave as-is
        this.pushLog(runId, `[orchestrator] warn: no flow or saved test found for "${name}" - cannot generate spec`);
        return;
      }
      const flow = { name: test.name, description: test.description || test.name, steps: test.steps } as any;
      await fs.writeFile(flowPath, YAML.stringify(flow), 'utf8');
      this.pushLog(runId, `[orchestrator] wrote synthesized flow: ${path.relative(root, flowPath)}`);
    }
    // Convert flow to spec
    await new Promise<void>((resolve) => {
      let out = '';
      let err = '';
      this.pushLog(runId, `[orchestrator] converting flow to spec: ${path.relative(root, flowPath)}`);
      // Prefer npm script (more reliable resolution on Windows)
      const child = spawnNpm(['run', '-s', 'convert:flows', '--', flowPath], {
        cwd: root,
        onStdout: (b: Buffer) => (out += b.toString('utf8')),
        onStderr: (b: Buffer) => (err += b.toString('utf8')),
      });
      child.on('exit', async (code: number | null) => {
        if (out.trim()) this.pushLog(runId, `[converter out] ${out.trim()}`);
        if (err.trim()) this.pushLog(runId, `[converter err] ${err.trim()}`);
        if (code !== 0) this.pushLog(runId, `[orchestrator] warn: converter exited with code ${code}`);
        resolve();
      });
    });
    // Validate spec content; if still missing or empty, log a warning (runner will surface 'No tests found')
    if (await fs.pathExists(specPath)) {
      try {
        const content = await fs.readFile(specPath, 'utf8');
        const hasTests = /(^|\W)test\(/.test(content);
        if (!hasTests) {
          this.pushLog(runId, `[orchestrator] warn: generated spec has no tests: ${path.relative(root, specPath)}`);
        }
      } catch {
        // ignore
      }
    } else {
      this.pushLog(runId, `[orchestrator] warn: spec not found after conversion: ${path.relative(root, specPath)}`);
    }
  }

  listActiveRunIds(): string[] {
    return Array.from(this.processes.keys());
  }

  private async killTree(pid: number): Promise<void> {
    await new Promise<void>((resolve) => {
      try {
        treeKill(pid, 'SIGTERM', () => resolve());
      } catch {
        resolve();
      }
    });
    if (process.platform === 'win32') {
      try {
        const { spawn } = await import('child_process');
        const tk = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', shell: true });
        await new Promise<void>((r) => tk.on('close', () => r()));
      } catch {
        // ignore
      }
    }
  }

  // Accept external log lines (e.g., from tests calling the orchestrator directly)
  ingestExternalLog(runId: string, line: string) {
    this.pushLog(runId, line);
  }

  private async summarizeResults(resultsJsonPath: string): Promise<RunRecord['summary']> {
    try {
      const data = await fs.readJSON(resultsJsonPath);
      // Playwright json reporter schema can change; best effort extraction:
      const totals = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
      };
      if (Array.isArray(data.suites)) {
        const walk = (suites: any[]) => {
          for (const s of suites) {
            if (Array.isArray(s.tests)) {
              for (const t of s.tests) {
                totals.total += 1;
                const status = (t.results?.[0]?.status || t.status || '').toLowerCase();
                if (status === 'passed') totals.passed += 1;
                else if (status === 'skipped') totals.skipped += 1;
                else totals.failed += 1;
              }
            }
            if (Array.isArray(s.suites)) walk(s.suites);
          }
        };
        walk(data.suites);
      }
      return totals;
    } catch {
      return { total: 0, passed: 0, failed: 0, skipped: 0 };
    }
  }

  async stopRun(runId: string): Promise<boolean> {
    const child = this.processes.get(runId);
    if (!child || child.killed) return false;
    try {
      await this.killTree(child.pid!);
      this.pushLog(runId, '[orchestrator] Requested termination of Playwright process\n');
      const updated: RunRecord = {
        ...(await this.getRun(runId)),
        status: 'stopped',
        endedAt: new Date().toISOString(),
      };
      await upsertRun(updated);
      // Immediately notify clients to detach even if the process hasn't fully exited yet
      this.broadcast(runId, 'end', { status: 'stopped' });
      this.processes.delete(runId);
      return true;
    } catch (e) {
      log.error('Failed to stop run', e);
      return false;
    }
  }

  async killAll(): Promise<number> {
    const ids = this.listActiveRunIds();
    for (const id of ids) {
      try {
        const p = this.processes.get(id);
        if (p && !p.killed) await this.killTree(p.pid!);
        const updated: RunRecord = {
          ...(await this.getRun(id)),
          status: 'stopped',
          endedAt: new Date().toISOString(),
        };
        await upsertRun(updated);
        this.broadcast(id, 'end', { status: 'stopped' });
      } catch {}
      this.processes.delete(id);
    }
    return ids.length;
  }
  getBuffer(runId: string): string[] {
    return this.logs.get(runId) || [];
  }

  async getRun(runId: string): Promise<RunRecord> {
    const runsPath = path.join(repoRoot(), 'storage', 'runs.json');
    const data = await fs.readJSON(runsPath).catch(() => ({ runs: [] }));
    const found = (data.runs as RunRecord[]).find((r) => r.id === runId);
    if (!found) throw new Error('Run not found');
    return found;
  }

  private pushLog(runId: string, chunk: string) {
    const lines = chunk.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) return;
    const buf = this.logs.get(runId) || [];
    for (const line of lines) {
      // Echo to orchestrator stdout so logs are visible in the server console as well
      try { process.stdout.write(line + '\n'); } catch {}
      buf.push(line);
      if (buf.length > 1000) buf.shift();
      this.broadcast(runId, 'log', { line });
    }
    this.logs.set(runId, buf);
  }
}



