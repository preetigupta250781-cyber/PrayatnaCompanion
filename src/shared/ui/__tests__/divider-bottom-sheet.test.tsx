import React from 'react';
import { Modal, Text } from 'react-native';
import renderer from 'react-test-renderer';

import { BottomSheet } from '../bottom-sheet';
import { Divider } from '../divider';

describe('Divider & BottomSheet Components', () => {
  it('renders horizontal divider and labeled divider', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <>
          <Divider orientation="horizontal" />
          <Divider label="OR REGISTER" />
          <Divider orientation="vertical" />
        </>
      );
    });

    const root = tree.root;
    const textElement = root.findByType(Text);
    expect(textElement.props.children).toBe('OR REGISTER');

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders BottomSheet and invokes onClose', () => {
    const onClose = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BottomSheet visible={true} onClose={onClose} title="Sheet Title" subtitle="Sheet Subtitle">
          <Text testID="sheet-content">Sheet Body</Text>
        </BottomSheet>
      );
    });

    const root = tree.root;
    const modalElement = root.findByType(Modal);
    expect(modalElement.props.visible).toBe(true);

    const closeBtn = root.findByProps({ accessibilityLabel: 'Close sheet' });
    renderer.act(() => {
      closeBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = root.findByProps({ accessibilityLabel: 'Close bottom sheet backdrop' });
    renderer.act(() => {
      backdrop.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(2);

    renderer.act(() => {
      tree.unmount();
    });
  });
});
