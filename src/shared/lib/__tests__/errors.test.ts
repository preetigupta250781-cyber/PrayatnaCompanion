import { z } from 'zod';

import { AppError, mapToAppError } from '../errors';

describe('Error Handling Layer', () => {
  describe('AppError Class', () => {
    it('creates an AppError instance with correct properties', () => {
      const err = new AppError({
        code: 'NETWORK_TIMEOUT',
        userMessage: 'The request took too long.',
        retryable: true,
        details: { timeoutMs: 5000 },
      });

      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
      expect(err.name).toBe('AppError');
      expect(err.code).toBe('NETWORK_TIMEOUT');
      expect(err.userMessage).toBe('The request took too long.');
      expect(err.message).toBe('The request took too long.');
      expect(err.retryable).toBe(true);
      expect(err.details).toEqual({ timeoutMs: 5000 });
    });
  });

  describe('mapToAppError', () => {
    it('returns the same instance if input is already an AppError', () => {
      const original = new AppError({
        code: 'PERMISSION_DENIED',
        userMessage: 'Access denied.',
        retryable: false,
      });

      const mapped = mapToAppError(original);
      expect(mapped).toBe(original);
    });

    it('maps Zod validation errors to VALIDATION_ERROR', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = schema.safeParse({ name: 'Alice', age: 'twenty' });
      expect(result.success).toBe(false);

      if (!result.success) {
        const mapped = mapToAppError(result.error);
        expect(mapped.code).toBe('VALIDATION_ERROR');
        expect(mapped.retryable).toBe(false);
        expect(mapped.userMessage).toBe('Received invalid data format from the server.');
        expect(mapped.details).toHaveProperty('issues');
      }
    });

    describe('PostgreSQL / PostgREST error codes', () => {
      it('maps code 23505 to DUPLICATE_ENTRY', () => {
        const pgErr = {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
        };
        const mapped = mapToAppError(pgErr);
        expect(mapped.code).toBe('DUPLICATE_ENTRY');
        expect(mapped.retryable).toBe(false);
        expect(mapped.userMessage).toBe('A record with this information already exists.');
      });

      it('maps code 42501 to PERMISSION_DENIED', () => {
        const pgErr = {
          code: '42501',
          message: 'new row violates row-level security policy',
        };
        const mapped = mapToAppError(pgErr);
        expect(mapped.code).toBe('PERMISSION_DENIED');
        expect(mapped.retryable).toBe(false);
        expect(mapped.userMessage).toBe(
          'You do not have permission to view or modify this resource.'
        );
      });

      it('maps code PGRST116 to RESOURCE_NOT_FOUND', () => {
        const pgErr = {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
        };
        const mapped = mapToAppError(pgErr);
        expect(mapped.code).toBe('RESOURCE_NOT_FOUND');
        expect(mapped.retryable).toBe(false);
        expect(mapped.userMessage).toBe('The requested resource was not found.');
      });

      it('maps code PGRST301 to AUTH_SESSION_EXPIRED', () => {
        const pgErr = {
          code: 'PGRST301',
          message: 'JWT expired',
        };
        const mapped = mapToAppError(pgErr);
        expect(mapped.code).toBe('AUTH_SESSION_EXPIRED');
        expect(mapped.retryable).toBe(false);
        expect(mapped.userMessage).toBe('Your session has expired. Please sign in again.');
      });
    });

    describe('Supabase Auth error messages', () => {
      it('maps invalid login credentials', () => {
        const err = new Error('Invalid login credentials');
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('AUTH_INVALID_CREDENTIALS');
        expect(mapped.retryable).toBe(false);
        expect(mapped.userMessage).toBe(
          'Invalid email or password. Please verify your credentials.'
        );
      });

      it('maps invalid grant error', () => {
        const err = { message: 'Invalid grant: user credentials invalid' };
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('AUTH_INVALID_CREDENTIALS');
        expect(mapped.retryable).toBe(false);
      });

      it('maps token expired messages', () => {
        const err = new Error('token expired');
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('AUTH_SESSION_EXPIRED');
        expect(mapped.retryable).toBe(false);
        expect(mapped.userMessage).toBe('Your session has expired. Please sign in again.');
      });

      it('maps email not confirmed message', () => {
        const err = new Error('Email not confirmed');
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('AUTH_UNAUTHORIZED');
        expect(mapped.retryable).toBe(false);
        expect(mapped.userMessage).toBe('Please confirm your email address before signing in.');
      });
    });

    describe('Network errors', () => {
      it('maps Network request failed to NETWORK_DISCONNECTED', () => {
        const err = new TypeError('Network request failed');
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('NETWORK_DISCONNECTED');
        expect(mapped.retryable).toBe(true);
        expect(mapped.userMessage).toBe(
          'Network connection failed. Please check your internet connection.'
        );
      });

      it('maps Failed to fetch to NETWORK_DISCONNECTED', () => {
        const err = new Error('Failed to fetch');
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('NETWORK_DISCONNECTED');
        expect(mapped.retryable).toBe(true);
      });

      it('maps timeout errors to NETWORK_TIMEOUT', () => {
        const err = new Error('The request timed out');
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('NETWORK_TIMEOUT');
        expect(mapped.retryable).toBe(true);
        expect(mapped.userMessage).toBe('The request took too long to complete. Please try again.');
      });

      it('maps aborted requests to NETWORK_TIMEOUT', () => {
        const err = new Error('Request was aborted');
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('NETWORK_TIMEOUT');
        expect(mapped.retryable).toBe(true);
      });
    });

    describe('HTTP Status codes', () => {
      it('maps status 401 to AUTH_UNAUTHORIZED', () => {
        const err = { status: 401, message: 'Unauthorized' };
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('AUTH_UNAUTHORIZED');
        expect(mapped.retryable).toBe(false);
      });

      it('maps status 403 to PERMISSION_DENIED', () => {
        const err = { status: 403, message: 'Forbidden' };
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('PERMISSION_DENIED');
        expect(mapped.retryable).toBe(false);
      });

      it('maps status 404 to RESOURCE_NOT_FOUND', () => {
        const err = { status: 404, message: 'Not Found' };
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('RESOURCE_NOT_FOUND');
        expect(mapped.retryable).toBe(false);
      });

      it('maps status 500 to SERVER_ERROR', () => {
        const err = { status: 500, message: 'Internal Server Error' };
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('SERVER_ERROR');
        expect(mapped.retryable).toBe(true);
        expect(mapped.userMessage).toBe(
          'The server encountered an issue. Please try again in a moment.'
        );
      });

      it('maps status 503 to SERVER_ERROR', () => {
        const err = { status: 503, message: 'Service Unavailable' };
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('SERVER_ERROR');
        expect(mapped.retryable).toBe(true);
      });
    });

    describe('Fallback handling', () => {
      it('maps unknown strings or objects to UNKNOWN_ERROR', () => {
        const err = 'Something completely weird happened';
        const mapped = mapToAppError(err);
        expect(mapped.code).toBe('UNKNOWN_ERROR');
        expect(mapped.retryable).toBe(true);
        expect(mapped.userMessage).toBe('An unexpected error occurred. Please try again.');
      });

      it('maps null or undefined to UNKNOWN_ERROR', () => {
        const mappedNull = mapToAppError(null);
        expect(mappedNull.code).toBe('UNKNOWN_ERROR');

        const mappedUndef = mapToAppError(undefined);
        expect(mappedUndef.code).toBe('UNKNOWN_ERROR');
      });
    });
  });
});
