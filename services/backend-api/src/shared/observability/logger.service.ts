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

  private static SENSITIVE_KEYS = new Set([
    'password', 'passwordhash', 'secret', 'jwt_secret', 'token', 'access_token',
    'fcm_token', 'authorization', 'cookie', 'nationalid', 'parentphone', 'phonenumber'
  ]);

  private sanitizeData(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.sanitizeData(item));

    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      const lowerKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (LoggerService.SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        sanitized[k] = this.sanitizeData(v);
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }

  private formatLog(level: LogLevel, message: string, meta: Partial<LogPayload> = {}): void {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: meta.context || this.defaultContext,
      requestId: meta.requestId,
      tenantId: meta.tenantId,
      data: this.sanitizeData(meta.data),
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
