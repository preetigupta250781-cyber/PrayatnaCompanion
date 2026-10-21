/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

const { createServerClient } = jest.requireMock('@supabase/ssr');

describe('Admin SSR Auth Gate Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('redirects unauthenticated users trying to access dashboard to /login', async () => {
    createServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const req = new NextRequest('https://admin.prayatna.acm.org/participants');
    const res = await updateSession(req);

    expect(res.headers.get('location')).toBe('https://admin.prayatna.acm.org/login');
  });

  it('redirects non-organizer (participant) users to /unauthorized', async () => {
    createServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-participant-1' } },
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'participant' },
            }),
          }),
        }),
      }),
    });

    const req = new NextRequest('https://admin.prayatna.acm.org/schedule');
    const res = await updateSession(req);

    expect(res.headers.get('location')).toBe('https://admin.prayatna.acm.org/unauthorized');
  });

  it('allows verified organizers to access protected dashboard routes', async () => {
    createServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-organizer-1' } },
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'organizer' },
            }),
          }),
        }),
      }),
    });

    const req = new NextRequest('https://admin.prayatna.acm.org/problems');
    const res = await updateSession(req);

    // No redirect location header means allowed through
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects logged-in organizer away from /login to overview /', async () => {
    createServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-organizer-1' } },
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'organizer' },
            }),
          }),
        }),
      }),
    });

    const req = new NextRequest('https://admin.prayatna.acm.org/login');
    const res = await updateSession(req);

    expect(res.headers.get('location')).toBe('https://admin.prayatna.acm.org/');
  });
});
