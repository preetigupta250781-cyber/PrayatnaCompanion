import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { useServerNow } from '@/shared/hooks/use-server-now';
import { _setServerTimeState, getServerNow } from '@/shared/lib/server-time';

import { LockedReleaseCard } from '../LockedReleaseCard';

jest.mock('@/shared/hooks/use-server-now');

describe('LockedReleaseCard', () => {
  const mockUseServerNow = useServerNow as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders active countdown timer when target is in the future', () => {
    // Current server time: 10:00:00 AM
    const serverTime = new Date('2026-10-25T10:00:00.000Z');
    // Target release: 12:30:15 PM (2 hours, 30 mins, 15 secs later)
    const targetRelease = '2026-10-25T12:30:15.000Z';

    mockUseServerNow.mockReturnValue(serverTime);

    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(
        <LockedReleaseCard targetReleaseAt={targetRelease} testID="locked-card" />
      );
    });

    const root = tree!.root;
    const textNodes = root.findAllByType(Text);
    const allText = textNodes
      .map((n) => n.props.children)
      .flat()
      .join(' ');

    expect(allText).toContain('Next Problem Statement Unlocks In');
    expect(allText).toContain('02'); // Hours
    expect(allText).toContain('30'); // Mins
    expect(allText).toContain('15'); // Secs
  });

  describe('Countdown reaching zero while the screen is open', () => {
    it('triggers onCountdownZero callback and transitions when countdown reaches zero', () => {
      const onCountdownZero = jest.fn();
      const targetRelease = '2026-10-25T10:00:10.000Z';

      // 1. Initial render: 5 seconds before release
      mockUseServerNow.mockReturnValue(new Date('2026-10-25T10:00:05.000Z'));

      let tree: renderer.ReactTestRenderer | null = null;
      act(() => {
        tree = renderer.create(
          <LockedReleaseCard
            targetReleaseAt={targetRelease}
            onCountdownZero={onCountdownZero}
            testID="locked-card"
          />
        );
      });

      expect(onCountdownZero).not.toHaveBeenCalled();

      // 2. Advance time: exactly reaching target release time (diffMs <= 0)
      mockUseServerNow.mockReturnValue(new Date('2026-10-25T10:00:10.000Z'));

      act(() => {
        tree!.update(
          <LockedReleaseCard
            targetReleaseAt={targetRelease}
            onCountdownZero={onCountdownZero}
            testID="locked-card"
          />
        );
      });

      // Callback must have fired upon transition to zero
      expect(onCountdownZero).toHaveBeenCalledTimes(1);

      const textNodes = tree!.root.findAllByType(Text);
      const allText = textNodes
        .map((n) => n.props.children)
        .flat()
        .join(' ');
      expect(allText).toContain('Unlocking new problem tracks now...');

      // 3. Further advancement past zero should NOT invoke callback again (guarded)
      mockUseServerNow.mockReturnValue(new Date('2026-10-25T10:00:15.000Z'));
      act(() => {
        tree!.update(
          <LockedReleaseCard
            targetReleaseAt={targetRelease}
            onCountdownZero={onCountdownZero}
            testID="locked-card"
          />
        );
      });

      expect(onCountdownZero).toHaveBeenCalledTimes(1);
    });
  });

  describe('Device clock skew correction', () => {
    it('correctly uses server-corrected clock when device clock is skewed 2 hours behind', () => {
      // Setup device clock skew:
      // Local device says: 08:00:00 AM (device is 2 hours slow)
      // True server time is: 10:00:00 AM
      // Server offset is: +2 hours (7,200,000 ms)
      const skewedLocalTime = new Date('2026-10-25T08:00:00.000Z').getTime();
      const offsetMs = 2 * 60 * 60 * 1000; // +2 hours

      _setServerTimeState({
        offsetMs,
        lastSyncedAt: skewedLocalTime,
        isSyncing: false,
      });

      // Target release: 10:15:00 AM (15 minutes after real server time)
      const targetRelease = '2026-10-25T10:15:00.000Z';

      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(skewedLocalTime);

      // Verify getServerNow() correctly adjusts local skewed time
      const correctedServerNow = getServerNow();
      expect(correctedServerNow.toISOString()).toBe('2026-10-25T10:00:00.000Z');

      // Now pass correctedServerNow to the component
      mockUseServerNow.mockReturnValue(correctedServerNow);

      let tree: renderer.ReactTestRenderer | null = null;
      act(() => {
        tree = renderer.create(
          <LockedReleaseCard targetReleaseAt={targetRelease} testID="locked-card" />
        );
      });

      const textNodes = tree!.root.findAllByType(Text);
      const allText = textNodes
        .map((n) => n.props.children)
        .flat()
        .join(' ');

      // Should display 15 minutes remaining, NOT 2 hours 15 mins!
      expect(allText).toContain('15'); // 15 minutes
      expect(allText).toContain('00'); // 00 hours

      dateNowSpy.mockRestore();
    });

    it('correctly uses server-corrected clock when device clock is skewed 3 hours ahead', () => {
      // Local device says: 13:00:00 PM (device is 3 hours fast)
      // True server time is: 10:00:00 AM
      // Server offset is: -3 hours (-10,800,000 ms)
      const skewedLocalTime = new Date('2026-10-25T13:00:00.000Z').getTime();
      const offsetMs = -3 * 60 * 60 * 1000; // -3 hours

      _setServerTimeState({
        offsetMs,
        lastSyncedAt: skewedLocalTime,
        isSyncing: false,
      });

      const targetRelease = '2026-10-25T10:30:00.000Z'; // 30 minutes after true server time

      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(skewedLocalTime);
      const correctedServerNow = getServerNow();
      expect(correctedServerNow.toISOString()).toBe('2026-10-25T10:00:00.000Z');

      mockUseServerNow.mockReturnValue(correctedServerNow);

      let tree: renderer.ReactTestRenderer | null = null;
      act(() => {
        tree = renderer.create(
          <LockedReleaseCard targetReleaseAt={targetRelease} testID="locked-card" />
        );
      });

      const textNodes = tree!.root.findAllByType(Text);
      const allText = textNodes
        .map((n) => n.props.children)
        .flat()
        .join(' ');

      // Without correction, 13:00 vs 10:30 would show 00:00:00 (finished).
      // With server correction, it correctly shows 30 mins remaining!
      expect(allText).toContain('30'); // 30 minutes
      expect(allText).not.toContain('Unlocking new problem tracks now...');

      dateNowSpy.mockRestore();
    });
  });
});
