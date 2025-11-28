import util from 'util';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

type LogContext = {
  runId?: string;
  crawlId?: string;
  flowId?: string;
};

const normalize = (value?: string | null): string | undefined => {
  const trimmed = (value || '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

let globalContext: LogContext = {
  runId: normalize(process.env.RUN_ID),
  crawlId: normalize(process.env.KAYAKO_CRAWL_ID),
  flowId: normalize(process.env.KAYAKO_FLOW_ID),
};

export function setLogContext(partial: LogContext): void {
  if (!partial) return;
  globalContext = {
    ...globalContext,
    ...Object.fromEntries(
      Object.entries(partial)
        .filter(([, value]) => value !== undefined && value !== null && String(value).length > 0),
    ),
  };
}

function renderContext(): string {
  const bits: string[] = [];
  if (globalContext.runId) bits.push(`run=${globalContext.runId}`);
  if (globalContext.crawlId) bits.push(`crawl=${globalContext.crawlId}`);
  if (globalContext.flowId) bits.push(`flow=${globalContext.flowId}`);
  return bits.join(' ');
}

function format(level: LogLevel, scope: string, args: unknown[]): unknown[] {
  const ts = new Date().toISOString();
  const ctx = renderContext();
  const scopeWithContext = ctx ? `${scope} ${ctx}` : scope;
  return [`[${ts}] [${level.toUpperCase()}] [${scopeWithContext}]`, ...args];
}

export function createLogger(scope: string): Logger {
  async function forwardToOrchestrator(level: LogLevel, scopeName: string, args: unknown[]) {
    try {
      const runId = normalize(process.env.RUN_ID) || globalContext.runId;
      if (!runId) return;
      const orch = (process.env.KAYAKO_ORCH_URL || 'http://127.0.0.1:7333').replace(/\/+$/, '');
      const line = util.format(...(format(level, scopeName, args) as [any, ...any[]]));
      const f: any = (globalThis as any).fetch;
      if (!f) return;
      void f(`${orch}/api/runs/${encodeURIComponent(runId)}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  return {
    debug: (...args: unknown[]) => {
      const arr = format('debug', scope, args);
      console.debug(...arr);
      void forwardToOrchestrator('debug', scope, args);
    },
    info: (...args: unknown[]) => {
      const arr = format('info', scope, args);
      console.info(...arr);
      void forwardToOrchestrator('info', scope, args);
    },
    warn: (...args: unknown[]) => {
      const arr = format('warn', scope, args);
      console.warn(...arr);
      void forwardToOrchestrator('warn', scope, args);
    },
    error: (...args: unknown[]) => {
      const arr = format('error', scope, args);
      console.error(...arr);
      void forwardToOrchestrator('error', scope, args);
    },
  };
}

