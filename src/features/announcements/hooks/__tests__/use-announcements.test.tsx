import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import renderer from 'react-test-renderer';

import { QUERY_KEYS } from '@/shared/lib/query-client';

import { announcementsApi } from '../../api/announcements-api';
import { useAnnouncements } from '../use-announcements';

jest.mock('../../api/announcements-api');
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

function AnnouncementsConsumer({
  onData,
}: {
  onData: (data: ReturnType<typeof useAnnouncements>) => void;
}) {
  const result = useAnnouncements();
  onData(result);
  return null;
}

describe('useAnnouncements Hook', () => {
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

  it('returns cached announcements from query client and handles refetch', async () => {
    const mockAnnouncements = [
      {
        id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf1',
        title: 'Emergency Maintenance',
        body: 'Git server will restart in 5 minutes.',
        priority: 'urgent' as const,
        created_by: null,
        created_at: '2026-10-18T05:00:00.000Z',
      },
    ];

    queryClient.setQueryData(QUERY_KEYS.announcements, mockAnnouncements);
    (announcementsApi.fetchAnnouncements as jest.Mock).mockResolvedValue(mockAnnouncements);

    let captured: ReturnType<typeof useAnnouncements> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <AnnouncementsConsumer
            onData={(d) => {
              captured = d;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(captured).toBeDefined();
    expect(captured?.announcements).toEqual(mockAnnouncements);
    expect(captured?.isLoading).toBe(false);

    // Test refetch
    await renderer.act(async () => {
      await captured?.refetch();
    });

    expect(announcementsApi.fetchAnnouncements).toHaveBeenCalled();
  });

  it('handles query error state gracefully when fetch fails', async () => {
    const error = new Error('Network error');
    (announcementsApi.fetchAnnouncements as jest.Mock).mockRejectedValue(error);
    queryClient.setQueryDefaults(QUERY_KEYS.announcements, {
      retry: false,
    });

    try {
      await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.announcements,
        queryFn: announcementsApi.fetchAnnouncements,
      });
    } catch {
      // expected
    }

    let captured: ReturnType<typeof useAnnouncements> | undefined;

    await renderer.act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <AnnouncementsConsumer
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
