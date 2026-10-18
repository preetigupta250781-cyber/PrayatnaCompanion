import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface EmptyStateActionConfig {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title?: string;
  message?: string;
  action?: React.ReactNode | EmptyStateActionConfig;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function EmptyState({
  icon = '∅',
  title = 'No Data Available',
  message = 'There are currently no items to display. Check back shortly.',
  action,
  actionLabel,
  onAction,
  style,
  accessibilityLabel,
}: EmptyStateProps): React.JSX.Element {
  const theme = useAppTheme();

  const renderAction = (): React.JSX.Element | null => {
    if (React.isValidElement(action)) {
      return <View style={styles.actionContainer}>{action}</View>;
    }

    const actionConfig =
      action && typeof action === 'object' && 'label' in action && 'onPress' in action
        ? (action as EmptyStateActionConfig)
        : actionLabel && onAction
          ? { label: actionLabel, onPress: onAction }
          : null;

    if (!actionConfig) return null;

    return (
      <TouchableOpacity
        onPress={actionConfig.onPress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={actionConfig.label}
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Text style={styles.actionButtonText}>{actionConfig.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderIcon = (): React.JSX.Element => {
    if (typeof icon === 'string') {
      return (
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
      );
    }
    return <View style={styles.customIconContainer}>{icon}</View>;
  };

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel || `${title}. ${message}`}
    >
      {renderIcon()}

      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

      {renderAction()}
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
  customIconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionContainer: {
    marginTop: 20,
  },
  actionButton: {
    minHeight: 44, // Touch target >= 44px
    minWidth: 140,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
