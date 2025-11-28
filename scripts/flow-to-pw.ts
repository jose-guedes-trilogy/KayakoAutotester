/*
  Convert MCP flow YAML files to Playwright tests in tests/generated/
  Usage: ts-node scripts/flow-to-pw.ts mcp/flows/login-and-open-inbox.yml
*/
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import fg from 'fast-glob';

type Step =
  | { type: 'goto'; url: string }
  | { type: 'fill'; selectorKey: string; value: string }
  | { type: 'click'; selectorKey: string }
  | { type: 'dispatch-click'; selectorKey: string }
  | { type: 'dispatch-click-text'; value: string }
  | { type: 'expect-visible'; selectorKey: string }
  | { type: 'expect-url-contains'; value: string }
  | { type: 'wait'; value: string }
  | { type: 'press'; key: string; selectorKey?: string };

type Flow = {
  name: string;
  description?: string;
  steps: Step[];
};

function resolveEnvToken(value: string): string {
  if (!value.startsWith('env.')) return JSON.stringify(value);
  // Support suffixes like env.VAR/something by concatenation
  const m = value.match(/^env\.([A-Z0-9_]+)(.*)$/i);
  if (!m) return JSON.stringify(value);
  const varName = m[1];
  const suffix = m[2] ?? '';
  if (!suffix) return `env.${varName}`;
  return `env.${varName} + ${JSON.stringify(suffix)}`;
}

function selectorGroupAndKey(selectorKey: string): { group: string; key: string } {
  const [group, key] = selectorKey.split('.');
  if (!group || !key) throw new Error(`Invalid selectorKey: ${selectorKey}`);
  return { group, key };
}

function generateTest(flow: Flow): string {
  const lines: string[] = [];
  lines.push("import { test, expect } from '../../fixtures/auth.fixture';");
  lines.push("import { env } from '../../config/env';");
  lines.push("import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText } from '../../selectors';");
  lines.push('');
  lines.push(`test.describe(${JSON.stringify(flow.description ?? flow.name)}, () => {`);
  lines.push(`  test('${flow.name}', async ({ authenticatedPage: page }) => {`);
  for (const step of flow.steps) {
    const optional = (step as any).optional === true;
    const optBegin = optional ? `    try {` : '';
    const optEnd = optional ? `    } catch (e) { console.warn('Optional step failed (${(step as any).type})', e); }` : '';
    switch (step.type) {
      case 'goto': {
        if (optional) lines.push(optBegin);
        lines.push(`    await page.goto(${resolveEnvToken((step as any).url)});`);
        if (optional) lines.push(optEnd);
        break;
      }
      case 'fill': {
        const { group, key } = selectorGroupAndKey((step as any).selectorKey);
        // Skip login.* interactions because fixture authenticates already
        if (group === 'login') break;
        const valueExpr = resolveEnvToken((step as any).value);
        if (optional) lines.push(optBegin);
        lines.push(`    await fillSel(page, '${group}', '${key}', ${valueExpr});`);
        if (optional) lines.push(optEnd);
        break;
      }
      case 'click': {
        const { group, key } = selectorGroupAndKey((step as any).selectorKey);
        if (group === 'login') break;
        if (optional) lines.push(optBegin);
        lines.push(`    await click(page, '${group}', '${key}');`);
        if (optional) lines.push(optEnd);
        break;
      }
      case 'dispatch-click': {
        const { group, key } = selectorGroupAndKey((step as any).selectorKey);
        if (group === 'login') break;
        if (optional) lines.push(optBegin);
        lines.push(`    await dispatchClickCss(page, '${group}', '${key}');`);
        if (optional) lines.push(optEnd);
        break;
      }
      case 'dispatch-click-text': {
        const value = (step as any).value as string;
        if (optional) lines.push(optBegin);
        lines.push(`    await dispatchClickText(page, ${JSON.stringify(value)});`);
        if (optional) lines.push(optEnd);
        break;
      }
      case 'expect-visible': {
        const { group, key } = selectorGroupAndKey((step as any).selectorKey);
        if (group === 'login') break;
        if (optional) lines.push(optBegin);
        lines.push(`    await expectVisible(page, '${group}', '${key}');`);
        if (optional) lines.push(optEnd);
        break;
      }
      case 'expect-url-contains': {
        const value = (step as any).value as string;
        if (optional) lines.push(optBegin);
        lines.push(`    await expect(page).toHaveURL(new RegExp(${JSON.stringify(value)}));`);
        if (optional) lines.push(optEnd);
        break;
      }
      case 'wait': {
        const ms = parseInt((step as any).value, 10) || 0;
        if (optional) lines.push(optBegin);
        lines.push(`    await page.waitForTimeout(${ms});`);
        if (optional) lines.push(optEnd);
        break;
      }
      case 'press': {
        const s = step as any;
        if (s.selectorKey) {
          const { group, key } = selectorGroupAndKey(s.selectorKey);
          if (group === 'login') break;
          if (optional) lines.push(optBegin);
          lines.push(`    { const r = await (await import('../../selectors')).firstAvailableLocator(page, '${group}', '${key}'); await r.locator.press(${JSON.stringify(s.key)}); }`);
          if (optional) lines.push(optEnd);
        } else {
          if (optional) lines.push(optBegin);
          lines.push(`    await page.keyboard.press(${JSON.stringify(s.key)});`);
          if (optional) lines.push(optEnd);
        }
        break;
      }
    }
  }
  lines.push('  });');
  lines.push('});');
  return lines.join('\n');
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const patterns = process.argv.slice(2);
  if (patterns.length === 0) {
    console.error('Usage: ts-node scripts/flow-to-pw.ts <flow.yml> [more.yml]');
    process.exit(1);
  }
  const outDir = path.join(process.cwd(), 'tests', 'generated');
  ensureDir(outDir);
  const files = fg.sync(patterns);
  if (files.length === 0) {
    console.error('No flow files matched patterns:', patterns.join(' '));
    process.exit(1);
  }
  for (const file of files) {
    const abs = path.resolve(file);
    const content = fs.readFileSync(abs, 'utf8');
    const flow = YAML.parse(content) as Partial<Flow>;
    if (!flow || typeof flow.name !== 'string' || !Array.isArray(flow.steps)) {
      console.warn(`Skipping non-flow file: ${file}`);
      continue;
    }
    const spec = generateTest(flow as Flow);
    const outPath = path.join(outDir, `${flow.name}.spec.ts`);
    fs.writeFileSync(outPath, spec, 'utf8');
    console.log(`Generated: ${outPath}`);
  }
}

main();


