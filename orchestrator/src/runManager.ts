import path from 'path';
import fs from 'fs-extra';
import { ChildProcess } from 'child_process';
import treeKill from 'tree-kill';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from './logger';
import { artifactsDirForRun, repoRoot, upsertRun } from './storage';
import type { CreateRunRequest, RunRecord } from './types';
import { spawnNpx } from './utils/spawn';

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

    const args: string[] = ['playwright', 'test', '-c', 'config/playwright.config.ts'];

    const target = req.target || {};
    const options = req.options || {};

    if (target.tests && target.tests.length > 0) {
      // Map names to files under tests/generated/
      for (const t of target.tests) {
        args.push(path.posix.join('tests', 'generated', `${t}.spec.ts`));
      }
    }
    if (target.grep) {
      args.push('--grep', target.grep);
    }
    if (options.project) {
      args.push('--project', options.project);
    }
    if (options.workers) {
      args.push('--workers', String(options.workers));
    }
    if (options.headed) {
      args.push('--headed');
    }
    if (typeof options.retries === 'number') {
      args.push('--retries', String(options.retries));
    }
    if (options.trace) {
      args.push('--trace', options.trace);
    }
    if (options.video) {
      args.push('--video', options.video);
    }
    if (options.screenshot) {
      args.push('--screenshot', options.screenshot);
    }

    const run: RunRecord = {
      id: runId,
      status: 'running',
      startedAt: new Date().toISOString(),
      args,
      artifactsDir,
    };

    await upsertRun(run);

    this.logs.set(runId, []);

    const child = spawnNpx(args, {
      cwd: root,
      onStdout: (buf) => this.pushLog(runId, buf.toString('utf8')),
      onStderr: (buf) => this.pushLog(runId, buf.toString('utf8')),
    });

    this.processes.set(runId, child);

    child.on('exit', async (code) => {
      const endedAt = new Date().toISOString();
      let status: RunRecord['status'] = code === 0 ? 'passed' : 'failed';
      if (status === 'failed') {
        // could be stopped; check if process was killed
        // we can't easily distinguish here; leave as failed unless stopRun sets status
      }
      // Try to copy JSON results for archival
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
      const updated: RunRecord = { ...run, status, endedAt, htmlReportUrl: '/report/index.html' };
      await upsertRun(updated);
      this.broadcast(runId, 'end', { status });
    });

    this.broadcast(runId, 'begin', { args });
    return run;
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
      treeKill(child.pid!, 'SIGTERM');
      this.pushLog(runId, '[orchestrator] Requested termination of Playwright process\n');
      const updated: RunRecord = {
        ...(await this.getRun(runId)),
        status: 'stopped',
        endedAt: new Date().toISOString(),
      };
      await upsertRun(updated);
      return true;
    } catch (e) {
      log.error('Failed to stop run', e);
      return false;
    }
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
      buf.push(line);
      if (buf.length > 1000) buf.shift();
      this.broadcast(runId, 'log', { line });
    }
    this.logs.set(runId, buf);
  }
}



