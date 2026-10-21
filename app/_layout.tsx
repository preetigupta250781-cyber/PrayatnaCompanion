import * as Sentry from '@sentry/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi, PROFILE_MISSING_MESSAGE, useAuthStore } from '@/features/auth';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { logger } from '@/shared/lib/logger';
import { queryClient } from '@/shared/lib/query-client';
import { initSentry, setSentryUser } from '@/shared/lib/sentry';
import { supabase } from '@/shared/lib/supabase';
import { ErrorBoundary } from '@/shared/ui';

// Initialize Sentry with environment & release tags
initSentry();

// Benchmark cold startup time
const APP_START_TIME = Date.now();

// Keep splash screen visible until auth session is resolved
SplashScreen.preventAutoHideAsync().catch(() => {});

function NavigationWithAuthGate(): React.JSX.Element | null {
  const { session, isInitialized, setSession, setProfile, setIsInitialized, signOut } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const theme = useAppTheme();

  // Initialize Supabase auth session & verify profile on cold start (zero flicker)
  useEffect(() => {
    let isMounted = true;

    async function initAuth(): Promise<void> {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const initialSession = data.session;
        if (!initialSession) {
          if (isMounted) {
            setSession(null);
            setSentryUser(null);
            setIsInitialized(true);
          }
          return;
        }

        // Verify profile exists on cold start to avoid flicker into (tabs)
        const profile = await authApi.fetchProfileWithTeam(initialSession.user.id);
        if (!profile) {
          logger.warn('Cold start session has no profile row. Forcing sign out.');
          await signOut(PROFILE_MISSING_MESSAGE);
          if (isMounted) {
            setIsInitialized(true);
          }
          return;
        }

        if (isMounted) {
          setSession(initialSession);
          setProfile(profile);
          setSentryUser(initialSession.user.id);
          setIsInitialized(true);
        }
      } catch (error: unknown) {
        logger.warn('Error during cold start auth initialization', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    }

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !currentSession) {
        setSession(null);
        setSentryUser(null);
        setIsInitialized(true);
        return;
      }

      setSession(currentSession);
      setSentryUser(currentSession.user.id);
      setIsInitialized(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setProfile, setIsInitialized, signOut]);

  // Hide splash screen once initial session is resolved and record startup time
  useEffect(() => {
    if (isInitialized) {
      const startupDurationMs = Date.now() - APP_START_TIME;
      logger.info('App cold start completed', { startupDurationMs });
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitialized]);

  // Route protection / Auth Gate:
  // no session -> /(auth)/login, session -> /(tabs)
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDevGroup = segments[0] === 'dev';

    if (!session && !inAuthGroup && !inDevGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isInitialized, segments, router]);

  // Keep splash screen visible while resolving auth session
  if (!isInitialized) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="announcements" options={{ headerShown: false }} />
        <Stack.Screen name="problems/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="bus/index" options={{ headerShown: false }} />
        <Stack.Screen name="bus/[routeId]" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dev/ui-kit" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

function RootLayout(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NavigationWithAuthGate />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
