import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import renderer from 'react-test-renderer';

import { QUERY_KEYS } from '@/shared/lib/query-client';

import { scheduleApi } from '../../api/schedule-api';
import { useSchedule } from '../use-schedule';

jest.mock('../../api/schedule-api');
jest.mock('@/shared/lib/realtime', () => ({
  useTableRealtime: jest.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function ScheduleConsumer({ onData }: { onData: (data: ReturnType<typeof useSchedule>) => void }) {
  const result = useSchedule();
  onData(result);
  return null;
}

describe('useSchedule Hook', () => {
  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (tree) {
      renderer.act(() => {
        tree?.unmount();
      });
      tree = null;
    }
    queryClient.clear();
  });

  it('returns cached schedule events from query client and handles refetch', async () => {
    const mockEvents = [
      {
        id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        title: 'Opening Ceremony',
        description: null,
        location: 'Hall A',
        event_type: 'ceremony' as const,
        starts_at: '2026-10-18T04:00:00.000Z',
        ends_at: '2026-10-18T05:00:00.000Z',
        created_at: '2026-10-17T00:00:00.000Z',
      },
    ];

    queryClient.setQueryData(QUERY_KEYS.schedule, mockEvents);
    (scheduleApi.fetchScheduleEvents as jest.Mock).mockResolvedValue(mockEvents);

    let captured: ReturnType<typeof useSchedule> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ScheduleConsumer
            onData={(d) => {
              captured = d;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(captured).toBeDefined();
    expect(captured?.events).toEqual(mockEvents);
    expect(captured?.isLoading).toBe(false);

    // Test refetch invocation
    await renderer.act(async () => {
      await captured?.refetch();
    });

    expect(scheduleApi.fetchScheduleEvents).toHaveBeenCalled();
  });

  it('handles query error state gracefully when fetch fails', async () => {
    const error = new Error('Fetch failed');
    (scheduleApi.fetchScheduleEvents as jest.Mock).mockRejectedValue(error);
    queryClient.setQueryDefaults(QUERY_KEYS.schedule, {
      retry: false,
    });

    try {
      await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.schedule,
        queryFn: scheduleApi.fetchScheduleEvents,
      });
    } catch {
      // expected
    }

    let captured: ReturnType<typeof useSchedule> | undefined;

    await renderer.act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ScheduleConsumer
            onData={(d) => {
              captured = d;
            }}
          />
        </QueryClientProvider>
      );
    });

    await renderer.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(captured?.isError).toBe(true);
    expect(captured?.error).toBeDefined();
  });
});
