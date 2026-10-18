import { z } from 'zod';

import { logger } from './logger';

export type AppErrorCode =
  | 'NETWORK_DISCONNECTED'
  | 'NETWORK_TIMEOUT'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'RESOURCE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'DUPLICATE_ENTRY'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppErrorParams {
  code: AppErrorCode;
  userMessage: string;
  retryable: boolean;
  originalError?: unknown;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly originalError?: unknown;
  readonly details?: Record<string, unknown>;

  constructor({ code, userMessage, retryable, originalError, details }: AppErrorParams) {
    super(userMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.retryable = retryable;
    this.originalError = originalError;
    this.details = details;

    // Maintains proper prototype chain in V8/Hermes
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface SupabasePostgresError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
}

/**
 * Maps raw network, PostgREST, Supabase Auth, Zod, and system errors
 * into a typed AppError. The UI layer must ONLY present `userMessage`.
 */
export function mapToAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return new AppError({
      code: 'VALIDATION_ERROR',
      userMessage: 'Received invalid data format from the server.',
      retryable: false,
      originalError: error,
      details: { issues: error.issues },
    });
  }

  // Inspect error properties safely
  const errorObj = error && typeof error === 'object' ? (error as Record<string, unknown>) : {};
  const message =
    typeof errorObj['message'] === 'string' ? errorObj['message'] : String(error ?? '');
  const status = typeof errorObj['status'] === 'number' ? errorObj['status'] : undefined;
  const pgError = error as SupabasePostgresError | undefined;
  const pgCode = pgError?.code;

  // 1. PostgREST & PostgreSQL database error codes
  if (pgCode) {
    switch (pgCode) {
      case '23505': // unique_violation
        return new AppError({
          code: 'DUPLICATE_ENTRY',
          userMessage: 'A record with this information already exists.',
          retryable: false,
          originalError: error,
        });
      case '42501': // insufficient_privilege / RLS violation
        return new AppError({
          code: 'PERMISSION_DENIED',
          userMessage: 'You do not have permission to view or modify this resource.',
          retryable: false,
          originalError: error,
        });
      case 'PGRST116': // JSON object requested, multiple or zero rows returned
        return new AppError({
          code: 'RESOURCE_NOT_FOUND',
          userMessage: 'The requested resource was not found.',
          retryable: false,
          originalError: error,
        });
      case 'PGRST301': // JWT expired
        return new AppError({
          code: 'AUTH_SESSION_EXPIRED',
          userMessage: 'Your session has expired. Please sign in again.',
          retryable: false,
          originalError: error,
        });
    }
  }

  // 2. Supabase Auth errors
  const lowerMsg = message.toLowerCase();
  if (
    lowerMsg.includes('invalid login credentials') ||
    lowerMsg.includes('invalid grant') ||
    lowerMsg.includes('invalid email or password')
  ) {
    return new AppError({
      code: 'AUTH_INVALID_CREDENTIALS',
      userMessage: 'Invalid email or password. Please verify your credentials.',
      retryable: false,
      originalError: error,
    });
  }

  if (
    lowerMsg.includes('jwt expired') ||
    lowerMsg.includes('token expired') ||
    lowerMsg.includes('refresh_token_not_found')
  ) {
    return new AppError({
      code: 'AUTH_SESSION_EXPIRED',
      userMessage: 'Your session has expired. Please sign in again.',
      retryable: false,
      originalError: error,
    });
  }

  if (lowerMsg.includes('email not confirmed')) {
    return new AppError({
      code: 'AUTH_UNAUTHORIZED',
      userMessage: 'Please confirm your email address before signing in.',
      retryable: false,
      originalError: error,
    });
  }

  // 3. Network reachability & timeout errors
  if (
    lowerMsg.includes('network request failed') ||
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('network error') ||
    lowerMsg.includes('internet connection') ||
    lowerMsg.includes('getaddrinfo')
  ) {
    return new AppError({
      code: 'NETWORK_DISCONNECTED',
      userMessage: 'Network connection failed. Please check your internet connection.',
      retryable: true,
      originalError: error,
    });
  }

  if (
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('timed out') ||
    lowerMsg.includes('time out') ||
    lowerMsg.includes('aborted')
  ) {
    return new AppError({
      code: 'NETWORK_TIMEOUT',
      userMessage: 'The request took too long to complete. Please try again.',
      retryable: true,
      originalError: error,
    });
  }

  // 4. HTTP Server Status codes
  if (status !== undefined) {
    if (status === 401) {
      return new AppError({
        code: 'AUTH_UNAUTHORIZED',
        userMessage: 'Authentication required. Please sign in to continue.',
        retryable: false,
        originalError: error,
      });
    }
    if (status === 403) {
      return new AppError({
        code: 'PERMISSION_DENIED',
        userMessage: 'Access denied. You do not have permission for this action.',
        retryable: false,
        originalError: error,
      });
    }
    if (status === 404) {
      return new AppError({
        code: 'RESOURCE_NOT_FOUND',
        userMessage: 'The requested resource could not be found.',
        retryable: false,
        originalError: error,
      });
    }
    if (status >= 500) {
      return new AppError({
        code: 'SERVER_ERROR',
        userMessage: 'The server encountered an issue. Please try again in a moment.',
        retryable: true,
        originalError: error,
      });
    }
  }

  logger.warn('Unhandled error mapped to generic AppError', {
    message,
    status,
  });

  return new AppError({
    code: 'UNKNOWN_ERROR',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
    originalError: error,
  });
}
