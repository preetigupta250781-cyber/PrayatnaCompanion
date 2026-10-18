import { AppError } from '../errors';
import { QUERY_KEYS, queryClient, STALE_TIMES } from '../query-client';

describe('QueryClient Configuration', () => {
  it('defines the required stale times for each resource', () => {
    expect(STALE_TIMES.schedule).toBe(60 * 1000); // 60s
    expect(STALE_TIMES.announcements).toBe(15 * 1000); // 15s
    expect(STALE_TIMES.leaderboard).toBe(10 * 1000); // 10s
    expect(STALE_TIMES.problems).toBe(30 * 1000); // 30s
    expect(STALE_TIMES.bus).toBe(10 * 60 * 1000); // 10 minutes
  });

  it('defines stable query keys', () => {
    expect(QUERY_KEYS.schedule).toEqual(['schedule']);
    expect(QUERY_KEYS.announcements).toEqual(['announcements']);
    expect(QUERY_KEYS.leaderboard).toEqual(['leaderboard']);
    expect(QUERY_KEYS.problems).toEqual(['problems']);
    expect(QUERY_KEYS.bus).toEqual(['bus']);
  });

  it('configures queryClient with correct default options', () => {
    expect(queryClient).toBeDefined();
    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(STALE_TIMES.schedule);
    expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
  });

  describe('retry logic', () => {
    const defaultOptions = queryClient.getDefaultOptions();
    const retryFn = defaultOptions.queries?.retry as (
      failureCount: number,
      error: unknown
    ) => boolean;
    const retryDelayFn = defaultOptions.queries?.retryDelay as (attemptIndex: number) => number;

    it('retries retryable errors when failureCount < 3', () => {
      const retryableError = new AppError({
        code: 'NETWORK_DISCONNECTED',
        userMessage: 'Network error',
        retryable: true,
      });

      expect(retryFn(0, retryableError)).toBe(true);
      expect(retryFn(1, retryableError)).toBe(true);
      expect(retryFn(2, retryableError)).toBe(true);
      expect(retryFn(3, retryableError)).toBe(false);
    });

    it('does not retry non-retryable errors', () => {
      const nonRetryableError = new AppError({
        code: 'AUTH_INVALID_CREDENTIALS',
        userMessage: 'Invalid credentials',
        retryable: false,
      });

      expect(retryFn(0, nonRetryableError)).toBe(false);
    });

    it('maps raw unknown errors and applies retryable rule', () => {
      const rawNetworkError = new Error('Network request failed');
      expect(retryFn(0, rawNetworkError)).toBe(true);

      const rawAuthError = new Error('Invalid login credentials');
      expect(retryFn(0, rawAuthError)).toBe(false);
    });

    it('calculates exponential backoff delay capped at 30 seconds', () => {
      expect(retryDelayFn(0)).toBe(1000);
      expect(retryDelayFn(1)).toBe(2000);
      expect(retryDelayFn(2)).toBe(4000);
      expect(retryDelayFn(3)).toBe(8000);
      expect(retryDelayFn(4)).toBe(16000);
      expect(retryDelayFn(5)).toBe(30000); // capped at 30s
      expect(retryDelayFn(10)).toBe(30000);
    });
  });
});
