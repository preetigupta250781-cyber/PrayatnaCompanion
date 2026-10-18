import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ErrorState({
  message = 'We encountered an unexpected error while retrieving your data. Please try again.',
  onRetry,
  title = 'Something went wrong',
  retryLabel = 'RETRY',
  style,
  accessibilityLabel,
}: ErrorStateProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel || `${title}. ${message}`}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.error,
          },
        ]}
      >
        <Text style={[styles.iconText, { color: theme.colors.error }]}>!</Text>
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${retryLabel} action`}
          style={[
            styles.retryButton,
            {
              backgroundColor: theme.colors.surfaceHighlight,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
            },
          ]}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.text }]}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    minHeight: 44, // Touch target >= 44px
    minWidth: 130,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
