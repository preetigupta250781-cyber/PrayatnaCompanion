import { useEffect, useState } from 'react';

import {
  getServerNow,
  getServerTimeOffset,
  isServerTimeSynced,
  subscribeToOffsetChanges,
  syncServerTime,
} from '@/shared/lib/server-time';

export interface UseServerNowOptions {
  intervalMs?: number;
}

/**
 * Hook providing live authoritative server Date, ticking at intervalMs (default: 1000ms).
 * Synchronizes with Supabase rpc server_now() on startup and uses computed offset.
 */
export function useServerNow(options?: UseServerNowOptions): Date {
  const intervalMs = options?.intervalMs ?? 1000;
  const [currentDate, setCurrentDate] = useState<Date>(() => getServerNow());

  useEffect(() => {
    // Sync on mount if not yet initialized
    if (!isServerTimeSynced()) {
      void syncServerTime();
    }

    // Update whenever offset changes
    const unsubscribe = subscribeToOffsetChanges(() => {
      setCurrentDate(getServerNow());
    });

    // Tick at the requested interval
    const timer = setInterval(() => {
      setCurrentDate(getServerNow());
    }, intervalMs);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [intervalMs]);

  return currentDate;
}

/**
 * Hook providing current server time offset and sync status
 */
export function useServerTimeState(): {
  offsetMs: number;
  isSynced: boolean;
  sync: () => Promise<number>;
} {
  const [offsetMs, setOffsetMs] = useState<number>(() => getServerTimeOffset());
  const [isSynced, setIsSynced] = useState<boolean>(() => isServerTimeSynced());

  useEffect(() => {
    if (!isServerTimeSynced()) {
      void syncServerTime().then(() => {
        setIsSynced(isServerTimeSynced());
      });
    }

    const unsubscribe = subscribeToOffsetChanges((newOffset) => {
      setOffsetMs(newOffset);
      setIsSynced(isServerTimeSynced());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    offsetMs,
    isSynced,
    sync: syncServerTime,
  };
}
