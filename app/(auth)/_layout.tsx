import { Stack } from 'expo-router';
import React from 'react';

import { useAppTheme } from '@/shared/hooks/use-theme';

export default function AuthLayout(): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
