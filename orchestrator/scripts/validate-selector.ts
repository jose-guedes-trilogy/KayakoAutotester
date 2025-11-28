import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import { parse } from 'jsonc-parser';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? String(argv[++i]) : 'true';
      out[key] = val;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const group = args.group;
  const key = args.key;
  if (!group || !key) {
    console.log(JSON.stringify({ ok: false, error: 'Missing --group and/or --key' }));
    process.exit(2);
    return;
  }
  const baseURL = args.baseURL || process.env.KAYAKO_AGENT_URL || process.env.KAYAKO_BASE_URL || 'about:blank';

  const selectorsPath = path.join(process.cwd(), 'selectors', 'selectors.jsonc');
  const raw = fs.readFileSync(selectorsPath, 'utf8');
  const data = parse(raw) as Record<string, Record<string, string[] | string>>;
  const groupObj = data[group];
  if (!groupObj) {
    console.log(JSON.stringify({ ok: false, error: `Unknown group: ${group}` }));
    process.exit(1);
    return;
  }
  const val = groupObj[key];
  if (!val) {
    console.log(JSON.stringify({ ok: false, error: `Unknown key: ${group}.${key}` }));
    process.exit(1);
    return;
  }
  const candidates = Array.isArray(val) ? val : [val];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let ok = false;
  let usedSelector = '';
  let fallbackIndex = -1;
  try {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    for (let i = 0; i < candidates.length; i++) {
      const sel = candidates[i];
      try {
        const loc = page.locator(sel).first();
        await loc.waitFor({ state: 'attached', timeout: 2000 });
        const count = await loc.count();
        if (count > 0) {
          // Optionally verify visible
          await loc.first().waitFor({ state: 'visible', timeout: 500 }).catch(() => {});
          usedSelector = sel;
          fallbackIndex = i;
          ok = true;
          break;
        }
      } catch {
        // try next
      }
    }
  } catch (e: any) {
    console.log(JSON.stringify({ ok: false, error: e?.message || String(e) }));
    await browser.close();
    process.exit(1);
    return;
  }
  await browser.close();
  console.log(JSON.stringify({ ok, usedSelector, fallbackIndex }));
}

main();


