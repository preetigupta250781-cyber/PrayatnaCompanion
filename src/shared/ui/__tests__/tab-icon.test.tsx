import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import { TabIcon, TabName } from '../tab-icon';

describe('TabIcon Component', () => {
  const tabs: TabName[] = ['home', 'schedule', 'problems', 'leaderboard', 'more'];

  const TAB_GLYPHS: Record<TabName, string> = {
    home: '⌂',
    schedule: '◷',
    problems: '⚡',
    leaderboard: '▲',
    more: '☰',
  };

  tabs.forEach((tab) => {
    it(`renders glyph correctly for ${tab} tab in active state`, () => {
      let tree!: renderer.ReactTestRenderer;
      renderer.act(() => {
        tree = renderer.create(<TabIcon name={tab} color="#00F0FF" focused={true} />);
      });

      const text = tree.root.findByType(Text);
      expect(text.props.children).toBe(TAB_GLYPHS[tab]);
    });

    it(`renders glyph correctly for ${tab} tab in inactive state`, () => {
      let tree!: renderer.ReactTestRenderer;
      renderer.act(() => {
        tree = renderer.create(<TabIcon name={tab} color="#64748B" focused={false} />);
      });

      const text = tree.root.findByType(Text);
      expect(text.props.children).toBe(TAB_GLYPHS[tab]);
    });
  });
});
