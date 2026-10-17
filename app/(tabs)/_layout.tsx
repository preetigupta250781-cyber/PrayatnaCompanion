import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { TabIcon } from '@/shared/ui';

export default function TabsLayout(): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTitleStyle: {
          color: theme.colors.text,
          fontWeight: '700',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Prayatna // Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          headerTitle: 'Event Schedule',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="schedule" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="problems"
        options={{
          title: 'Problems',
          headerTitle: 'Problem Statements',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="problems" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          headerTitle: 'Live Leaderboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="leaderboard" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerTitle: 'More & Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="more" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
