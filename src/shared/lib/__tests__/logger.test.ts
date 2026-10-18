import * as Sentry from '@sentry/react-native';

import { logger, sanitizeContext, sanitizeValue } from '../logger';

describe('Logger (Sensitive Redaction & Environments)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sanitization & PII Redaction', () => {
    it('redacts values for sensitive keys regardless of case', () => {
      expect(sanitizeValue('authToken', 'secret-jwt-123')).toBe('[REDACTED]');
      expect(sanitizeValue('PASSWORD', 'super-secret')).toBe('[REDACTED]');
      expect(sanitizeValue('user_email', 'hacker@prayatna.org')).toBe('[REDACTED]');
      expect(sanitizeValue('phoneNumber', '+919876543210')).toBe('[REDACTED]');
      expect(sanitizeValue('api_key', 'pk_live_12345')).toBe('[REDACTED]');
      expect(sanitizeValue('bearerToken', 'Bearer xyz')).toBe('[REDACTED]');
    });

    it('preserves non-sensitive keys', () => {
      expect(sanitizeValue('screen', 'HomeScreen')).toBe('HomeScreen');
      expect(sanitizeValue('count', 42)).toBe(42);
      expect(sanitizeValue('isValid', true)).toBe(true);
    });

    it('returns null and undefined as is', () => {
      expect(sanitizeValue('token', null)).toBeNull();
      expect(sanitizeValue('token', undefined)).toBeUndefined();
    });

    it('recursively sanitizes nested objects and arrays', () => {
      const input = {
        user: {
          id: 'u-123',
          email: 'hacker@example.com',
          details: {
            authSecret: 'xyz',
            publicInfo: 'visible',
          },
        },
        tokens: ['token1', 'token2'],
        tags: ['hackathon', 'mobile'],
      };

      const result = sanitizeValue('data', input) as typeof input;
      expect(result.user.id).toBe('u-123');
      expect(result.user.email).toBe('[REDACTED]');
      expect(result.user.details.authSecret).toBe('[REDACTED]');
      expect(result.user.details.publicInfo).toBe('visible');
      expect(result.tags).toEqual(['hackathon', 'mobile']);
    });

    it('returns undefined when context is undefined', () => {
      expect(sanitizeContext(undefined)).toBeUndefined();
    });
  });

  describe('Dev Logging Outputs', () => {
    it('calls console.info for debug and info logs with sanitized context', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

      logger.debug('Testing debug message', { screen: 'login', password: 'plain' });
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Testing debug message'),
        expect.objectContaining({ password: '[REDACTED]', screen: 'login' })
      );

      logger.info('Testing info without context');
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Testing info without context')
      );

      infoSpy.mockRestore();
    });

    it('calls console.warn and console.error with sanitized context and without context', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      logger.warn('Warning test', { token: 'abc' });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning test'),
        expect.objectContaining({ token: '[REDACTED]' })
      );

      logger.warn('Warning test without context');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning test without context')
      );

      logger.error('Error test', { error: 'Failed' });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error test'),
        expect.objectContaining({ error: 'Failed' })
      );

      logger.error('Error test without context');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error test without context')
      );

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Production Sentry Logging', () => {
    const originalDev = __DEV__;

    beforeAll(() => {
      // @ts-expect-error Mocking __DEV__
      global.__DEV__ = false;
    });

    afterAll(() => {
      // @ts-expect-error Restoring __DEV__
      global.__DEV__ = originalDev;
    });

    it('adds Sentry breadcrumbs and captures error events in production', () => {
      logger.debug('Prod debug log');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'app.logger',
          level: 'debug',
          message: 'Prod debug log',
        })
      );

      logger.warn('Prod warn log');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'app.logger',
          level: 'warning',
          message: 'Prod warn log',
        })
      );

      logger.info('Prod info log', { key: 'secret' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'app.logger',
          level: 'info',
          message: 'Prod info log',
          data: { key: '[REDACTED]' },
        })
      );

      logger.error('Prod error log', { status: 500 });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Prod error log',
        expect.objectContaining({
          level: 'error',
          extra: { status: 500 },
        })
      );
    });
  });
});
