import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error while retrieving your data. Please try again.',
  onRetry,
  retryLabel = 'RETRY',
}: ErrorStateProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${message}`}
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
    minHeight: 44,
    minWidth: 130,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
