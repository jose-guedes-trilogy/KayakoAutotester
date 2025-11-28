import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { parse } from 'jsonc-parser';
import { createLogger } from '../lib/logger';

const log = createLogger('lint-selectors');

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue; }
interface JsonArray extends Array<JsonValue> {}

interface LintResult {
  filePath: string;
  parseErrors: number;
  arraysDeduped: number;
  entriesDeduped: number;
  warnings: string[];
  fixed: boolean;
}

function isObject(value: JsonValue): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(arr: JsonValue): arr is string[] {
  return Array.isArray(arr) && arr.every((v) => typeof v === 'string');
}

function normalizeSelector(selector: string): string {
  return selector.trim().replace(/\s+/g, ' ');
}

function dedupeArrayPreserveOrder(values: string[]): { next: string[]; removed: number } {
  const seen = new Set<string>();
  const next: string[] = [];
  let removed = 0;
  for (const v of values) {
    const key = normalizeSelector(v);
    if (seen.has(key)) {
      removed += 1;
      continue;
    }
    seen.add(key);
    next.push(v);
  }
  return { next, removed };
}

function lintObject(obj: JsonObject): { arraysDeduped: number; entriesDeduped: number; warnings: string[] } {
  let arraysDeduped = 0;
  let entriesDeduped = 0;
  const warnings: string[] = [];

  const walk = (node: JsonValue, pathChain: string[]) => {
    if (isObject(node)) {
      for (const [k, v] of Object.entries(node)) {
        walk(v as JsonValue, pathChain.concat(k));
      }
      return;
    }
    if (Array.isArray(node)) {
      // If this is an array of strings, dedupe them
      if (isStringArray(node)) {
        const { next, removed } = dedupeArrayPreserveOrder(node);
        if (removed > 0) {
          // mutate in place
          const parent = getParent(obj, pathChain.slice(0, -1));
          if (parent && isObject(parent)) {
            (parent as any)[pathChain[pathChain.length - 1]] = next;
            arraysDeduped += 1;
            entriesDeduped += removed;
          }
        }
        // basic resilience hint
        for (const s of node) {
          if (!s.startsWith('role=') && !s.startsWith('text=') && !s.includes('[class*=')) {
            // allow href patterns explicitly
            if (!s.includes('href') && !s.includes('contenteditable') && !s.includes('aria-')) {
              warnings.push(`Weak selector at ${pathChain.join('.')}: "${s}"`);
            }
          }
        }
      } else {
        // Recurse for nested arrays/objects
        for (let i = 0; i < node.length; i++) {
          walk(node[i] as JsonValue, pathChain.concat(String(i)));
        }
      }
    }
  };

  walk(obj, []);
  return { arraysDeduped, entriesDeduped, warnings };
}

function getParent(root: JsonObject, pathChain: string[]): JsonValue | undefined {
  let cur: any = root;
  for (const key of pathChain) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur as JsonValue;
}

async function main(): Promise<void> {
  const fix = process.argv.includes('--fix');
  const glob = 'selectors/**/*.jsonc';
  const ignore = ['selectors/schema.json', 'selectors/selectors.schema.json', 'selectors/selectors.jsonc'];
  const files = await fg(glob, { ignore, dot: false });
  if (files.length === 0) {
    log.warn('No JSONC files found for pattern %s', glob);
    process.exit(0);
  }

  const results: LintResult[] = [];
  let totalErrors = 0;
  let totalArrays = 0;
  let totalEntries = 0;

  for (const filePath of files) {
    const abs = path.resolve(filePath);
    const content = fs.readFileSync(abs, 'utf8');
    const errors: any[] = [];
    const data = parse(content, errors, { allowTrailingComma: true, disallowComments: false }) as JsonObject | undefined;

    const res: LintResult = {
      filePath,
      parseErrors: errors.length,
      arraysDeduped: 0,
      entriesDeduped: 0,
      warnings: [],
      fixed: false,
    };

    if (!data || errors.length > 0) {
      totalErrors += errors.length || 1;
      log.error('Parse failed for %s (errors=%d)', filePath, errors.length);
      results.push(res);
      continue;
    }

    const { arraysDeduped, entriesDeduped, warnings } = lintObject(data);
    res.arraysDeduped = arraysDeduped;
    res.entriesDeduped = entriesDeduped;
    res.warnings.push(...warnings);
    totalArrays += arraysDeduped;
    totalEntries += entriesDeduped;

    if (fix && (arraysDeduped > 0)) {
      // NOTE: This will drop JSONC comments. We announce loudly.
      const nextStr = JSON.stringify(data, null, 2) + '\n';
      fs.writeFileSync(abs, nextStr, 'utf8');
      res.fixed = true;
    }

    results.push(res);
  }

  for (const r of results) {
    if (r.parseErrors > 0) continue;
    if (r.arraysDeduped > 0 || r.warnings.length > 0) {
      log.info('File %s: arraysDeduped=%d entriesDeduped=%d fixed=%s', r.filePath, r.arraysDeduped, r.entriesDeduped, String(r.fixed));
      for (const w of r.warnings) {
        log.warn('  %s', w);
      }
    } else {
      log.debug('File %s: clean', r.filePath);
    }
  }

  log.info('Summary: files=%d parseErrors=%d arraysDeduped=%d entriesRemoved=%d fixMode=%s', results.length, totalErrors, totalArrays, totalEntries, String(fix));

  if (totalErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  log.error('Unhandled error: %o', err);
  process.exit(1);
});


