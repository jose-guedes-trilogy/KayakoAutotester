/*
  Validates selectors/selectors.jsonc for:
  - JSONC schema correctness
  - Duplicate selector strings across keys
  - Presence of a preceding comment for each selector key (best-effort)
  - Preference for change-resilient selectors (warn when no preferred prefix)
*/
import fs from 'fs';
import path from 'path';
import { parse, parseTree, type Node } from 'jsonc-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const SELECTORS_PATH = path.join(ROOT, 'selectors', 'selectors.jsonc');
const SCHEMA_PATH = path.join(ROOT, 'selectors', 'selectors.schema.json');

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function loadJsonc<T>(filePath: string): { data: T; tree: Node } {
  const content = readFile(filePath);
  const errors: any[] = [];
  const tree = parseTree(content, errors, { allowTrailingComma: true, disallowComments: false });
  if (!tree) throw new Error(`Failed to parse JSONC: ${filePath}. Errors: ${JSON.stringify(errors)}`);
  const data = parse(content) as T;
  return { data, tree };
}

function validateSchema(json: unknown, schema: any) {
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema as any);
  const ok = validate(json);
  if (!ok) {
    const messages = (validate.errors || []).map((e) => `${e.instancePath} ${e.message}`).join('\n');
    throw new Error(`Schema validation failed for selectors.jsonc:\n${messages}`);
  }
}

function* walkSelectorEntries(obj: any): Generator<{ pageKey: string; itemKey: string; value: string[] }>
{
  for (const [pageKey, value] of Object.entries(obj)) {
    if (!value || typeof value !== 'object') continue;
    for (const [itemKey, sel] of Object.entries(value as Record<string, unknown>)) {
      if (Array.isArray(sel)) {
        yield { pageKey, itemKey, value: sel as string[] };
      } else if (typeof sel === 'string') {
        yield { pageKey, itemKey, value: [sel] };
      }
    }
  }
}

function hasPreferredPrefix(selector: string): boolean {
  const preferred = selector.includes("[class*=\"") || selector.includes("[class*='");
  if (preferred) return true;
  // Accept alternatives (data-, role/aria-, semantic attributes) as resilient options
  const alternatives = ['[data-', 'role=', 'aria-', "button:has-text(", 'input[type=', 'a[href*=', 'nav ', 'form[role='];
  return alternatives.some((frag) => selector.includes(frag));
}

function findCommentAbove(raw: string, key: string): boolean {
  // naive scan: find first match of "\"key\":"
  const regex = new RegExp(`\"${key}\"\\s*:`, 'g');
  const match = regex.exec(raw);
  if (!match) return false;
  const idx = match.index;
  const before = raw.slice(0, idx);
  const lines = before.split(/\r?\n/).map((l) => l.trimEnd());
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === '') continue;
    if (line.startsWith('//') || line.endsWith('*/')) return true;
    // stop when we hit a comma or opening brace (no inline comment found)
    if (line.endsWith('{') || line.endsWith(',') || line.endsWith('[')) return false;
  }
  return false;
}

function main() {
  console.log(`[validate-selectors] Using selectors at ${SELECTORS_PATH}`);
  const raw = readFile(SELECTORS_PATH);
  const { data } = loadJsonc<Record<string, any>>(SELECTORS_PATH);
  const schema = JSON.parse(readFile(SCHEMA_PATH));

  // 1) Schema validation
  validateSchema(data, schema);
  console.log('[validate-selectors] Schema: OK');

  // 2) Duplicate selectors across keys
  const selectorToKeys = new Map<string, string[]>();
  for (const { pageKey, itemKey, value } of walkSelectorEntries(data)) {
    for (const sel of value) {
      const keys = selectorToKeys.get(sel) ?? [];
      keys.push(`${pageKey}.${itemKey}`);
      selectorToKeys.set(sel, keys);
    }
  }
  const duplicateEntries = Array.from(selectorToKeys.entries()).filter(([, keys]) => keys.length > 1);
  if (duplicateEntries.length > 0) {
    console.error('[validate-selectors] ERROR: Duplicate selector strings detected:');
    for (const [sel, keys] of duplicateEntries) {
      console.error(`  ${sel}  <- ${keys.join(', ')}`);
    }
    process.exit(1);
  }
  console.log('[validate-selectors] Duplicates: none');

  // 3) Comment presence (best-effort)
  const missingComments: string[] = [];
  for (const { pageKey, itemKey } of walkSelectorEntries(data)) {
    if (!findCommentAbove(raw, itemKey)) {
      missingComments.push(`${pageKey}.${itemKey}`);
    }
  }
  if (missingComments.length > 0) {
    console.error('[validate-selectors] ERROR: Missing descriptive comments for:');
    for (const k of missingComments) console.error(`  ${k}`);
    process.exit(1);
  }
  console.log('[validate-selectors] Comments: present for all keys');

  // 4) Resilience preference warnings
  const warnings: string[] = [];
  for (const { pageKey, itemKey, value } of walkSelectorEntries(data)) {
    const ok = value.some((sel) => hasPreferredPrefix(sel));
    if (!ok) warnings.push(`${pageKey}.${itemKey}`);
  }
  if (warnings.length > 0) {
    console.warn('[validate-selectors] WARN: Some keys lack preferred resilient selector prefixes:');
    for (const k of warnings) console.warn(`  ${k}`);
  } else {
    console.log('[validate-selectors] Resilience: preferred prefixes found');
  }

  console.log('[validate-selectors] All checks passed.');
}

main();


