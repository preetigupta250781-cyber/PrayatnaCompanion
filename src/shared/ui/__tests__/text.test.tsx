import React from 'react';
import renderer from 'react-test-renderer';

import { Text, TextVariant } from '../text';

describe('Text Component', () => {
  const variants: TextVariant[] = [
    'h1',
    'h2',
    'h3',
    'h4',
    'body',
    'bodySm',
    'caption',
    'label',
    'code',
  ];

  it.each(variants)('renders %s variant correctly', (variant) => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Text variant={variant}>{`Hello ${variant}`}</Text>);
    });

    const root = tree.root;
    expect(root.findByType(Text).props.children).toBe(`Hello ${variant}`);

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('resolves theme colors and custom weight/align', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Text color="accent" weight="bold" align="center">
          Centered Accent Text
        </Text>
      );
    });

    const root = tree.root;
    expect(root.findByType(Text).props.children).toBe('Centered Accent Text');

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('supports raw hex color overrides', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Text color="#123456">Custom Hex</Text>);
    });

    const root = tree.root;
    expect(root.findByType(Text).props.children).toBe('Custom Hex');

    renderer.act(() => {
      tree.unmount();
    });
  });
});
