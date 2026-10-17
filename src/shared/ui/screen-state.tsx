import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState, EmptyStateProps } from './empty-state';
import { ErrorState, ErrorStateProps } from './error-state';
import { OfflineBanner } from './offline-banner';

export interface ScreenStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  isOffline?: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  onRetry?: () => void;
  errorProps?: Partial<ErrorStateProps>;
  emptyProps?: Partial<EmptyStateProps>;
  offlineMessage?: string;
}

/**
 * ScreenState coordinates the 5 essential states required for all screens:
 * 1. Loading: Displays skeleton matching layout (no spinners).
 * 2. Error: Displays friendly ErrorState with Retry button.
 * 3. Empty: Displays EmptyState with icon and helpful guidance.
 * 4. Offline: Displays OfflineBanner followed by cached content if available.
 * 5. Success: Renders content.
 */
export function ScreenState({
  isLoading,
  isError,
  isEmpty = false,
  isOffline = false,
  skeleton,
  children,
  onRetry,
  errorProps,
  emptyProps,
  offlineMessage,
}: ScreenStateProps): React.JSX.Element {
  // State 1: Loading
  if (isLoading) {
    return <View style={styles.container}>{skeleton}</View>;
  }

  // State 2: Error
  if (isError) {
    return (
      <View style={styles.container}>
        <ErrorState onRetry={onRetry} {...errorProps} />
      </View>
    );
  }

  // State 3: Empty
  if (isEmpty) {
    return (
      <View style={styles.container}>
        <EmptyState {...emptyProps} />
      </View>
    );
  }

  // State 4 & 5: Offline (with cached data) OR Success
  return (
    <View style={styles.container}>
      {isOffline && <OfflineBanner message={offlineMessage} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
