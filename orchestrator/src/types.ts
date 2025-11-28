import { z } from 'zod';

export const StepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('goto'), url: z.string() }),
  z.object({ type: z.literal('fill'), selectorKey: z.string(), value: z.union([z.string(), z.number(), z.boolean()]).transform(String) }),
  z.object({ type: z.literal('click'), selectorKey: z.string() }),
  z.object({ type: z.literal('dispatch-click'), selectorKey: z.string() }),
  z.object({ type: z.literal('dispatch-click-text'), value: z.string() }),
  z.object({ type: z.literal('expect-visible'), selectorKey: z.string() }),
  z.object({ type: z.literal('wait-hidden'), selectorKey: z.string() }),
  z.object({ type: z.literal('wait-loadstate'), state: z.enum(['load','domcontentloaded','networkidle']).optional() }),
  z.object({ type: z.literal('expect-url-contains'), value: z.string() }),
  z.object({ type: z.literal('wait'), value: z.union([z.string(), z.number()]).transform((v) => String(v)) }),
  z.object({ type: z.literal('press'), key: z.string(), selectorKey: z.string().optional() }),
  z.object({ type: z.literal('goto-conversation-by-env-id') }),
  z.object({ type: z.literal('switch-assignee-and-save'), order: z.array(z.string()).optional() }),
  z.object({ type: z.literal('log-assignee') }),
  z.object({ type: z.literal('add-tags'), values: z.array(z.string()) }),
  z.object({ type: z.literal('insert-reply-text'), value: z.string() }),
  z.object({ type: z.literal('switch-to-reply') }),
  z.object({ type: z.literal('set-status'), value: z.string() }),
  z.object({
    type: z.literal('set-custom-field'),
    fieldType: z.enum(['text','textarea','radio','dropdown','checkbox','integer','decimal','yesno','cascading','date','regex']),
    label: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
    path: z.array(z.string()).optional(),
  }),
]);

export type Step = z.infer<typeof StepSchema>;

export const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  steps: z.array(StepSchema),
});

export type TestDef = z.infer<typeof TestSchema>;

export const RunTargetSchema = z.object({
  tests: z.array(z.string()).optional(), // names corresponding to tests/generated/<name>.spec.ts
  grep: z.string().optional(),
});

export const RunOptionsSchema = z.object({
  project: z.string().optional(),
  workers: z.union([z.string(), z.number()]).optional(),
  headed: z.boolean().optional(),
  retries: z.number().optional(),
  trace: z.enum(['on','off','on-first-retry']).optional(),
  video: z.enum(['on','off','retain-on-failure']).optional(),
  screenshot: z.enum(['on','off','only-on-failure']).optional(),
});

export const RunContextSchema = z.object({
  crawlId: z.string().optional(),
  flowId: z.string().optional(),
  pipelineStage: z
    .enum(['crawl', 'capture', 'selectors', 'generate', 'tests'])
    .optional(),
}).optional();

export const CreateRunSchema = z.object({
  target: RunTargetSchema.optional(),
  options: RunOptionsSchema.optional(),
  context: RunContextSchema,
  // Optional environment variables to inject into the Playwright process (e.g., KAYAKO_CONVERSATION_ID)
  env: z.record(z.string()).optional(),
});

export type CreateRunRequest = z.infer<typeof CreateRunSchema>;

export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'stopped' | 'error';

export interface RunRecord {
  id: string;
  status: RunStatus;
  startedAt?: string;
  endedAt?: string;
  args: string[];
  htmlReportUrl?: string;
  artifactsDir?: string;
  context?: z.infer<typeof RunContextSchema>;
  summary?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    durationMs?: number;
  };
  pipelineStage?: 'crawl' | 'capture' | 'selectors' | 'generate' | 'tests';
  apiEndpoint?: string;
}

export type PipelineStageName = 'crawl' | 'capture' | 'selectors' | 'generate' | 'tests';

export type PipelineStageStatus = 'pending' | 'running' | 'success' | 'failed';

export interface PipelineStageRecord {
  name: PipelineStageName;
  status: PipelineStageStatus;
  startedAt?: string;
  endedAt?: string;
  logs: string[];
  details?: Record<string, unknown>;
}

export interface PipelineRecord {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: string;
  endedAt?: string;
  crawlId: string;
  captureId: string;
  stages: PipelineStageRecord[];
}

export interface PipelineRequest {
  crawlId?: string;
  captureId?: string;
}

