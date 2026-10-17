import React from 'react';
import { View, Text, StyleSheet, ColorValue } from 'react-native';

export type TabName = 'home' | 'schedule' | 'problems' | 'leaderboard' | 'more';

export interface TabIconProps {
  name: TabName;
  color: ColorValue;
  focused: boolean;
}

const TAB_GLYPHS: Record<TabName, string> = {
  home: '⌂',
  schedule: '◷',
  problems: '⚡',
  leaderboard: '▲',
  more: '☰',
};

export const TabIcon: React.FC<TabIconProps> = ({ name, color, focused }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.iconText, { color, opacity: focused ? 1 : 0.7 }]}>
        {TAB_GLYPHS[name]}
      </Text>
      {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
