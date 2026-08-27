export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  tenantId?: string;
  data?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

export class LoggerService {
  constructor(private readonly defaultContext: string = 'App') {}

  private formatLog(level: LogLevel, message: string, meta: Partial<LogPayload> = {}): void {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: meta.context || this.defaultContext,
      requestId: meta.requestId,
      tenantId: meta.tenantId,
      data: meta.data,
      error: meta.error
    };

    const serialized = JSON.stringify(payload);
    if (level === 'error' || level === 'fatal') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  debug(message: string, meta?: Partial<LogPayload>): void {
    this.formatLog('debug', message, meta);
  }

  info(message: string, meta?: Partial<LogPayload>): void {
    this.formatLog('info', message, meta);
  }

  warn(message: string, meta?: Partial<LogPayload>): void {
    this.formatLog('warn', message, meta);
  }

  error(message: string, err?: Error | any, meta?: Partial<LogPayload>): void {
    this.formatLog('error', message, {
      ...meta,
      error: err ? { message: err.message || String(err), stack: err.stack } : undefined
    });
  }

  fatal(message: string, err?: Error | any, meta?: Partial<LogPayload>): void {
    this.formatLog('fatal', message, {
      ...meta,
      error: err ? { message: err.message || String(err), stack: err.stack } : undefined
    });
  }
}

export const appLogger = new LoggerService('BackendAPI');
