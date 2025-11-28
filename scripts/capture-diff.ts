import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../lib/logger';

const log = createLogger('capture-diff');

type DiffFlags = {
  current?: string;
  previous?: string;
  output?: string;
};

type ArtifactRegistry = {
  lastCaptureId?: string;
  captures: Record<string, CaptureRunRecord>;
};

type CaptureRunRecord = {
  captureId: string;
  crawlId: string;
  startedAt: string;
  completedAt?: string;
  urls: Record<string, ArtifactEntry>;
};

type ArtifactEntry = {
  url: string;
  htmlPath: string;
  htmlHash: string;
  sections: Array<{
    id?: string;
    selector: string;
    path: string;
    hash: string;
  }>;
  screenshotPath?: string;
  screenshotHash?: string;
  capturedAt: string;
};

type DiffEntry =
  | {
      type: 'added';
      url: string;
      current: ArtifactEntry;
    }
  | {
    type: 'removed';
    url: string;
    previous: ArtifactEntry;
  }
  | {
    type: 'changed';
    url: string;
    severity: 'structural' | 'cosmetic';
    htmlChanged: boolean;
    screenshotChanged: boolean;
    sectionChanges: SectionChange[];
    previous: ArtifactEntry;
    current: ArtifactEntry;
  };

type SectionChange = {
  id?: string;
  selector: string;
  path?: string;
  status: 'added' | 'removed' | 'changed';
  previousHash?: string;
  currentHash?: string;
};

type DiffReport = {
  currentCaptureId: string;
  previousCaptureId: string;
  generatedAt: string;
  summary: {
    totalCompared: number;
    added: number;
    removed: number;
    changedStructural: number;
    changedCosmetic: number;
    unchanged: number;
  };
  entries: DiffEntry[];
};

function parseFlags(): DiffFlags {
  const args = process.argv.slice(2);
  const flags: DiffFlags = {};
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) continue;
    const eqIdx = token.indexOf('=');
    let key = '';
    let value = '';
    if (eqIdx !== -1) {
      key = token.slice(2, eqIdx);
      value = token.slice(eqIdx + 1);
    } else {
      key = token.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        value = next;
        i++;
      } else {
        value = 'true';
      }
    }
    const normalized = key.toLowerCase();
    switch (normalized) {
      case 'current':
      case 'capture':
        flags.current = value;
        break;
      case 'previous':
      case 'baseline':
        flags.previous = value;
        break;
      case 'output':
        flags.output = value;
        break;
      default:
        log.warn(`Unknown flag ignored: --${key}`);
    }
  }
  return flags;
}

async function readArtifactRegistry(filePath: string): Promise<ArtifactRegistry> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as ArtifactRegistry;
}

function findPreviousCapture(
  registry: ArtifactRegistry,
  currentId: string,
): string | undefined {
  const captures = Object.values(registry.captures)
    .filter((capture) => !!capture.startedAt)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const idx = captures.findIndex((capture) => capture.captureId === currentId);
  if (idx <= 0) return undefined;
  return captures[idx - 1]?.captureId;
}

function computeSectionDiff(
  previous: ArtifactEntry | undefined,
  current: ArtifactEntry | undefined,
): SectionChange[] {
  const diffs: SectionChange[] = [];
  const prevMap = new Map<string, { id?: string; selector: string; path?: string; hash: string }>();
  const currMap = new Map<string, { id?: string; selector: string; path?: string; hash: string }>();

  if (previous) {
    for (const section of previous.sections) {
      const key = section.id || section.selector;
      prevMap.set(key, {
        id: section.id,
        selector: section.selector,
        path: section.path,
        hash: section.hash,
      });
    }
  }
  if (current) {
    for (const section of current.sections) {
      const key = section.id || section.selector;
      currMap.set(key, {
        id: section.id,
        selector: section.selector,
        path: section.path,
        hash: section.hash,
      });
    }
  }

  const keys = new Set([...prevMap.keys(), ...currMap.keys()]);
  for (const key of keys) {
    const prevSection = prevMap.get(key);
    const currSection = currMap.get(key);
    if (prevSection && !currSection) {
      diffs.push({
        id: prevSection.id,
        selector: prevSection.selector,
        path: prevSection.path,
        status: 'removed',
        previousHash: prevSection.hash,
      });
    } else if (!prevSection && currSection) {
      diffs.push({
        id: currSection.id,
        selector: currSection.selector,
        path: currSection.path,
        status: 'added',
        currentHash: currSection.hash,
      });
    } else if (
      prevSection &&
      currSection &&
      prevSection.hash !== currSection.hash
    ) {
      diffs.push({
        id: currSection.id,
        selector: currSection.selector,
        path: currSection.path,
        status: 'changed',
        previousHash: prevSection.hash,
        currentHash: currSection.hash,
      });
    }
  }
  return diffs;
}

