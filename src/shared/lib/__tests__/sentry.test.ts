import * as Sentry from '@sentry/react-native';

import { env } from '@/config/env';

import { initSentry, setSentryUser } from '../sentry';

jest.mock('@/config/env', () => ({
  env: {
    EXPO_PUBLIC_SENTRY_DSN: 'https://test@sentry.io/12345',
  },
}));

describe('Sentry Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes Sentry when DSN is present with environment and release tags', () => {
    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test@sentry.io/12345',
        release: 'prayatna-companion@1.0.0',
        enableAutoSessionTracking: true,
      })
    );
  });

  it('does not initialize Sentry when DSN is missing or undefined', () => {
    const envRecord = env as { EXPO_PUBLIC_SENTRY_DSN?: string };
    const originalDsn = envRecord.EXPO_PUBLIC_SENTRY_DSN;
    envRecord.EXPO_PUBLIC_SENTRY_DSN = undefined;

    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();

    envRecord.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
  });

  it('sets user ID when user is provided without logging any PII', () => {
    setSentryUser('user-999');
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'user-999' });
  });

  it('clears user when null is provided', () => {
    setSentryUser(null);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });
});
