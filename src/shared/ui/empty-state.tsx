import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No Data Available',
  message = 'There are currently no items to display. Check back shortly.',
  icon = '∅',
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message}`}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.iconText, { color: theme.colors.accent }]}>{icon}</Text>
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
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
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
    fontWeight: '700',
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
  actionButton: {
    minHeight: 44,
    minWidth: 140,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#08090E',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
