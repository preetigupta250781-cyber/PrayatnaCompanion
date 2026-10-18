import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import { QueryResultLike, ScreenState } from '../screen-state';
import { Skeleton } from '../skeleton';

describe('ScreenState Component (5-State Verification & TanStack Query Integration)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const dummySkeleton = <Skeleton width={200} height={40} />;
  const dummyContent = <Text testID="success-content">Success Content</Text>;

  it('State 1: Loading -> renders skeleton matching layout, hides content and error', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState isLoading={true} isError={false} skeleton={dummySkeleton}>
          {dummyContent}
        </ScreenState>
      );
    });

    const root = tree.root;
    expect(root.findAllByProps({ testID: 'success-content' }).length).toBe(0);
    expect(root.findAllByType(Skeleton).length).toBe(1);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 2: Error -> renders friendly error state with retry button', () => {
    const handleRetry = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState
          isLoading={false}
          isError={true}
          skeleton={dummySkeleton}
          onRetry={handleRetry}
          errorProps={{ title: 'Custom Error', message: 'Something went wrong' }}
        >
          {dummyContent}
        </ScreenState>
      );
    });

    const root = tree.root;
    expect(root.findAllByProps({ testID: 'success-content' }).length).toBe(0);
    const retryButtons = root.findAllByProps({ accessibilityRole: 'button' });
    expect(retryButtons.length).toBeGreaterThan(0);

    // Trigger retry press
    renderer.act(() => {
      retryButtons[0]?.props.onPress();
    });
    expect(handleRetry).toHaveBeenCalledTimes(1);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 2b: Error via TanStack query result -> pressing retry calls query.refetch()', () => {
    const mockRefetch = jest.fn();
    const query: QueryResultLike<string[]> = {
      isLoading: false,
      isError: true,
      error: new Error('Network timeout'),
      refetch: mockRefetch,
    };

    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState query={query} skeleton={dummySkeleton}>
          {dummyContent}
        </ScreenState>
      );
    });

    const root = tree.root;
    const retryButtons = root.findAllByProps({ accessibilityRole: 'button' });
    expect(retryButtons.length).toBeGreaterThan(0);

    renderer.act(() => {
      retryButtons[0]?.props.onPress();
    });
    expect(mockRefetch).toHaveBeenCalledTimes(1);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 2c: Custom error renderer', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState
          isLoading={false}
          isError={true}
          error={new Error('Custom crash')}
          renderError={(err) => <Text testID="custom-error">{(err as Error).message}</Text>}
          skeleton={dummySkeleton}
        >
          {dummyContent}
        </ScreenState>
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'custom-error' })).toBeTruthy();

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 3: Empty -> renders icon and helpful message', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState
          isLoading={false}
          isError={false}
          isEmpty={true}
          skeleton={dummySkeleton}
          emptyProps={{ title: 'No Events', message: 'Schedule is empty for this day.' }}
        >
          {dummyContent}
        </ScreenState>
      );
    });

    const root = tree.root;
    expect(root.findAllByProps({ testID: 'success-content' }).length).toBe(0);
    const summaryContainers = root.findAllByProps({ accessibilityRole: 'summary' });
    expect(summaryContainers.length).toBeGreaterThan(0);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 3b: Empty evaluation via function on query data', () => {
    const query: QueryResultLike<string[]> = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };

    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState<string[]>
          query={query}
          isEmpty={(data) => data.length === 0}
          emptyProps={{ title: 'No Items Found' }}
          skeleton={dummySkeleton}
        >
          {(data) => <Text testID="success-items">{data.join(',')}</Text>}
        </ScreenState>
      );
    });

    const root = tree.root;
    expect(root.findAllByProps({ testID: 'success-items' }).length).toBe(0);
    expect(root.findAllByProps({ accessibilityRole: 'summary' }).length).toBeGreaterThan(0);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 3c: Custom empty renderer', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState
          isLoading={false}
          isError={false}
          isEmpty={true}
          renderEmpty={() => <Text testID="custom-empty">Custom Empty State</Text>}
          skeleton={dummySkeleton}
        >
          {dummyContent}
        </ScreenState>
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'custom-empty' })).toBeTruthy();

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 4: Offline -> renders offline banner with cached content', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState
          isLoading={false}
          isError={false}
          isOffline={true}
          offlineMessage="Showing cached schedule data"
          skeleton={dummySkeleton}
        >
          {dummyContent}
        </ScreenState>
      );
    });

    const root = tree.root;
    expect(root.findAllByProps({ testID: 'success-content' }).length).toBeGreaterThan(0);
    const alertBanners = root.findAllByProps({ accessibilityRole: 'alert' });
    expect(alertBanners.length).toBeGreaterThan(0);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 5: Success -> renders children cleanly without banner or skeleton', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState isLoading={false} isError={false} skeleton={dummySkeleton}>
          {dummyContent}
        </ScreenState>
      );
    });

    const root = tree.root;
    expect(root.findAllByProps({ testID: 'success-content' }).length).toBeGreaterThan(0);
    expect(root.findAllByType(Skeleton).length).toBe(0);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('State 5b: Success with query data passed to children render function', () => {
    const query: QueryResultLike<{ eventName: string }> = {
      data: { eventName: 'Prayatna 2026 Opening' },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };

    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ScreenState<{ eventName: string }> query={query} skeleton={dummySkeleton}>
          {(data) => <Text testID="event-title">{data.eventName}</Text>}
        </ScreenState>
      );
    });

    const root = tree.root;
    const titleElement = root.findByProps({ testID: 'event-title' });
    expect(titleElement.props.children).toBe('Prayatna 2026 Opening');

    renderer.act(() => {
      tree.unmount();
    });
  });
});
