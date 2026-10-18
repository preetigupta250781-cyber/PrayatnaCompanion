import React from 'react';
import { Text, TextInput } from 'react-native';
import renderer from 'react-test-renderer';

import { Input } from '../input';

describe('Input Component', () => {
  it('renders input with label, placeholder, and helperText', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Input
          label="Email"
          placeholder="user@example.com"
          helperText="We will never share your email."
        />
      );
    });

    const root = tree.root;
    expect(root.findByType(TextInput).props.placeholder).toBe('user@example.com');

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders error state and error message alert', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Input label="Password" errorText="Password must be at least 8 characters" />
      );
    });

    const root = tree.root;
    const alertElement = root.findByProps({ accessibilityRole: 'alert' });
    expect(alertElement.props.children).toBe('Password must be at least 8 characters');

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('handles focus and blur event triggers', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Input
          onFocus={onFocus}
          onBlur={onBlur}
          leftElement={<Text testID="left-elem">🔍</Text>}
          rightElement={<Text testID="right-elem">✓</Text>}
        />
      );
    });

    const root = tree.root;
    const textInput = root.findByType(TextInput);

    renderer.act(() => {
      textInput.props.onFocus({ nativeEvent: {} });
      textInput.props.onBlur({ nativeEvent: {} });
    });

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(root.findByProps({ testID: 'left-elem' })).toBeTruthy();
    expect(root.findByProps({ testID: 'right-elem' })).toBeTruthy();

    renderer.act(() => {
      tree.unmount();
    });
  });
});
