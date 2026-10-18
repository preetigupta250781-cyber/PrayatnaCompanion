import * as Sentry from '@sentry/react-native';
import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import { ErrorBoundary } from '../error-boundary';

// Component that conditionally throws
function ProblemChild({ shouldThrow }: { shouldThrow: boolean }): React.JSX.Element {
  if (shouldThrow) {
    throw new Error('Crash from ProblemChild');
  }
  return <Text testID="normal-child">Normal Child Content</Text>;
}

describe('ErrorBoundary Component', () => {
  // Suppress console.error in test output for intentional errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when no error occurs', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ErrorBoundary>
          <Text testID="safe-content">Safe Content</Text>
        </ErrorBoundary>
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'safe-content' })).toBeDefined();
  });

  it('catches render error, reports to Sentry, and displays fallback UI', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ErrorBoundary>
          <ProblemChild shouldThrow={true} />
        </ErrorBoundary>
      );
    });

    const root = tree.root;
    const texts = root.findAllByType(Text);
    const hasErrorTitle = texts.some((t) => t.props.children === 'Something went wrong');
    expect(hasErrorTitle).toBe(true);

    const restartButton = root.findByProps({ accessibilityRole: 'button' });
    expect(restartButton).toBeDefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.any(Object),
      })
    );
  });

  it('renders custom fallback if provided via fallback prop', () => {
    const customFallback = <Text testID="custom-fallback">Custom Error Screen</Text>;
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ErrorBoundary fallback={customFallback}>
          <ProblemChild shouldThrow={true} />
        </ErrorBoundary>
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'custom-fallback' })).toBeDefined();
  });

  it('resets error state when RESTART APP button is pressed', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ErrorBoundary>
          <ProblemChild shouldThrow={true} />
        </ErrorBoundary>
      );
    });

    const root = tree.root;
    const button = root.findByProps({ accessibilityRole: 'button' });
    expect(button).toBeDefined();

    renderer.act(() => {
      button.props.onPress();
    });

    // After reset, problem child throws again and is caught
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
