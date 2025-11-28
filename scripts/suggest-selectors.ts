import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import { parse } from 'jsonc-parser';
import { createHash } from 'crypto';
import { createLogger } from '../lib/logger';

type SuggestionSample = {
  file: string;
  captureId?: string;
  crawlId?: string;
  url?: string;
  type: 'html' | 'section' | 'unknown';
  hash?: string;
  sectionId?: string;
};

type Suggestion = {
  id: string;
  selector: string;
  occurrences: number;
  sampleFiles: SuggestionSample[];
  status: 'pending' | 'approved' | 'rejected' | 'snoozed';
};

type ArtifactRegistry = {
  captures: Record<
    string,
    {
      captureId: string;
      crawlId: string;
      urls: Record<string, ArtifactEntry>;
    }
  >;
};

type ArtifactEntry = {
  url: string;
  htmlPath: string;
  htmlHash: string;
  sections?: Array<{
    id?: string;
    path: string;
    hash: string;
  }>;
};

type ArtifactIndexEntry = {
  type: 'html' | 'section';
  captureId: string;
  crawlId: string;
  url: string;
  hash: string;
  sectionId?: string;
};

const log = createLogger('suggest');
const STRUCTURE_ROOT = path.join(process.cwd(), 'artifacts', 'structure');
const SELECTORS_JSONC = path.join(process.cwd(), 'selectors', 'selectors.jsonc');
const OUTPUT_DIR = path.join(process.cwd(), 'selectors', 'extracted');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'pending.json');
const ARTIFACTS_REGISTRY = path.join(process.cwd(), 'storage', 'map', 'artifacts.json');

function ensureArray<T>(value?: T | T[]): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const normalizePath = (filePath: string): string =>
  path.normalize(filePath).replace(/\\/g, '/');

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

async function buildArtifactIndex(): Promise<Map<string, ArtifactIndexEntry>> {
  const index = new Map<string, ArtifactIndexEntry>();
  try {
    const raw = await fs.readFile(ARTIFACTS_REGISTRY, 'utf8');
    const registry = JSON.parse(raw) as ArtifactRegistry;
    for (const capture of Object.values(registry.captures || {})) {
      if (!capture?.urls) continue;
      for (const entry of Object.values(capture.urls)) {
        if (!entry) continue;
        const htmlPath = normalizePath(entry.htmlPath);
        index.set(htmlPath, {
          type: 'html',
          captureId: capture.captureId,
          crawlId: capture.crawlId,
          url: entry.url,
          hash: entry.htmlHash,
        });
        for (const section of entry.sections || []) {
          const sectionPath = normalizePath(section.path);
          index.set(sectionPath, {
            type: 'section',
            captureId: capture.captureId,
            crawlId: capture.crawlId,
            url: entry.url,
            hash: section.hash,
            sectionId: section.id,
          });
        }
      }
    }
  } catch (err) {
    log.warn(
      `Artifact registry unavailable (${ARTIFACTS_REGISTRY}): ${(err as Error)?.message || err}`,
    );
  }
  return index;
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

const makeSuggestionId = (selector: string): string =>
  createHash('sha1').update(selector).digest('hex').slice(0, 10);

function buildSampleEntries(
  baseDir: string,
  files: string[],
  artifactIndex: Map<string, ArtifactIndexEntry>,
): SuggestionSample[] {
  return files.slice(0, 5).map((relative) => {
    const repoRelative = normalizePath(
      path.relative(process.cwd(), path.join(baseDir, relative)),
    );
    const artifact = artifactIndex.get(repoRelative);
    return {
      file: repoRelative,
      captureId: artifact?.captureId,
      crawlId: artifact?.crawlId,
      url: artifact?.url,
      type: artifact?.type ?? 'unknown',
      hash: artifact?.hash,
      sectionId: artifact?.sectionId,
    };
  });
}

async function analyseStructureDir(
  dir: string,
  existingSelectors: Set<string>,
  artifactIndex: Map<string, ArtifactIndexEntry>,
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
    .map(([base, info]) => {
      const selector = `[class*='${base}']`;
      return {
        id: makeSuggestionId(selector),
        selector,
        occurrences: info.count,
        sampleFiles: buildSampleEntries(dir, Array.from(info.files), artifactIndex),
        status: 'pending' as const,
      };
    })
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
  const artifactIndex = await buildArtifactIndex();
  const { suggestions, totalFiles } = await analyseStructureDir(
    dir,
    existingSelectors,
    artifactIndex,
  );

  if (suggestions.length === 0) {
    log.info('No new selector suggestions found.');
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const payload = {
    metadataVersion: 2,
    generatedAt: new Date().toISOString(),
    crawlId: resolvedCrawlId,
    captureId: path.basename(dir),
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


