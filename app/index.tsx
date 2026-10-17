import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/features/auth';

export default function Index(): React.JSX.Element | null {
  const { session, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
