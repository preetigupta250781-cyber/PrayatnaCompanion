import { logger } from './logger';
import { supabase } from './supabase';

interface ServerTimeState {
  offsetMs: number;
  lastSyncedAt: number | null;
  isSyncing: boolean;
}

const state: ServerTimeState = {
  offsetMs: 0,
  lastSyncedAt: null,
  isSyncing: false,
};

const listeners = new Set<(offsetMs: number) => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener(state.offsetMs);
  }
}

/**
 * Calls rpc server_now() to compute offset against device clock.
 * Accounts for network round-trip latency to calculate true offset.
 */
export async function syncServerTime(): Promise<number> {
  if (state.isSyncing) {
    return state.offsetMs;
  }

  state.isSyncing = true;
  const startLocal = Date.now();

  try {
    const { data, error } = await supabase.rpc('server_now');

    if (error || !data) {
      logger.warn('Failed to fetch server_now() from Supabase, using device clock', {
        error: error ? error.message : 'No data returned',
      });
      state.isSyncing = false;
      return state.offsetMs;
    }

    const endLocal = Date.now();
    const halfLatency = Math.round((endLocal - startLocal) / 2);
    const serverTimestamp = new Date(data).getTime();

    // offset = (serverTime + halfLatency) - endLocal
    state.offsetMs = serverTimestamp + halfLatency - endLocal;
    state.lastSyncedAt = Date.now();

    logger.debug('Server time synchronized successfully', {
      offsetMs: state.offsetMs,
      halfLatencyMs: halfLatency,
    });

    notifyListeners();
    return state.offsetMs;
  } catch (err) {
    logger.warn('Exception during server time synchronization', {
      error: err instanceof Error ? err.message : String(err),
    });
    return state.offsetMs;
  } finally {
    state.isSyncing = false;
  }
}

/**
 * Returns current authoritative server Date (device time + offset)
 */
export function getServerNow(): Date {
  return new Date(Date.now() + state.offsetMs);
}

/**
 * Returns current calculated offset in milliseconds
 */
export function getServerTimeOffset(): number {
  return state.offsetMs;
}

/**
 * Checks if server time has been successfully synchronized at least once
 */
export function isServerTimeSynced(): boolean {
  return state.lastSyncedAt !== null;
}

/**
 * Subscribes to offset updates
 */
export function subscribeToOffsetChanges(callback: (offsetMs: number) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Test helper to set or reset state
 */
export function _setServerTimeState(newState: Partial<ServerTimeState>): void {
  Object.assign(state, newState);
  notifyListeners();
}
