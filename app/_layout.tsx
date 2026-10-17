import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/query-client';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/features/auth';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { logger } from '@/shared/lib/logger';

// Keep splash screen visible until auth session is resolved
SplashScreen.preventAutoHideAsync().catch(() => {});

function NavigationWithAuthGate(): React.JSX.Element | null {
  const { session, isInitialized, setSession, setIsInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const theme = useAppTheme();

  // Initialize Supabase auth session listener
  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        if (isMounted) {
          setSession(initialSession);
          setIsInitialized(true);
        }
      })
      .catch((error: unknown) => {
        logger.warn('Error fetching initial Supabase session', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (isMounted) {
          setIsInitialized(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setIsInitialized(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setIsInitialized]);

  // Hide splash screen once initial session is resolved
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitialized]);

  // Route protection / Auth Gate:
  // no session -> /(auth)/login, session -> /(tabs)
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationWithAuthGate />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
