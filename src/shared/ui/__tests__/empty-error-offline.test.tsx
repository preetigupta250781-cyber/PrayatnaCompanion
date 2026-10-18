import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import { EmptyState } from '../empty-state';
import { ErrorState } from '../error-state';
import { OfflineBanner } from '../offline-banner';

describe('EmptyState, ErrorState & OfflineBanner Components', () => {
  it('renders EmptyState with custom JSX icon and action config', () => {
    const handleAction = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <EmptyState
          icon={<Text testID="custom-icon">★</Text>}
          title="No Results Found"
          message="Try adjusting your filters"
          action={{
            label: 'RESET FILTERS',
            onPress: handleAction,
          }}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'custom-icon' })).toBeTruthy();

    const actionBtn = root.findByProps({ accessibilityLabel: 'RESET FILTERS' });
    renderer.act(() => {
      actionBtn.props.onPress();
    });
    expect(handleAction).toHaveBeenCalledTimes(1);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders ErrorState with message and invokes onRetry', () => {
    const onRetry = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ErrorState
          title="Connection Timed Out"
          message="Server could not be reached"
          onRetry={onRetry}
          retryLabel="TRY AGAIN"
        />
      );
    });

    const root = tree.root;
    const retryBtn = root.findByProps({ accessibilityLabel: 'TRY AGAIN action' });
    renderer.act(() => {
      retryBtn.props.onPress();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders OfflineBanner when isOffline is true, hides when false', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<OfflineBanner isOffline={true} message="No internet connection" />);
    });

    expect(tree.root.findByProps({ accessibilityRole: 'alert' })).toBeTruthy();

    renderer.act(() => {
      tree.update(<OfflineBanner isOffline={false} />);
    });
    expect(tree.toJSON()).toBeNull();

    renderer.act(() => {
      tree.unmount();
    });
  });
});
