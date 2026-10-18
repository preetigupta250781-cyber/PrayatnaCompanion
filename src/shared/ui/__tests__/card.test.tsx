import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import { Card, CardVariant } from '../card';

describe('Card Component', () => {
  const variants: CardVariant[] = ['default', 'elevated', 'outlined', 'glow'];

  it.each(variants)('renders %s variant correctly', (variant) => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Card variant={variant}>
          <Text testID="card-child">{`${variant} content`}</Text>
        </Card>
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'card-child' }).props.children).toBe(`${variant} content`);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders interactive pressable card when onPress is provided', () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Card onPress={onPress} accessibilityLabel="Interactive Card">
          <Text testID="pressable-content">Tap me</Text>
        </Card>
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
});
