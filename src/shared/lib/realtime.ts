import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { logger } from './logger';
import { QUERY_KEYS, queryClient } from './query-client';
import { supabase } from './supabase';

export type RealtimeTable =
  | 'schedule_events'
  | 'announcements'
  | 'leaderboard_entries'
  | 'problem_statements'
  | 'bus_routes'
  | 'bus_stops';

const TABLE_QUERY_KEYS: Record<RealtimeTable, readonly string[]> = {
  schedule_events: QUERY_KEYS.schedule,
  announcements: QUERY_KEYS.announcements,
  leaderboard_entries: QUERY_KEYS.leaderboard,
  problem_statements: QUERY_KEYS.problems,
  bus_routes: QUERY_KEYS.bus,
  bus_stops: QUERY_KEYS.bus,
};

interface TableSubscriptionState {
  refCount: number;
  channel: RealtimeChannel | null;
  pollingTimer: ReturnType<typeof setInterval> | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempt: number;
  isPollingActive: boolean;
}

const tableStates = new Map<RealtimeTable, TableSubscriptionState>();

function getOrCreateState(table: RealtimeTable): TableSubscriptionState {
  let state = tableStates.get(table);
  if (!state) {
    state = {
      refCount: 0,
      channel: null,
      pollingTimer: null,
      reconnectTimer: null,
      reconnectAttempt: 0,
      isPollingActive: false,
    };
    tableStates.set(table, state);
  }
  return state;
}

function startPollingFallback(table: RealtimeTable): void {
  const state = getOrCreateState(table);
  if (state.pollingTimer !== null) {
    return;
  }

  logger.warn(`Starting 30s polling fallback for table ${table}`);
  state.isPollingActive = true;

  state.pollingTimer = setInterval(() => {
    logger.debug(`Polling fallback tick for ${table}`);
    void queryClient.invalidateQueries({
      queryKey: TABLE_QUERY_KEYS[table],
    });
  }, 30000);
}

function stopPollingFallback(table: RealtimeTable): void {
  const state = getOrCreateState(table);
  if (state.pollingTimer !== null) {
    clearInterval(state.pollingTimer);
    state.pollingTimer = null;
  }
  state.isPollingActive = false;
}

function connectChannel(table: RealtimeTable): void {
  const state = getOrCreateState(table);
  if (state.channel) {
    return;
  }

  const channelName = `realtime-${table}-${Date.now()}`;
  const queryKey = TABLE_QUERY_KEYS[table];

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      (payload) => {
        logger.debug(`Realtime change received on ${table}`, {
          eventType: payload.eventType,
        });
        void queryClient.invalidateQueries({ queryKey });
      }
    )
    .subscribe((status) => {
      logger.debug(`Realtime status for ${table}: ${status}`);

      if (status === 'SUBSCRIBED') {
        stopPollingFallback(table);
        state.reconnectAttempt = 0;
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        startPollingFallback(table);
        scheduleReconnect(table);
      } else if (status === 'CLOSED') {
        // Only start polling if subscription is still requested
        if (state.refCount > 0) {
          startPollingFallback(table);
        }
      }
    });

  state.channel = channel;
}

function scheduleReconnect(table: RealtimeTable): void {
  const state = getOrCreateState(table);
  if (state.reconnectTimer !== null || state.refCount === 0) {
    return;
  }

  const backoffDelay = Math.min(1000 * 2 ** state.reconnectAttempt, 30000);
  state.reconnectAttempt += 1;

  logger.debug(`Scheduling realtime reconnect for ${table} in ${backoffDelay}ms`);

  state.reconnectTimer = setTimeout(() => {
    state.reconnectTimer = null;
    if (state.channel) {
      void supabase.removeChannel(state.channel);
      state.channel = null;
    }
    connectChannel(table);
  }, backoffDelay);
}

function disconnectChannel(table: RealtimeTable): void {
  const state = getOrCreateState(table);

  if (state.reconnectTimer !== null) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }

  stopPollingFallback(table);

  if (state.channel) {
    void supabase.removeChannel(state.channel);
    state.channel = null;
  }

  state.reconnectAttempt = 0;
}

/**
 * Subscribes to a database table's realtime changes.
 * Returns an unmount/cleanup function.
 */
export function subscribeToTableRealtime(table: RealtimeTable): () => void {
  const state = getOrCreateState(table);
  state.refCount += 1;

  if (state.refCount === 1) {
    connectChannel(table);
  }

  return () => {
    state.refCount = Math.max(0, state.refCount - 1);
    if (state.refCount === 0) {
      disconnectChannel(table);
    }
  };
}

/**
 * React hook that manages realtime table subscriptions on mount and cleans up on unmount.
 */
export function useTableRealtime(table: RealtimeTable): void {
  useEffect(() => {
    const unsubscribe = subscribeToTableRealtime(table);
    return () => {
      unsubscribe();
    };
  }, [table]);
}

/**
 * React hook to synchronize multiple tables simultaneously.
 */
export function useMultiTableRealtime(tables: RealtimeTable[]): void {
  useEffect(() => {
    const unsubs = tables.map((t) => subscribeToTableRealtime(t));
    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [tables]);
}

/**
 * Checks if fallback polling is currently active for a table
 */
export function isTablePollingActive(table: RealtimeTable): boolean {
  return tableStates.get(table)?.isPollingActive ?? false;
}

/**
 * Resets all realtime state (used for testing isolation)
 */
export function _resetRealtimeManagerForTesting(): void {
  for (const [table] of tableStates) {
    disconnectChannel(table);
  }
  tableStates.clear();
}
