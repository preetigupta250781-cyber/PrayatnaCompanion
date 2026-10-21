import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';
import { Avatar, Badge, Card, Text } from '@/shared/ui';

import type { ProfileWithTeam } from '../types';

export interface ProfileCardProps {
  profile: ProfileWithTeam;
}

function ProfileCardComponent({ profile }: ProfileCardProps): React.JSX.Element {
  const theme = useAppTheme();
  const team = profile.team;
  const isOrganizer = profile.role === 'organizer';

  return (
    <View style={styles.container} accessible accessibilityRole="summary">
      {/* Header Profile Card */}
      <Card variant="elevated" style={[styles.card, styles.alignCenter]}>
        <Avatar
          name={profile.full_name ?? 'Hacker'}
          size="xl"
          status="online"
          accessibilityLabel={`Avatar of ${profile.full_name ?? 'User'}`}
        />

        <Text variant="h2" style={styles.nameText}>
          {profile.full_name ?? 'Participant'}
        </Text>

        {profile.email ? (
          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
            {profile.email}
          </Text>
        ) : null}

        <View style={styles.roleContainer}>
          <Badge
            label={isOrganizer ? 'ORGANIZER' : 'PARTICIPANT'}
            variant={isOrganizer ? 'accent' : 'default'}
          />
        </View>

        {profile.college ? (
          <View style={styles.collegeRow}>
            <Text variant="bodySm" style={{ color: theme.colors.textMuted }}>
              🏛️ {profile.college}
              {profile.city ? ` • ${profile.city}` : ''}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Team Details Card */}
      <Card variant="default" style={styles.card}>
        <View style={styles.rowBetween}>
          <Text variant="label" style={{ color: theme.colors.textSecondary }}>
            TEAM DETAILS
          </Text>
          {team?.team_code ? (
            <Badge label={`CODE: ${team.team_code}`} variant="outline" size="sm" />
          ) : null}
        </View>

        <Text variant="h3" style={styles.teamName}>
          {team?.name ?? 'No Team Assigned'}
        </Text>

        <Text variant="bodySm" style={{ color: theme.colors.textMuted, marginTop: 4 }}>
          {team
            ? 'Registered for hackathon evaluation rounds'
            : 'Contact your team leader or an organizer to join a squad'}
        </Text>
      </Card>
    </View>
  );
}

export const ProfileCard = React.memo(ProfileCardComponent);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  alignCenter: {
    alignItems: 'center',
  },
  nameText: {
    marginTop: 12,
    textAlign: 'center',
  },
  roleContainer: {
    marginTop: 8,
  },
  collegeRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    marginTop: 8,
  },
});
