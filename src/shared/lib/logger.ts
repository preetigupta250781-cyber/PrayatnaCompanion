/**
 * Structured, security-conscious logger for Prayatna Companion.
 * Automatically sanitizes sensitive keys (tokens, passwords, secrets, PII)
 * and enforces consistent log output across dev and production.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  readonly [key: string]: unknown;
}

const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /password/i,
  /secret/i,
  /auth/i,
  /key/i,
  /credential/i,
  /bearer/i,
  /email/i,
  /phone/i,
];

function sanitizeValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Check if key matches sensitive patterns
  for (const pattern of SENSITIVE_KEY_PATTERNS) {
    if (pattern.test(key)) {
      return '[REDACTED]';
    }
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((item, index) => sanitizeValue(String(index), item));
    }

    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitizedObj[k] = sanitizeValue(k, v);
    }
    return sanitizedObj;
  }

  return value;
}

function sanitizeContext(context?: LogContext): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }
  return sanitizeValue('context', context) as Record<string, unknown>;
}

function outputLog(level: LogLevel, message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const sanitized = sanitizeContext(context);
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (__DEV__) {
    switch (level) {
      case 'debug':
      case 'info':
        // Safe formatted output in dev
        if (sanitized && Object.keys(sanitized).length > 0) {
          console.info(formattedMessage, sanitized);
        } else {
          console.info(formattedMessage);
        }
        break;
      case 'warn':
        if (sanitized && Object.keys(sanitized).length > 0) {
          console.warn(formattedMessage, sanitized);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case 'error':
        if (sanitized && Object.keys(sanitized).length > 0) {
          console.error(formattedMessage, sanitized);
        } else {
          console.error(formattedMessage);
        }
        break;
    }
  } else {
    // Production behavior: only warnings and errors are emitted
    if (level === 'warn') {
      console.warn(formattedMessage, sanitized);
    } else if (level === 'error') {
      console.error(formattedMessage, sanitized);
    }
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    outputLog('debug', message, context);
  },
  info(message: string, context?: LogContext): void {
    outputLog('info', message, context);
  },
  warn(message: string, context?: LogContext): void {
    outputLog('warn', message, context);
  },
  error(message: string, context?: LogContext): void {
    outputLog('error', message, context);
  },
};
