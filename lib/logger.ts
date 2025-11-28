type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function format(level: LogLevel, scope: string, args: unknown[]): unknown[] {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level.toUpperCase()}] [${scope}]`, ...args];
}

export function createLogger(scope: string): Logger {
  return {
    debug: (...args: unknown[]) => console.debug(...format('debug', scope, args)),
    info: (...args: unknown[]) => console.info(...format('info', scope, args)),
    warn: (...args: unknown[]) => console.warn(...format('warn', scope, args)),
    error: (...args: unknown[]) => console.error(...format('error', scope, args)),
  };
}






