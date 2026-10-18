import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import { ScreenState } from '../screen-state';
import { Skeleton } from '../skeleton';

describe('ScreenState Component (5-State Verification)', () => {
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
});
