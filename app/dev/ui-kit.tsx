import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  Input,
  OfflineBanner,
  ScreenState,
  Skeleton,
  Text,
} from '@/shared/ui';
import {
  AnnouncementListSkeleton,
  BusRouteListSkeleton,
  HomeSkeleton,
  LeaderboardSkeleton,
  ProblemCardSkeleton,
  ProfileCardSkeleton,
  ScheduleSkeleton,
} from '@/shared/ui/composed-skeletons';

type SkeletonType =
  'home' | 'schedule' | 'announcements' | 'problems' | 'leaderboard' | 'transit' | 'profile';

export default function UIKitDevScreen(): React.JSX.Element {
  const theme = useAppTheme();

  // State for interactive demos
  const [inputText, setInputText] = useState('');
  const [selectedChip, setSelectedChip] = useState('All');
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [activeSkeleton, setActiveSkeleton] = useState<SkeletonType>('home');
  const [screenStateType, setScreenStateType] = useState<
    'success' | 'loading' | 'empty' | 'error' | 'offline'
  >('success');
  const [retryCounter, setRetryCounter] = useState(0);

  // Hidden in production builds
  if (!__DEV__) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.disabledContainer}>
          <Text variant="h2" color="error">
            404 Not Found
          </Text>
          <Text variant="body" color="textSecondary" style={styles.mt8}>
            Development tools and UI preview are unavailable in production builds.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderActiveSkeleton = (): React.JSX.Element => {
    switch (activeSkeleton) {
      case 'schedule':
        return <ScheduleSkeleton />;
      case 'announcements':
        return <AnnouncementListSkeleton />;
      case 'problems':
        return <ProblemCardSkeleton />;
      case 'leaderboard':
        return <LeaderboardSkeleton />;
      case 'transit':
        return <BusRouteListSkeleton />;
      case 'profile':
        return <ProfileCardSkeleton />;
      case 'home':
      default:
        return <HomeSkeleton />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Badge label="DEV ONLY" variant="accent" size="sm" />
          <Text variant="h1" style={styles.mt8}>
            Design System UI Kit
          </Text>
          <Text variant="bodySm" color="textSecondary">
            Prayatna Companion themeable component library & 5-state testbed.
          </Text>
        </View>

        <Divider spacing="md" />

        {/* Section 1: Typography Variants */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            1. Typography Variants
          </Text>
          <Card variant="default">
            <Text variant="h1">Heading 1 (30px 800)</Text>
            <Text variant="h2">Heading 2 (24px 700)</Text>
            <Text variant="h3">Heading 3 (20px 600)</Text>
            <Text variant="h4">Heading 4 (18px 600)</Text>
            <Text variant="body">Body (16px 400) — Standard mobile body text.</Text>
            <Text variant="bodySm">Body Small (14px 400) — Secondary details.</Text>
            <Text variant="caption">Caption (12px 500) — Timestamps & meta info.</Text>
            <Text variant="label">LABEL (11px 700 UPPERCASE)</Text>
            <Text variant="code">console.log(&quot;Code variant 13px mono&quot;);</Text>
          </Card>
        </View>

        {/* Section 2: Buttons */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            2. Button Variants & States
          </Text>
          <View style={styles.buttonStack}>
            <Button
              title="Primary Neon Button"
              variant="primary"
              onPress={() => {
                setButtonLoading(true);
                setTimeout(() => setButtonLoading(false), 1500);
              }}
            />
            <Button title="Secondary Elevated Button" variant="secondary" onPress={() => {}} />
            <Button title="Ghost Button" variant="ghost" onPress={() => {}} />
            <Button title="Outline Accent Button" variant="outline" onPress={() => {}} />
            <Button title="Danger Button" variant="danger" onPress={() => {}} />
            <Button
              title="Loading State"
              variant="primary"
              loading={buttonLoading || true}
              onPress={() => {}}
            />
            <Button title="Disabled Button" variant="primary" disabled={true} onPress={() => {}} />
          </View>
        </View>

        {/* Section 3: Cards */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            3. Card Variants
          </Text>
          <Card variant="default" style={styles.mb12}>
            <Text variant="h4">Default Surface Card</Text>
            <Text variant="bodySm" color="textSecondary">
              Base card using theme surface token and subtle border.
            </Text>
          </Card>
          <Card variant="elevated" style={styles.mb12}>
            <Text variant="h4">Elevated Card</Text>
            <Text variant="bodySm" color="textSecondary">
              Elevated background with platform-native drop shadow.
            </Text>
          </Card>
          <Card variant="glow" style={styles.mb12}>
            <Text variant="h4" color="accent">
              Neon Glow Card
            </Text>
            <Text variant="bodySm" color="textSecondary">
              Hackathon accent glow border and halo shadow.
            </Text>
          </Card>
          <Card
            variant="outlined"
            onPress={() => alert('Card Pressed!')}
            accessibilityLabel="Pressable card demo"
          >
            <Text variant="h4">Pressable Outlined Card</Text>
            <Text variant="bodySm" color="textSecondary">
              Interactive card with haptic feedback and &gt;=44px touch target.
            </Text>
          </Card>
        </View>

        {/* Section 4: Badges & Chips */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            4. Badges & Chips
          </Text>
          <Text variant="label" style={styles.mb8}>
            Badges
          </Text>
          <View style={styles.badgeRow}>
            <Badge label="DEFAULT" variant="default" style={styles.mr6} />
            <Badge label="ACCENT" variant="accent" style={styles.mr6} />
            <Badge label="SUCCESS" variant="success" style={styles.mr6} />
            <Badge label="WARNING" variant="warning" style={styles.mr6} />
            <Badge label="ERROR" variant="error" style={styles.mr6} />
            <Badge label="OUTLINE" variant="outline" />
          </View>

          <Text variant="label" style={[styles.mt16, styles.mb8]}>
            Interactive Filter Chips
          </Text>
          <View style={styles.badgeRow}>
            {['All', 'Web3', 'AI/ML', 'Cloud'].map((category) => (
              <Chip
                key={category}
                label={category}
                selected={selectedChip === category}
                onPress={() => setSelectedChip(category)}
                style={styles.mr6}
              />
            ))}
          </View>
        </View>

        {/* Section 5: Text Input */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            5. Form Inputs
          </Text>
          <Input
            label="Full Name"
            placeholder="e.g. Aryan Gupta"
            value={inputText}
            onChangeText={setInputText}
            helperText="Enter your participant name as registered on GitHub."
          />
          <Input
            label="Team Code"
            placeholder="PRAYATNA-001"
            value="INVALID_CODE"
            errorText="Team code does not exist. Verify with your team leader."
          />
          <Input
            label="Disabled Field"
            placeholder="Read-only data"
            disabled={true}
            value="Locked Hackathon Round"
          />
        </View>

        {/* Section 6: Avatars */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            6. Avatars & Status Indicators
          </Text>
          <View style={styles.avatarRow}>
            <Avatar name="Aryan Gupta" size="xl" status="online" style={styles.mr12} />
            <Avatar name="Indore Hackers" size="lg" status="busy" style={styles.mr12} />
            <Avatar name="Quantum" size="md" status="away" style={styles.mr12} />
            <Avatar name="Participant" size="sm" status="offline" style={styles.mr12} />
            <Avatar name="Lead" size="xs" />
          </View>
        </View>

        {/* Section 7: Dividers & BottomSheet */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            7. Dividers & Bottom Sheet Modal
          </Text>
          <Divider label="OR REGISTER WITH" spacing="sm" />
          <Button
            title="Open Interactive BottomSheet"
            variant="outline"
            onPress={() => setIsSheetVisible(true)}
            style={styles.mt12}
          />
        </View>

        {/* Section 8: Composed Layout Skeletons */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            8. Composed Layout Skeletons
          </Text>
          <Text variant="bodySm" color="textSecondary" style={styles.mb8}>
            Reanimated shimmer primitive respecting reduce-motion settings.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mb12}>
            {(
              [
                'home',
                'schedule',
                'announcements',
                'problems',
                'leaderboard',
                'transit',
                'profile',
              ] as SkeletonType[]
            ).map((type) => (
              <Chip
                key={type}
                label={type.toUpperCase()}
                selected={activeSkeleton === type}
                onPress={() => setActiveSkeleton(type)}
                style={styles.mr6}
              />
            ))}
          </ScrollView>

          <Card variant="default">{renderActiveSkeleton()}</Card>
        </View>

        {/* Section 9: 5-State Architecture ScreenState */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            9. ScreenState Architecture (5 States)
          </Text>
          <Text variant="bodySm" color="textSecondary" style={styles.mb8}>
            Interactive testbed switching between Loading, Error, Empty, Offline, and Success.
          </Text>
          <View style={styles.badgeRow}>
            {(['success', 'loading', 'empty', 'error', 'offline'] as const).map((state) => (
              <Chip
                key={state}
                label={state.toUpperCase()}
                selected={screenStateType === state}
                onPress={() => setScreenStateType(state)}
                style={styles.mr6}
              />
            ))}
          </View>

          <Card variant="default" style={styles.mt12}>
            <ScreenState
              isLoading={screenStateType === 'loading'}
              isError={screenStateType === 'error'}
              isEmpty={screenStateType === 'empty'}
              isOffline={screenStateType === 'offline'}
              onRetry={() => {
                setRetryCounter((c) => c + 1);
                setScreenStateType('success');
              }}
              skeleton={<Skeleton height={80} borderRadius={8} />}
              emptyProps={{
                title: 'No Active Submissions',
                message: 'Your team has not uploaded code for this round yet.',
                actionLabel: 'CREATE SUBMISSION',
                onAction: () => alert('Action tapped'),
              }}
              errorProps={{
                message: `Failed to load score data. (Retry count: ${retryCounter})`,
              }}
            >
              <View style={styles.successBox}>
                <Text variant="h4" color="success">
                  ✓ Success State Rendered
                </Text>
                <Text variant="bodySm" color="textSecondary">
                  All hackathon scores, live announcements, and transit routes loaded.
                </Text>
              </View>
            </ScreenState>
          </Card>
        </View>

        {/* Section 10: Standalone State Components */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            10. Standalone State Components
          </Text>
          <OfflineBanner
            isOffline={true}
            message="Standalone OfflineBanner preview — cached data active."
          />
          <Card variant="default" style={styles.mt12}>
            <EmptyState
              icon="∅"
              title="Standalone EmptyState"
              message="Example of a standalone empty state with custom action."
              action={{
                label: 'RELOAD TRACK',
                onPress: () => {},
              }}
            />
          </Card>
          <Card variant="default" style={styles.mt12}>
            <ErrorState
              title="Standalone ErrorState"
              message="Example of a standalone error state with retry action."
              onRetry={() => {}}
            />
          </Card>
        </View>
      </ScrollView>

      {/* Interactive BottomSheet Modal */}
      <BottomSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        title="Hackathon Logistics Sheet"
        subtitle="Quick actions & campus resources"
      >
        <Text variant="body" style={styles.mb12}>
          This bottom sheet is rendered inside an accessible modal dialog with backdrop dismiss and
          handle bar.
        </Text>
        <Button
          title="Dismiss Sheet"
          variant="primary"
          onPress={() => setIsSheetVisible(false)}
          fullWidth={true}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  disabledContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 8,
  },
  section: {
    marginVertical: 14,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  buttonStack: {
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successBox: {
    padding: 16,
    alignItems: 'center',
  },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mr6: { marginRight: 6 },
  mr8: { marginRight: 8 },
  mr12: { marginRight: 12 },
});
