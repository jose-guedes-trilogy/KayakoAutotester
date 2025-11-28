import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import { parse } from 'jsonc-parser';
import { createLogger } from '../lib/logger';

type Suggestion = {
  selector: string;
  occurrences: number;
  sampleFiles: string[];
};

const log = createLogger('suggest');
const STRUCTURE_ROOT = path.join(process.cwd(), 'artifacts', 'structure');
const SELECTORS_JSONC = path.join(process.cwd(), 'selectors', 'selectors.jsonc');
const OUTPUT_DIR = path.join(process.cwd(), 'selectors', 'extracted');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'pending.json');

function ensureArray<T>(value?: T | T[]): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function readExistingSelectors(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(SELECTORS_JSONC, 'utf8');
    const parsed = parse(raw) as Record<string, Record<string, string[] | string>>;
    const set = new Set<string>();
    for (const group of Object.values(parsed || {})) {
      if (!group) continue;
      for (const entry of Object.values(group)) {
        const candidates = ensureArray(entry);
        candidates.forEach((candidate) => set.add(candidate));
      }
    }
    return set;
  } catch (err) {
    log.warn(`Failed to read selectors.jsonc: ${(err as Error)?.message || err}`);
    return new Set();
  }
}

async function resolveStructureDir(crawlId?: string): Promise<{ crawlId: string; dir: string }> {
  try {
    const entries = await fs.readdir(STRUCTURE_ROOT, { withFileTypes: true });
    const dirs = entries.filter((entry) => entry.isDirectory());
    if (dirs.length === 0) {
      throw new Error('No structure capture directories found. Run capture-structure first.');
    }
    if (crawlId) {
      const match = dirs.find((dir) => dir.name === crawlId);
      if (!match) {
        throw new Error(`Structure directory for crawl "${crawlId}" not found.`);
      }
      return { crawlId, dir: path.join(STRUCTURE_ROOT, match.name) };
    }
    // Pick most recently modified directory
    let latest = dirs[0];
    let latestMtime = 0;
    for (const dir of dirs) {
      const stat = await fs.stat(path.join(STRUCTURE_ROOT, dir.name));
      if (stat.mtimeMs > latestMtime) {
        latest = dir;
        latestMtime = stat.mtimeMs;
      }
    }
    return { crawlId: latest.name, dir: path.join(STRUCTURE_ROOT, latest.name) };
  } catch (err) {
    throw new Error((err as Error)?.message || String(err));
  }
}

function extractClassBases(html: string): string[] {
  const bases = new Set<string>();
  const classAttrRegex = /class\s*=\s*"([^"]+)"/gim;
  let match: RegExpExecArray | null;
  while ((match = classAttrRegex.exec(html))) {
    const classNames = match[1]
      .split(/\s+/)
      .map((cls) => cls.trim())
      .filter(Boolean);
    for (const cls of classNames) {
      if (!cls.startsWith('ko-')) continue;
      const lastUnderscore = cls.lastIndexOf('_');
      if (lastUnderscore === -1) continue;
      const suffix = cls.slice(lastUnderscore + 1);
      if (!/^[a-z0-9]{4,}$/i.test(suffix)) continue;
      const base = cls.slice(0, lastUnderscore + 1);
      bases.add(base);
    }
  }
  return Array.from(bases);
}

async function analyseStructureDir(
  dir: string,
  existingSelectors: Set<string>,
): Promise<{ suggestions: Suggestion[]; totalFiles: number }> {
  const files = await fg('**/*.html', { cwd: dir, onlyFiles: true });
  if (files.length === 0) {
    return { suggestions: [], totalFiles: 0 };
  }
  const stats = new Map<
    string,
    {
      count: number;
      files: Set<string>;
    }
  >();

  for (const relative of files) {
    const absPath = path.join(dir, relative);
    const html = await fs.readFile(absPath, 'utf8');
    const bases = extractClassBases(html);
    for (const base of bases) {
      const selector = `[class*='${base}']`;
      if (existingSelectors.has(selector)) continue;
      const entry = stats.get(base) || { count: 0, files: new Set<string>() };
      entry.count += 1;
      entry.files.add(relative);
      stats.set(base, entry);
    }
  }

  const suggestions = Array.from(stats.entries())
    .map(([base, info]) => ({
      selector: `[class*='${base}']`,
      occurrences: info.count,
      sampleFiles: Array.from(info.files).slice(0, 5),
    }))
    .sort((a, b) => b.occurrences - a.occurrences);

  return { suggestions, totalFiles: files.length };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const crawlIdFlagIndex = args.findIndex((arg) => arg === '--crawl-id');
  let crawlId: string | undefined;
  if (crawlIdFlagIndex !== -1) {
    crawlId = args[crawlIdFlagIndex + 1];
  } else {
    const viaEquals = args.find((arg) => arg.startsWith('--crawl-id='));
    if (viaEquals) {
      crawlId = viaEquals.split('=')[1];
    }
  }

  const { crawlId: resolvedCrawlId, dir } = await resolveStructureDir(crawlId);
  log.info(`Scanning structure captures for crawl ${resolvedCrawlId} (${dir})`);

  const existingSelectors = await readExistingSelectors();
  const { suggestions, totalFiles } = await analyseStructureDir(dir, existingSelectors);

  if (suggestions.length === 0) {
    log.info('No new selector suggestions found.');
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    crawlId: resolvedCrawlId,
    sourceDir: path.relative(process.cwd(), dir),
    totalFiles,
    totalSuggestions: suggestions.length,
    suggestions,
  };
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  log.info(`Wrote ${suggestions.length} selector suggestion(s) to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Suggestion script failed', err);
    process.exitCode = 1;
  });
}