function buildReport(
  currentId: string,
  previousId: string,
  current: CaptureRunRecord,
  previous: CaptureRunRecord,
): DiffReport {
  const urls = new Set([
    ...Object.keys(previous.urls || {}),
    ...Object.keys(current.urls || {}),
  ]);

  const entries: DiffEntry[] = [];
  let added = 0;
  let removed = 0;
  let changedStructural = 0;
  let changedCosmetic = 0;
  let unchanged = 0;

  for (const url of urls) {
    const prevEntry = previous.urls[url];
    const currEntry = current.urls[url];
    if (prevEntry && !currEntry) {
      removed += 1;
      entries.push({
        type: 'removed',
        url,
        previous: prevEntry,
      });
      continue;
    }
    if (!prevEntry && currEntry) {
      added += 1;
      entries.push({
        type: 'added',
        url,
        current: currEntry,
      });
      continue;
    }
    if (!prevEntry || !currEntry) continue;
    const htmlChanged = prevEntry.htmlHash !== currEntry.htmlHash;
    const screenshotChanged =
      (prevEntry.screenshotHash || null) !== (currEntry.screenshotHash || null);
    const sectionChanges = computeSectionDiff(prevEntry, currEntry);
    const hasSectionChanges = sectionChanges.length > 0;
    if (!htmlChanged && !screenshotChanged && !hasSectionChanges) {
      unchanged += 1;
      continue;
    }
    const severity: 'structural' | 'cosmetic' = htmlChanged || hasSectionChanges ? 'structural' : 'cosmetic';
    if (severity === 'structural') {
      changedStructural += 1;
    } else {
      changedCosmetic += 1;
    }
    entries.push({
      type: 'changed',
      url,
      severity,
      htmlChanged,
      screenshotChanged,
      sectionChanges,
      previous: prevEntry,
      current: currEntry,
    });
  }

  return {
    currentCaptureId: currentId,
    previousCaptureId: previousId,
    generatedAt: new Date().toISOString(),
    summary: {
      totalCompared: urls.size,
      added,
      removed,
      changedStructural,
      changedCosmetic,
      unchanged,
    },
    entries,
  };
}

async function main(): Promise<void> {
  const flags = parseFlags();
  const artifactPath = path.join(process.cwd(), 'storage', 'map', 'artifacts.json');
  const registry = await readArtifactRegistry(artifactPath);
  const currentId = flags.current || registry.lastCaptureId;
  if (!currentId) {
    throw new Error('No capture data available. Run pipeline capture first.');
  }
  const current = registry.captures[currentId];
  if (!current) {
    throw new Error(`Capture not found in registry: ${currentId}`);
  }

  const previousId = flags.previous || findPreviousCapture(registry, currentId);
  if (!previousId) {
    throw new Error('Unable to determine previous capture. Provide --previous explicitly.');
  }
  const previous = registry.captures[previousId];
  if (!previous) {
    throw new Error(`Previous capture not found in registry: ${previousId}`);
  }

  const report = buildReport(currentId, previousId, current, previous);

  const outputDir =
    flags.output && flags.output.trim().length > 0
      ? path.isAbsolute(flags.output)
        ? flags.output
        : path.join(process.cwd(), flags.output)
      : path.join(process.cwd(), 'storage', 'map', 'capture-diffs');
  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `${currentId}_vs_${previousId}.json`.replace(/[^a-z0-9._-]/gi, '_');
  const target = path.join(outputDir, fileName);
  await fs.writeFile(target, JSON.stringify(report, null, 2), 'utf8');

  log.info(
    `Diff complete`,
    JSON.stringify({
      current: currentId,
      previous: previousId,
      output: path.relative(process.cwd(), target).replace(/\\/g, '/'),
      summary: report.summary,
    }),
  );
}

if (require.main === module) {
  main().catch((err) => {
    log.error('Capture diff failed', err);
    process.exitCode = 1;
  });
}


