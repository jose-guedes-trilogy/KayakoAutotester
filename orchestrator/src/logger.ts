export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function ts(): string {
  return new Date().toISOString();
}

export function createLogger(scope: string) {
  return {
    debug: (...args: unknown[]) => console.debug(`[${ts()}] [DEBUG] [${scope}]`, ...args),
    info: (...args: unknown[]) => console.info(`[${ts()}] [INFO]  [${scope}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${ts()}] [WARN]  [${scope}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${ts()}] [ERROR] [${scope}]`, ...args),
  };
}



