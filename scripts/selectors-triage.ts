import fs from 'fs/promises';
import path from 'path';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createLogger } from '../lib/logger';

const log = createLogger('selectors-triage');
const PENDING_FILE = path.join(process.cwd(), 'selectors', 'extracted', 'pending.json');
const HISTORY_FILE = path.join(process.cwd(), 'selectors', 'extracted', 'history.json');

type SuggestionSample = {
  file: string;
  captureId?: string;
  crawlId?: string;
  url?: string;
  type?: string;
  hash?: string;
  sectionId?: string;
};

type SuggestionEntry = {
  id: string;
  selector: string;
  occurrences: number;
  sampleFiles: SuggestionSample[];
  status?: 'pending' | 'approved' | 'rejected' | 'snoozed';
  decidedAt?: string;
  targetGroup?: string;
  targetKey?: string;
  note?: string;
};

type PendingPayload = {
  metadataVersion?: number;
  generatedAt: string;
  crawlId?: string;
  captureId?: string;
  sourceDir?: string;
  totalFiles?: number;
  totalSuggestions?: number;
  suggestions: SuggestionEntry[];
};

type HistoryEntry = {
  timestamp: string;
  selector: string;
  action: 'approved' | 'rejected' | 'snoozed';
  reason?: string;
  targetGroup?: string;
  targetKey?: string;
  crawlId?: string;
  captureId?: string;
  occurrences: number;
  samples: SuggestionSample[];
};

async function readPending(): Promise<PendingPayload> {
  const raw = await fs.readFile(PENDING_FILE, 'utf8');
  return JSON.parse(raw) as PendingPayload;
}

async function writePending(payload: PendingPayload): Promise<void> {
  await fs.writeFile(PENDING_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

async function appendHistory(entry: HistoryEntry): Promise<void> {
  let history: HistoryEntry[] = [];
  try {
    const raw = await fs.readFile(HISTORY_FILE, 'utf8');
    history = JSON.parse(raw) as HistoryEntry[];
  } catch {
    // no history yet
  }
  history.push(entry);
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

function printSuggestion(index: number, total: number, suggestion: SuggestionEntry): void {
  console.log('\n----------------------------------------');
  console.log(`Suggestion ${index + 1}/${total}`);
  console.log(`Selector : ${suggestion.selector}`);
  console.log(`Occurrences: ${suggestion.occurrences}`);
  suggestion.sampleFiles.forEach((sample, idx) => {
    console.log(
      `  [${idx + 1}] ${sample.file} | type=${sample.type ?? 'unknown'} | capture=${
        sample.captureId ?? '-'
      } | hash=${sample.hash ?? '-'}`,
    );
  });
}

async function prompt(question: string, rl: readline.Interface): Promise<string> {
  const answer = await rl.question(question);
  return answer.trim();
}

async function triage(): Promise<void> {
  let pending: PendingPayload;
  try {
    pending = await readPending();
  } catch (error) {
    throw new Error(
      `Unable to read ${PENDING_FILE}. Generate suggestions first (npm run selectors:suggest).`,
    );
  }

  const queue = pending.suggestions.filter(
    (suggestion) => (suggestion.status || 'pending') === 'pending',
  );

  if (queue.length === 0) {
    log.info('No pending selectors to triage.');
    return;
  }

  const rl = readline.createInterface({ input, output });
  try {
    for (let i = 0; i < queue.length; i++) {
      const suggestion = queue[i];
      printSuggestion(i, queue.length, suggestion);
      const actionInput = await prompt(
        'Action? [a]pprove / [r]eject / [s]nooze / [q]uit: ',
        rl,
      );
      const actionChar = actionInput.toLowerCase();
      if (actionChar === 'q') {
        break;
      }
      const timestamp = new Date().toISOString();
      if (actionChar === 'a') {
        const targetGroup = await prompt('Target selector group (e.g., inbox): ', rl);
        const targetKey = await prompt('Target selector key (e.g., rowSubject): ', rl);
        const reason = await prompt('Approval notes (optional): ', rl);
        suggestion.status = 'approved';
        suggestion.decidedAt = timestamp;
        suggestion.targetGroup = targetGroup || undefined;
        suggestion.targetKey = targetKey || undefined;
        suggestion.note = reason || undefined;
        await appendHistory({
          timestamp,
          selector: suggestion.selector,
          action: 'approved',
          reason: reason || undefined,
          targetGroup: targetGroup || undefined,
          targetKey: targetKey || undefined,
          crawlId: pending.crawlId,
          captureId: pending.captureId,
          occurrences: suggestion.occurrences,
          samples: suggestion.sampleFiles,
        });
        log.info(`Approved ${suggestion.selector}`);
      } else if (actionChar === 'r') {
        const reason = await prompt('Reason for rejection: ', rl);
        suggestion.status = 'rejected';
        suggestion.decidedAt = timestamp;
        suggestion.note = reason || undefined;
        await appendHistory({
          timestamp,
          selector: suggestion.selector,
          action: 'rejected',
          reason: reason || undefined,
          crawlId: pending.crawlId,
          captureId: pending.captureId,
          occurrences: suggestion.occurrences,
          samples: suggestion.sampleFiles,
        });
        log.info(`Rejected ${suggestion.selector}`);
      } else if (actionChar === 's') {
        const reason = await prompt('Snooze notes (optional): ', rl);
        suggestion.status = 'snoozed';
        suggestion.decidedAt = timestamp;
        suggestion.note = reason || undefined;
        await appendHistory({
          timestamp,
          selector: suggestion.selector,
          action: 'snoozed',
          reason: reason || undefined,
          crawlId: pending.crawlId,
          captureId: pending.captureId,
          occurrences: suggestion.occurrences,
          samples: suggestion.sampleFiles,
        });
        log.info(`Snoozed ${suggestion.selector}`);
      } else {
        log.info('Unknown action, skipping.');
        continue;
      }
      await writePending(pending);
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  triage().catch((err) => {
    log.error('Selector triage failed', err);
    process.exitCode = 1;
  });
}


