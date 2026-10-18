import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { EmptyState, EmptyStateProps } from './empty-state';
import { ErrorState, ErrorStateProps } from './error-state';
import { OfflineBanner } from './offline-banner';

export interface QueryResultLike<TData = unknown, TError = unknown> {
  data?: TData;
  isLoading: boolean;
  isError: boolean;
  error?: TError | null;
  refetch?: () => unknown;
}

export interface ScreenStateProps<TData = unknown> {
  /** Optional TanStack Query result object */
  query?: QueryResultLike<TData>;
  /** Manual loading flag (if not using query prop) */
  isLoading?: boolean;
  /** Manual error flag (if not using query prop) */
  isError?: boolean;
  /** Error object or message */
  error?: unknown;
  /** Retry callback invoked when error retry button is pressed */
  onRetry?: () => void;
  /** Skeleton loader matching the layout */
  skeleton: React.ReactNode;
  /** Empty state evaluator (boolean or evaluator function based on data) */
  isEmpty?: boolean | ((data: TData) => boolean);
  /** Custom renderer for empty state */
  renderEmpty?: () => React.ReactNode;
  /** Custom props passed to standard EmptyState */
  emptyProps?: Partial<EmptyStateProps>;
  /** Custom renderer for error state */
  renderError?: (error: unknown, retry: () => void) => React.ReactNode;
  /** Custom props passed to standard ErrorState */
  errorProps?: Partial<ErrorStateProps>;
  /** Explicit offline override flag */
  isOffline?: boolean;
  /** Custom offline message banner text */
  offlineMessage?: string;
  /** Success children or render function taking query data */
  children: React.ReactNode | ((data: TData) => React.ReactNode);
  /** Optional container style */
  style?: StyleProp<ViewStyle>;
}

/**
 * ScreenState coordinates the 5 essential states required for all screens:
 * 1. Loading: Displays skeleton matching layout (zero layout shifts).
 * 2. Error: Displays friendly ErrorState with Retry button calling refetch.
 * 3. Empty: Displays EmptyState with icon and helpful guidance.
 * 4. Offline: Displays OfflineBanner followed by cached content if available.
 * 5. Success: Renders content (or calls children function with data).
 */
export function ScreenState<TData = unknown>({
  query,
  isLoading,
  isError,
  error,
  onRetry,
  skeleton,
  isEmpty = false,
  renderEmpty,
  emptyProps,
  renderError,
  errorProps,
  isOffline,
  offlineMessage,
  children,
  style,
}: ScreenStateProps<TData>): React.JSX.Element {
  const loading = query ? query.isLoading : Boolean(isLoading);
  const errored = query ? query.isError : Boolean(isError);
  const activeError = query?.error ?? error;

  const handleRetry = (): void => {
    if (query?.refetch) {
      void query.refetch();
    }
    onRetry?.();
  };

  // State 1: Loading
  if (loading) {
    return <View style={[styles.container, style]}>{skeleton}</View>;
  }

  // State 2: Error
  if (errored) {
    if (renderError) {
      return <View style={[styles.container, style]}>{renderError(activeError, handleRetry)}</View>;
    }
    return (
      <View style={[styles.container, style]}>
        <ErrorState onRetry={handleRetry} {...errorProps} />
      </View>
    );
  }

  // State 3: Empty Evaluation
  const resolvedData = query?.data;
  const isDataEmpty =
    typeof isEmpty === 'function'
      ? resolvedData !== undefined
        ? isEmpty(resolvedData)
        : false
      : Boolean(isEmpty);

  if (isDataEmpty) {
    if (renderEmpty) {
      return <View style={[styles.container, style]}>{renderEmpty()}</View>;
    }
    return (
      <View style={[styles.container, style]}>
        <EmptyState {...emptyProps} />
      </View>
    );
  }

  // State 4 & 5: Offline Notice (with cached data) + Success Render
  const renderedContent =
    typeof children === 'function' && resolvedData !== undefined
      ? (children as (data: TData) => React.ReactNode)(resolvedData)
      : (children as React.ReactNode);

  return (
    <View style={[styles.container, style]}>
      <OfflineBanner isOffline={isOffline} message={offlineMessage} />
      {renderedContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
