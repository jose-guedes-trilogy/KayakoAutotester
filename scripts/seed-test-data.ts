import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import { chromium, Browser, Page } from '@playwright/test';
import { env } from '../config/env';
import { LoginPage } from '../pages/LoginPage';
import { createLogger, setLogContext } from '../lib/logger';

const log = createLogger('seed');
const SEED_DIR = path.join(process.cwd(), 'storage', 'seeds');
const LEDGER_FILE = path.join(process.cwd(), 'storage', 'changes.log');

type SeedVault = {
  tickets?: Array<{
    id: string;
    subject: string;
    status?: string;
    tags?: string[];
    macro?: string;
  }>;
  macros?: Array<{
    name: string;
    actions?: string[];
  }>;
};

async function readSeedVault(names?: string[]): Promise<SeedVault> {
  const vault: SeedVault = {};
  const targets = names && names.length > 0 ? names : await fs.readdir(SEED_DIR);
  for (const entry of targets) {
    if (!entry.endsWith('.yml') && !entry.endsWith('.yaml')) continue;
    const full = path.join(SEED_DIR, entry);
    const raw = await fs.readFile(full, 'utf8');
    const data = YAML.parse(raw) as SeedVault;
    vault.tickets = [...(vault.tickets || []), ...(data.tickets || [])];
    vault.macros = [...(vault.macros || []), ...(data.macros || [])];
  }
  return vault;
}

async function logChange(line: string): Promise<void> {
  await fs.appendFile(
    LEDGER_FILE,
    `${new Date().toISOString()} ${line}${line.endsWith('\n') ? '' : '\n'}`,
    'utf8',
  );
}

async function ensureLoggedIn(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const login = new LoginPage(page);
  await login.login(env.KAYAKO_USERNAME, env.KAYAKO_PASSWORD);
  return { browser, page };
}

async function seedTickets(page: Page, tickets: SeedVault['tickets']): Promise<void> {
  if (!tickets || tickets.length === 0) return;
  for (const ticket of tickets) {
    log.info(`(noop) Would seed ticket ${ticket.subject}`);
    await logChange(`ticket ${ticket.id || 'new'} subject="${ticket.subject}" status=${
      ticket.status ?? 'n/a'
    } tags=${ticket.tags?.join(',') ?? '[]'}`);
  }
}

async function seedMacros(page: Page, macros: SeedVault['macros']): Promise<void> {
  if (!macros || macros.length === 0) return;
  for (const macro of macros) {
    log.info(`(noop) Would ensure macro ${macro.name}`);
    await logChange(`macro ${macro.name} actions=${macro.actions?.join(',') ?? '[]'}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const selected = args.filter((arg) => !arg.startsWith('--'));
  const vault = await readSeedVault(selected);
  if (!vault.tickets && !vault.macros) {
    log.warn('No seed data found; add YAML under storage/seeds/');
    return;
  }

  const { browser, page } = await ensureLoggedIn();
  setLogContext({ flowId: 'seed' });
  try {
    await seedTickets(page, vault.tickets);
    await seedMacros(page, vault.macros);
  } finally {
    await browser.close();
  }
  log.info('Seeding complete (see ledger for details).');
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Seed script failed', err);
    process.exitCode = 1;
  });
}


