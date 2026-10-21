import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/shared/ui';

export interface DayOption {
  key: string;
  label: string;
}

export interface DaySelectorProps {
  days: DayOption[];
  selectedKey: string;
  onSelectDay: (key: string) => void;
}

function DaySelectorComponent({
  days,
  selectedKey,
  onSelectDay,
}: DaySelectorProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="tablist"
      >
        {days.map((day) => {
          const isSelected = day.key === selectedKey;
          return (
            <Chip
              key={day.key}
              label={day.label}
              selected={isSelected}
              onPress={() => onSelectDay(day.key)}
              style={styles.chip}
              accessibilityLabel={`${day.label} tab${isSelected ? ', selected' : ''}`}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export const DaySelector = React.memo(DaySelectorComponent);

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  chip: {
    minHeight: 44, // Touch target >= 44px
  },
});
