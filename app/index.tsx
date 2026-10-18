import { Redirect } from 'expo-router';
import React from 'react';

import { useAuthStore } from '@/features/auth';

export default function Index(): React.JSX.Element | null {
  const { session, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
