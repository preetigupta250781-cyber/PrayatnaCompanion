import { PostgrestError } from '@supabase/supabase-js';
import React from 'react';
import renderer from 'react-test-renderer';

import { useServerNow, useServerTimeState } from '@/shared/hooks/use-server-now';

import {
  _setServerTimeState,
  getServerNow,
  getServerTimeOffset,
  isServerTimeSynced,
  subscribeToOffsetChanges,
  syncServerTime,
} from '../server-time';
import { supabase } from '../supabase';

function ServerNowConsumer({
  onDate,
  intervalMs,
}: {
  onDate: (date: Date) => void;
  intervalMs?: number;
}) {
  const date = useServerNow({ intervalMs });
  onDate(date);
  return null;
}

function ServerTimeStateConsumer({
  onState,
}: {
  onState: (state: ReturnType<typeof useServerTimeState>) => void;
}) {
  const state = useServerTimeState();
  onState(state);
  return null;
}

describe('Server Time Synchronization Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _setServerTimeState({
      offsetMs: 0,
      lastSyncedAt: null,
      isSyncing: false,
    });
  });

  describe('syncServerTime and offset computation', () => {
    it('computes latency-adjusted offset from server_now RPC response', async () => {
      const fixedServerIso = '2026-10-18T12:00:00.000Z'; // Server is ahead
      const serverTimestamp = new Date(fixedServerIso).getTime();

      // Mock local device clock
      const nowSpy = jest.spyOn(Date, 'now');
      // Local start: 10:00:00.000 (device is behind)
      const localStart = new Date('2026-10-18T10:00:00.000Z').getTime();
      const localEnd = localStart + 100; // 100ms roundtrip latency (50ms half-latency)

      nowSpy.mockReturnValueOnce(localStart).mockReturnValueOnce(localEnd);

      jest.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: fixedServerIso,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
        success: true,
      });

      const calculatedOffset = await syncServerTime();

      // Expected offset: serverTimestamp (12:00:00) + halfLatency (50ms) - localEnd (10:00:00.100)
      const expectedOffset = serverTimestamp + 50 - localEnd;
      expect(calculatedOffset).toBe(expectedOffset);
      expect(getServerTimeOffset()).toBe(expectedOffset);
      expect(isServerTimeSynced()).toBe(true);

      nowSpy.mockRestore();
    });

    it('falls back to existing offset if RPC returns an error', async () => {
      _setServerTimeState({ offsetMs: 500, lastSyncedAt: 12345, isSyncing: false });

      jest.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: null,
        error: new PostgrestError({
          message: 'Database connection error',
          details: '',
          hint: '',
          code: '500',
        }),
        count: null,
        status: 500,
        statusText: 'Error',
        success: false,
      });

      const offset = await syncServerTime();
      expect(offset).toBe(500);
      expect(getServerTimeOffset()).toBe(500);
    });

    it('falls back to existing offset if RPC throws an exception', async () => {
      _setServerTimeState({ offsetMs: 300, lastSyncedAt: null, isSyncing: false });

      jest.spyOn(supabase, 'rpc').mockRejectedValueOnce(new Error('Network failure'));

      const offset = await syncServerTime();
      expect(offset).toBe(300);
    });

    it('prevents concurrent synchronizations while one is in-flight', async () => {
      let resolveRpc: (val: unknown) => void = () => {};
      const rpcPromise = new Promise((resolve) => {
        resolveRpc = resolve;
      });

      jest
        .spyOn(supabase, 'rpc')
        .mockReturnValueOnce(rpcPromise as unknown as ReturnType<typeof supabase.rpc>);

      const firstCallPromise = syncServerTime();
      // Second call while first is in-flight
      const secondCallPromise = syncServerTime();

      resolveRpc({ data: '2026-10-18T10:00:00.000Z', error: null });
      await Promise.all([firstCallPromise, secondCallPromise]);

      expect(supabase.rpc).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServerNow', () => {
    it('returns Date adjusted by current offsetMs', () => {
      const fixedLocalTime = new Date('2026-10-18T10:00:00.000Z').getTime();
      const offsetMs = 15000; // 15 seconds ahead

      jest.spyOn(Date, 'now').mockReturnValue(fixedLocalTime);
      _setServerTimeState({ offsetMs, lastSyncedAt: Date.now(), isSyncing: false });

      const serverNow = getServerNow();
      expect(serverNow.getTime()).toBe(fixedLocalTime + offsetMs);

      (Date.now as jest.Mock).mockRestore();
    });
  });

  describe('subscribeToOffsetChanges', () => {
    it('notifies subscribers when offset updates and unregisters on unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToOffsetChanges(listener);

      _setServerTimeState({ offsetMs: 1234 });
      expect(listener).toHaveBeenCalledWith(1234);

      unsubscribe();
      _setServerTimeState({ offsetMs: 5678 });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('useServerNow hook', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('ticks and updates the date every intervalMs', () => {
      let currentTime = new Date('2026-10-18T10:00:00.000Z').getTime();
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
      _setServerTimeState({ offsetMs: 2000, lastSyncedAt: currentTime, isSyncing: false });

      let capturedDate: Date | undefined;
      let root: renderer.ReactTestRenderer | undefined;

      renderer.act(() => {
        root = renderer.create(
          <ServerNowConsumer
            onDate={(d) => {
              capturedDate = d;
            }}
            intervalMs={1000}
          />
        );
      });

      expect(capturedDate?.getTime()).toBe(currentTime + 2000);

      // Fast-forward 1 second
      currentTime += 1000;
      renderer.act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(capturedDate?.getTime()).toBe(currentTime + 2000);

      renderer.act(() => {
        root?.unmount();
      });

      (Date.now as jest.Mock).mockRestore();
    });
  });

  describe('useServerTimeState hook', () => {
    it('returns offsetMs and sync status', () => {
      _setServerTimeState({ offsetMs: 42, lastSyncedAt: 1000, isSyncing: false });

      let capturedState: ReturnType<typeof useServerTimeState> | undefined;

      renderer.act(() => {
        renderer.create(
          <ServerTimeStateConsumer
            onState={(s) => {
              capturedState = s;
            }}
          />
        );
      });

      expect(capturedState?.offsetMs).toBe(42);
      expect(capturedState?.isSynced).toBe(true);
      expect(typeof capturedState?.sync).toBe('function');
    });

    it('syncs on mount when not synced and updates on offset changes', async () => {
      _setServerTimeState({ offsetMs: 0, lastSyncedAt: null, isSyncing: false });

      jest.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: '2026-10-18T10:00:00.000Z',
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
        success: true,
      });

      let capturedState: ReturnType<typeof useServerTimeState> | undefined;
      let root: renderer.ReactTestRenderer | undefined;

      await renderer.act(async () => {
        root = renderer.create(
          <ServerTimeStateConsumer
            onState={(s) => {
              capturedState = s;
            }}
          />
        );
      });

      expect(capturedState?.isSynced).toBe(true);

      // Trigger listener
      renderer.act(() => {
        _setServerTimeState({ offsetMs: 999 });
      });

      expect(capturedState?.offsetMs).toBe(999);

      // Unmount cleanly
      renderer.act(() => {
        root?.unmount();
      });
    });
  });
});
