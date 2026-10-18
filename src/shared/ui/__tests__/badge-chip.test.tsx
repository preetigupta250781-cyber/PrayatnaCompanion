import React from 'react';
import renderer from 'react-test-renderer';

import { Badge, BadgeVariant } from '../badge';
import { Chip } from '../chip';

describe('Badge & Chip Components', () => {
  const badgeVariants: BadgeVariant[] = [
    'default',
    'accent',
    'success',
    'warning',
    'error',
    'outline',
    'muted',
  ];

  it.each(badgeVariants)('renders badge %s variant', (variant) => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Badge label="TEST" variant={variant} size="sm" />);
    });

    const root = tree.root;
    expect(root.findByProps({ accessibilityRole: 'text' })).toBeTruthy();

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders interactive Chip with selection and triggers onPress', () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Chip label="Web3" selected={true} onPress={onPress} />);
    });

    const root = tree.root;
    const checkboxElement = root.findByProps({ accessibilityRole: 'checkbox' });
    expect(checkboxElement.props.accessibilityState.selected).toBe(true);

    renderer.act(() => {
      checkboxElement.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('renders Chip close button and triggers onClose', () => {
    const onClose = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Chip label="Removable" onClose={onClose} />);
    });

    const root = tree.root;
    const closeBtn = root.findByProps({ accessibilityLabel: 'Remove Removable' });
    expect(closeBtn).toBeTruthy();

    renderer.act(() => {
      closeBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    renderer.act(() => {
      tree.unmount();
    });
  });
});
