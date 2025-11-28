import path from 'path';
import fs from 'fs-extra';
import { createLogger } from './logger';
import type { PipelineRecord, RunRecord, TestDef } from './types';

const log = createLogger('storage');
const ROOT = path.resolve(__dirname, '..', '..'); // repo root

const STORAGE_DIR = path.join(ROOT, 'storage');
const TESTS_FILE = path.join(STORAGE_DIR, 'tests.json');
const RUNS_FILE = path.join(STORAGE_DIR, 'runs.json');
const PIPELINES_FILE = path.join(STORAGE_DIR, 'pipelines.json');

async function ensureFiles() {
  await fs.mkdirp(STORAGE_DIR);
  if (!(await fs.pathExists(TESTS_FILE))) await fs.writeJSON(TESTS_FILE, { tests: [] as TestDef[] }, { spaces: 2 });
  if (!(await fs.pathExists(RUNS_FILE))) await fs.writeJSON(RUNS_FILE, { runs: [] as RunRecord[] }, { spaces: 2 });
  if (!(await fs.pathExists(PIPELINES_FILE))) await fs.writeJSON(PIPELINES_FILE, { pipelines: [] as PipelineRecord[] }, { spaces: 2 });
}

export async function readTests(): Promise<TestDef[]> {
  await ensureFiles();
  const data = await fs.readJSON(TESTS_FILE);
  return Array.isArray(data.tests) ? (data.tests as TestDef[]) : [];
}

export async function writeTests(tests: TestDef[]): Promise<void> {
  await ensureFiles();
  await fs.writeJSON(TESTS_FILE, { tests }, { spaces: 2 });
}

export async function readRuns(): Promise<RunRecord[]> {
  await ensureFiles();
  const data = await fs.readJSON(RUNS_FILE);
  return Array.isArray(data.runs) ? (data.runs as RunRecord[]) : [];
}

export async function upsertRun(run: RunRecord): Promise<void> {
  await ensureFiles();
  const data = await fs.readJSON(RUNS_FILE);
  const runs: RunRecord[] = Array.isArray(data.runs) ? data.runs : [];
  const idx = runs.findIndex((r) => r.id === run.id);
  if (idx >= 0) {
    runs[idx] = run;
  } else {
    runs.push(run);
  }
  await fs.writeJSON(RUNS_FILE, { runs }, { spaces: 2 });
}

export async function readPipelines(): Promise<PipelineRecord[]> {
  await ensureFiles();
  const data = await fs.readJSON(PIPELINES_FILE);
  return Array.isArray(data.pipelines) ? (data.pipelines as PipelineRecord[]) : [];
}

export async function upsertPipeline(record: PipelineRecord): Promise<void> {
  await ensureFiles();
  const data = await fs.readJSON(PIPELINES_FILE);
  const pipelines: PipelineRecord[] = Array.isArray(data.pipelines) ? data.pipelines : [];
  const idx = pipelines.findIndex((p) => p.id === record.id);
  if (idx >= 0) {
    pipelines[idx] = record;
  } else {
    pipelines.push(record);
  }
  await fs.writeJSON(PIPELINES_FILE, { pipelines }, { spaces: 2 });
}

export function repoRoot(): string {
  return ROOT;
}

export function artifactsDirForRun(runId: string): string {
  return path.join(ROOT, 'artifacts', runId);
}



