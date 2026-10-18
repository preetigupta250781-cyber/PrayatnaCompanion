import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import { env } from '@/config/env';

export function initSentry(): void {
  const dsn = env.EXPO_PUBLIC_SENTRY_DSN;
  const isDev = __DEV__;
  const environment = isDev ? 'development' : 'production';
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const release = `prayatna-companion@${version}`;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    debug: isDev,
    environment,
    release,
    enableAutoSessionTracking: true,
    tracesSampleRate: isDev ? 1.0 : 0.2,
  });
}

/**
 * Attaches only the user ID to Sentry events.
 * Strictly avoids logging PII like email, phone number, or names.
 */
export function setSentryUser(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}
