import React from 'react';
import { Image, Text } from 'react-native';
import renderer from 'react-test-renderer';

import { Avatar } from '../avatar';

describe('Avatar Component', () => {
  it('computes two-letter initials from full name', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Avatar name="Aryan Gupta" size="md" status="online" />);
    });

    const root = tree.root;
    const textElement = root.findByType(Text);
    expect(textElement.props.children).toBe('AG');

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('computes single-letter initial when single name is passed', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Avatar name="Organizer" size="sm" status="busy" />);
    });

    const root = tree.root;
    const textElement = root.findByType(Text);
    expect(textElement.props.children).toBe('O');

    renderer.act(() => {
      tree.unmount();
    });
  });

  it('falls back to initials when image loading fails', () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Avatar uri="https://broken-image-url.com/avatar.png" name="Team Beta" />
      );
    });

    const root = tree.root;
    const imageElement = root.findByType(Image);
    expect(imageElement).toBeTruthy();

    // Trigger onError
    renderer.act(() => {
      imageElement.props.onError();
    });

    const fallbackInitials = root.findByType(Text);
    expect(fallbackInitials.props.children).toBe('TB');

    renderer.act(() => {
      tree.unmount();
    });
  });
});
