import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import renderer from 'react-test-renderer';

import { Button, ButtonVariant } from '../button';

describe('Button Component', () => {
  const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'outline', 'danger'];

  it.each(variants)('renders %s variant and triggers onPress', (variant) => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Button title={`${variant} button`} variant={variant} onPress={onPress} />
      );
    });

    const root = tree.root;
    const buttonElement = root.findByProps({ accessibilityRole: 'button' });
    expect(buttonElement).toBeTruthy();

    renderer.act(() => {
      buttonElement.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders loading state with ActivityIndicator and suppresses onPress', () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Button title="Submit" loading={true} onPress={onPress} />);
    });

    const root = tree.root;
    expect(root.findAllByType(ActivityIndicator).length).toBe(1);

    const buttonElement = root.findByProps({ accessibilityRole: 'button' });
    renderer.act(() => {
      buttonElement.props.onPress();
    });
    expect(onPress).not.toHaveBeenCalled();

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders disabled state and suppresses onPress', () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Button title="Disabled" disabled={true} onPress={onPress} />);
    });

    const root = tree.root;
    const buttonElement = root.findByProps({ accessibilityRole: 'button' });
    expect(buttonElement.props.accessibilityState.disabled).toBe(true);

    renderer.act(() => {
      buttonElement.props.onPress();
    });
    expect(onPress).not.toHaveBeenCalled();

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders left and right icons and custom children', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Button
          leftIcon={<Text testID="left-icon">←</Text>}
          rightIcon={<Text testID="right-icon">→</Text>}
          onPress={() => {}}
        >
          <Text testID="child-text">Custom Child</Text>
        </Button>
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'left-icon' })).toBeTruthy();
    expect(root.findByProps({ testID: 'right-icon' })).toBeTruthy();
    expect(root.findByProps({ testID: 'child-text' })).toBeTruthy();

    renderer.act(() => {
      tree.unmount();
    });
  });
});
