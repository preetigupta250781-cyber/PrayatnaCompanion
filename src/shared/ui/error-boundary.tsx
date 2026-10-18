import * as Sentry from '@sentry/react-native';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { logger } from '@/shared/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Unhandled React Error in ErrorBoundary', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });

    try {
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    } catch {
      // Ignore if Sentry is disabled or not initialized
    }
  }

  private readonly handleRestart = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container} accessible={true} accessibilityRole="alert">
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              An unexpected issue occurred. We have logged this error and our team is looking into
              it.
            </Text>

            <TouchableOpacity
              onPress={this.handleRestart}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Restart Application"
              style={styles.restartButton}
            >
              <Text style={styles.restartButtonText}>RESTART APP</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08090E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#10131B',
    borderColor: '#1E2538',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#171C28',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  restartButton: {
    backgroundColor: '#00F0FF',
    minHeight: 44,
    minWidth: 160,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  restartButtonText: {
    color: '#08090E',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
