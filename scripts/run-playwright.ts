import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function generateRunId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const id =
    now.getFullYear() +
    '-' +
    pad(now.getMonth() + 1) +
    '-' +
    pad(now.getDate()) +
    '_' +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    '-' +
    Math.random().toString(36).slice(2, 8);
  return id;
}

async function main() {
  const args = process.argv.slice(2);
  const runId = process.env.RUN_ID?.trim() || generateRunId();
  const maxMs = Math.max(10000, parseInt(process.env.PW_MAX_RUN_MS || '180000', 10));

  const base = path.join(process.cwd(), 'runs', runId);
  ensureDir(base);
  ensureDir(path.join(base, 'artifacts'));

  console.log(`[run-playwright] RUN_ID=${runId} (max ${maxMs}ms)`);
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['--yes', 'playwright', 'test', '-c', 'config/playwright.config.ts', ...args],
    {
      stdio: 'inherit',
      env: { ...process.env, RUN_ID: runId },
    },
  );

  const killer = setTimeout(() => {
    console.error(`[run-playwright] Max runtime exceeded (${maxMs}ms). Killing process...`);
    try {
      if (process.platform === 'win32') {
        child.kill('SIGTERM');
      } else {
        process.kill(-child.pid, 'SIGTERM'); // try group
        child.kill('SIGTERM');
      }
    } catch {}
  }, maxMs);

  child.on('exit', (code) => {
    clearTimeout(killer);
    console.log(`[run-playwright] Exit code: ${code}`);
    process.exit(code === null ? 1 : code);
  });

  child.on('error', (err) => {
    clearTimeout(killer);
    console.error('[run-playwright] Failed to start Playwright:', err);
    process.exit(1);
  });
}

main().catch((e) => {
  console.error('[run-playwright] Uncaught error:', e);
  process.exit(1);
});


