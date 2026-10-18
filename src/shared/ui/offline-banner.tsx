import { useNetInfo } from '@react-native-community/netinfo';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface OfflineBannerProps {
  message?: string;
  isOffline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function OfflineBanner({
  message = 'You are currently offline. Showing cached event data.',
  isOffline,
  style,
}: OfflineBannerProps): React.JSX.Element | null {
  const theme = useAppTheme();
  const netInfo = useNetInfo();

  // If isOffline is explicitly passed, honor it; otherwise inspect NetInfo state
  const isDisconnected =
    isOffline !== undefined
      ? isOffline
      : netInfo.isConnected === false || netInfo.isInternetReachable === false;

  if (!isDisconnected) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderBottomColor: theme.colors.warning,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
