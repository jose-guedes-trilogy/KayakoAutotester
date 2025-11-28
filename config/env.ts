import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';

// Prefer .env.local; fallback to .env if present
(() => {
  const candidates = ['.env.local', '.env'];
  for (const candidate of candidates) {
    const fullPath = path.resolve(process.cwd(), candidate);
    if (existsSync(fullPath)) {
      loadEnv({ path: fullPath });
      break;
    }
  }
})();

const EnvSchema = z.object({
  KAYAKO_BASE_URL: z.string().url(),
  KAYAKO_AGENT_URL: z.string().url(),
  KAYAKO_USERNAME: z.string().min(1),
  KAYAKO_PASSWORD: z.string().min(1),
  PW_REPORTER: z.string().optional(),
  KAYAKO_CONVERSATION_ID: z.string().optional(),
  KAYAKO_PREFERRED_TEAM: z.string().optional(),
  KAYAKO_INBOX_VIEW_ID: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = Object.entries(parsed.error.flatten().fieldErrors)
    .filter(([, errs]) => (errs?.length ?? 0) > 0)
    .map(([key]) => key)
    .join(', ');
  throw new Error(
    `Invalid environment configuration. Missing/invalid: [${missing}]. Copy .env.sample to .env.local and fill values.`,
  );
}

const base = parsed.data;
const inboxViewId = (base.KAYAKO_INBOX_VIEW_ID || '1').trim() || '1';
const agentBase = base.KAYAKO_AGENT_URL.replace(/\/$/, '');
export const env = {
  ...base,
  KAYAKO_INBOX_VIEW_ID: inboxViewId,
  KAYAKO_CONVERSATIONS_URL: `${agentBase}/conversations`,
  KAYAKO_INBOX_VIEW_URL: `${agentBase}/conversations/view/${inboxViewId}`,
} as const;
export type Env = z.infer<typeof EnvSchema> & {
  KAYAKO_CONVERSATIONS_URL: string;
  KAYAKO_INBOX_VIEW_ID: string;
  KAYAKO_INBOX_VIEW_URL: string;
};


