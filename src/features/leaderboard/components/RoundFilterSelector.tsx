import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/shared/ui';

import { RoundFilter } from '../types';

export interface RoundFilterSelectorProps {
  availableRounds: string[];
  selectedRound: RoundFilter;
  onSelectRound: (round: RoundFilter) => void;
  testID?: string;
}

export function RoundFilterSelector({
  availableRounds,
  selectedRound,
  onSelectRound,
  testID = 'round-filter-selector',
}: RoundFilterSelectorProps): React.JSX.Element {
  return (
    <View style={styles.container} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Chip
          label="All Rounds"
          variant={selectedRound === 'all' ? 'accent' : 'default'}
          selected={selectedRound === 'all'}
          onPress={() => onSelectRound('all')}
          accessibilityLabel="Filter by all rounds"
          testID="round-chip-all"
        />

        {availableRounds.map((round) => {
          const isSelected = selectedRound === round;
          return (
            <Chip
              key={round}
              label={round}
              variant={isSelected ? 'accent' : 'default'}
              selected={isSelected}
              onPress={() => onSelectRound(round)}
              accessibilityLabel={`Filter by ${round}`}
              testID={`round-chip-${round.replace(/\s+/g, '-').toLowerCase()}`}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
