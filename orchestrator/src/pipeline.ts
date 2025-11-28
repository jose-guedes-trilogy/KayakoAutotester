import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import { spawnNpm } from './utils/spawn';
import { createLogger } from './logger';
import { repoRoot, upsertPipeline, readPipelines } from './storage';
import type { PipelineRecord, PipelineRequest, PipelineStageName, PipelineStageRecord } from './types';

const log = createLogger('pipeline');
const stageOrder: PipelineStageName[] = ['crawl', 'capture', 'selectors', 'generate', 'tests'];

export class PipelineManager {
  private active?: PipelineRecord;
  private runningPromise: Promise<void> | null = null;

  constructor() {}

  async getPipelines(): Promise<{ pipelines: PipelineRecord[]; active?: PipelineRecord }> {
    const pipelines = await readPipelines();
    return {
      pipelines: pipelines.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || '')),
      active: this.active,
    };
  }

  async startPipeline(req: PipelineRequest = {}): Promise<PipelineRecord> {
    if (this.active && this.active.status === 'running') {
      throw new Error('Pipeline already running');
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').toLowerCase();
    const crawlId = req.crawlId || `pipeline-crawl-${timestamp}`;
    const captureId = req.captureId || `pipeline-capture-${timestamp}`;
    const id = uuidv4();
    const record: PipelineRecord = {
      id,
      status: 'running',
      startedAt: new Date().toISOString(),
      crawlId,
      captureId,
      stages: stageOrder.map((name) => ({
        name,
        status: 'pending',
        logs: [],
      })),
    };
    await upsertPipeline(record);
    this.active = record;
    this.runningPromise = this.runStages(record).catch((err) => {
      log.error('Pipeline failed', err);
    });
    return record;
  }

  private async runStages(record: PipelineRecord): Promise<void> {
    for (const stage of stageOrder) {
      await this.updateStage(record, stage, { status: 'running', startedAt: new Date().toISOString() });
      try {
        if (stage === 'crawl') await this.runCrawlStage(record);
        else if (stage === 'capture') await this.runCaptureStage(record);
        else if (stage === 'selectors') await this.runSelectorStage(record);
        else if (stage === 'generate') await this.runGenerateStage(record);
        else if (stage === 'tests') await this.runTestsStage(record);
        await this.updateStage(record, stage, { status: 'success', endedAt: new Date().toISOString() });
      } catch (error) {
        const message = (error as Error)?.message || String(error);
        await this.updateStage(record, stage, {
          status: 'failed',
          endedAt: new Date().toISOString(),
          logs: [`[pipeline] ${message}`],
        });
        record.status = 'failed';
        record.endedAt = new Date().toISOString();
        await upsertPipeline(record);
        this.active = undefined;
        return;
      }
    }
    record.status = 'success';
    record.endedAt = new Date().toISOString();
    await upsertPipeline(record);
    this.active = undefined;
  }

  private async runCrawlStage(record: PipelineRecord): Promise<void> {
    await this.runNpmCommand(record, 'crawl', [
      'run',
      '-s',
      'crawl:kayako',
      '--',
      `--crawl-id=${record.crawlId}`,
      '--max-depth=2',
      '--headless=true',
    ]);
  }

  private async runCaptureStage(record: PipelineRecord): Promise<void> {
    await this.runNpmCommand(record, 'capture', [
      'run',
      '-s',
      'capture:pipeline',
      '--',
      `--crawl-id=${record.crawlId}`,
      `--capture-id=${record.captureId}`,
      '--screenshot=false',
    ]);
  }

  private async runSelectorStage(record: PipelineRecord): Promise<void> {
    await this.runNpmCommand(record, 'selectors', [
      'run',
      '-s',
      'selectors:suggest',
      '--',
      `--crawl-id=${record.captureId}`,
    ]);
    const pendingFile = path.join(repoRoot(), 'selectors', 'extracted', 'pending.json');
    if (await fs.pathExists(pendingFile)) {
      try {
        const raw = await fs.readFile(pendingFile, 'utf8');
        const data = JSON.parse(raw);
        await this.updateStage(record, 'selectors', {
          details: {
            pendingSuggestions: data?.suggestions?.length ?? 0,
          },
        });
      } catch (error) {
        await this.appendStageLog(record, 'selectors', `[pipeline] failed to summarize pending.json: ${(error as Error).message}`);
      }
    }
  }

  private async runGenerateStage(record: PipelineRecord): Promise<void> {
    await this.runNpmCommand(record, 'generate', [
      'run',
      '-s',
      'generate:tests',
      '--',
      `--crawl-id=${record.crawlId}`,
      '--composites=all',
    ]);
  }

  private async runTestsStage(record: PipelineRecord): Promise<void> {
    await this.runNpmCommand(record, 'tests', ['run', '-s', 'test', '--', '--project=chromium']);
  }

  private async runNpmCommand(
    record: PipelineRecord,
    stage: PipelineStageName,
    args: string[],
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawnNpm(args, {
        cwd: repoRoot(),
        onStdout: (b) => this.appendStageLog(record, stage, b.toString('utf8')),
        onStderr: (b) => this.appendStageLog(record, stage, b.toString('utf8')),
      });
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${stage} stage exited with code ${code}`));
      });
      child.on('error', (err) => reject(err));
    });
  }

  private async appendStageLog(record: PipelineRecord, stage: PipelineStageName, line: string) {
    const target = record.stages.find((s) => s.name === stage);
    if (!target) return;
    const trimmed = line.replace(/\r/g, '');
    if (!trimmed) return;
    target.logs.push(trimmed);
    // Cap buffers
    if (target.logs.length > 200) {
      target.logs.splice(0, target.logs.length - 200);
    }
    await upsertPipeline(record);
  }

  private async updateStage(
    record: PipelineRecord,
    stage: PipelineStageName,
    patch: Partial<PipelineStageRecord>,
  ) {
    const target = record.stages.find((s) => s.name === stage);
    if (!target) return;
    Object.assign(target, patch);
    await upsertPipeline(record);
  }
}


