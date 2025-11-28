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
export const env = {
  ...base,
  KAYAKO_CONVERSATIONS_URL: `${base.KAYAKO_AGENT_URL.replace(/\/$/, '')}/conversations`,
} as const;
export type Env = z.infer<typeof EnvSchema> & {
  KAYAKO_CONVERSATIONS_URL: string;
};


