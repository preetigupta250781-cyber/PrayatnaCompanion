import React from 'react';
import renderer from 'react-test-renderer';

import { queryClient } from '../query-client';
import {
  _resetRealtimeManagerForTesting,
  isTablePollingActive,
  RealtimeTable,
  subscribeToTableRealtime,
  useMultiTableRealtime,
  useTableRealtime,
} from '../realtime';
import { supabase } from '../supabase';

interface MockRealtimeChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
}

describe('Realtime Manager Layer', () => {
  let mockChannel: MockRealtimeChannel;
  let statusCallback: ((status: string) => void) | null = null;
  let postgresChangeCallback: ((payload: unknown) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    _resetRealtimeManagerForTesting();

    statusCallback = null;
    postgresChangeCallback = null;

    mockChannel = {
      on: jest.fn((event, filter, callback) => {
        postgresChangeCallback = callback;
        return mockChannel;
      }),
      subscribe: jest.fn((callback) => {
        statusCallback = callback;
        return mockChannel;
      }),
      unsubscribe: jest.fn(),
    };

    jest
      .spyOn(supabase, 'channel')
      .mockReturnValue(mockChannel as unknown as ReturnType<typeof supabase.channel>);
    jest
      .spyOn(supabase, 'removeChannel')
      .mockResolvedValue('ok' as unknown as ReturnType<typeof supabase.removeChannel>);
    jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  });

  afterEach(() => {
    _resetRealtimeManagerForTesting();
    jest.useRealTimers();
  });

  describe('subscribeToTableRealtime', () => {
    it('creates channel and subscribes to postgres_changes for specified table', () => {
      const unsub = subscribeToTableRealtime('schedule_events');

      expect(supabase.channel).toHaveBeenCalledWith(
        expect.stringContaining('realtime-schedule_events-')
      );
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_events',
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();

      unsub();
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('implements reference counting: reuses channel for multiple subscribers', () => {
      const unsub1 = subscribeToTableRealtime('announcements');
      expect(supabase.channel).toHaveBeenCalledTimes(1);

      const unsub2 = subscribeToTableRealtime('announcements');
      expect(supabase.channel).toHaveBeenCalledTimes(1); // Not called again

      // First unsubscriber shouldn't remove channel
      unsub1();
      expect(supabase.removeChannel).not.toHaveBeenCalled();

      // Second unsubscriber should remove channel
      unsub2();
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('invalidates corresponding query key when postgres changes are received', () => {
      subscribeToTableRealtime('leaderboard_entries');

      expect(postgresChangeCallback).toBeDefined();
      if (postgresChangeCallback) {
        postgresChangeCallback({ eventType: 'UPDATE', new: { score: 95 } });
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['leaderboard'],
        });
      }
    });
  });

  describe('Status changes and fallback polling', () => {
    it('stops polling fallback on SUBSCRIBED status', () => {
      subscribeToTableRealtime('schedule_events');

      // Trigger SUBSCRIBED
      statusCallback?.('SUBSCRIBED');
      expect(isTablePollingActive('schedule_events')).toBe(false);
    });

    it('activates 30s polling fallback and schedules reconnect on CHANNEL_ERROR or TIMED_OUT', () => {
      subscribeToTableRealtime('problem_statements');

      statusCallback?.('CHANNEL_ERROR');
      expect(isTablePollingActive('problem_statements')).toBe(true);

      // Fast-forward 30 seconds for polling tick
      jest.advanceTimersByTime(30000);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['problems'],
      });

      // Fast-forward 60 seconds (another polling tick)
      jest.advanceTimersByTime(30000);
      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    });

    it('reconnects and stops polling when back online and SUBSCRIBED', () => {
      subscribeToTableRealtime('bus_routes');

      // Failure triggers fallback
      statusCallback?.('TIMED_OUT');
      expect(isTablePollingActive('bus_routes')).toBe(true);

      // Reconnect timer runs (1s backoff)
      jest.advanceTimersByTime(1500);
      expect(supabase.removeChannel).toHaveBeenCalled();
      expect(supabase.channel).toHaveBeenCalledTimes(2);

      // Channel now reports SUBSCRIBED
      statusCallback?.('SUBSCRIBED');
      expect(isTablePollingActive('bus_routes')).toBe(false);
    });

    it('handles CLOSED status when subscribers remain', () => {
      subscribeToTableRealtime('schedule_events');

      statusCallback?.('CLOSED');
      expect(isTablePollingActive('schedule_events')).toBe(true);
    });
  });

  describe('useTableRealtime and useMultiTableRealtime hooks', () => {
    function SingleTableConsumer({ table }: { table: RealtimeTable }) {
      useTableRealtime(table);
      return null;
    }

    function MultiTableConsumer({ tables }: { tables: RealtimeTable[] }) {
      useMultiTableRealtime(tables);
      return null;
    }

    it('useTableRealtime subscribes on mount and unsubscribes on unmount', () => {
      let root: renderer.ReactTestRenderer | undefined;

      renderer.act(() => {
        root = renderer.create(<SingleTableConsumer table="announcements" />);
      });

      expect(supabase.channel).toHaveBeenCalledWith(
        expect.stringContaining('realtime-announcements-')
      );

      renderer.act(() => {
        root?.unmount();
      });

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('useMultiTableRealtime subscribes multiple tables concurrently', () => {
      const tables: RealtimeTable[] = ['schedule_events', 'bus_stops'];
      let root: renderer.ReactTestRenderer | undefined;

      renderer.act(() => {
        root = renderer.create(<MultiTableConsumer tables={tables} />);
      });

      expect(supabase.channel).toHaveBeenCalledTimes(2);

      renderer.act(() => {
        root?.unmount();
      });

      expect(supabase.removeChannel).toHaveBeenCalledTimes(2);
    });
  });
});
