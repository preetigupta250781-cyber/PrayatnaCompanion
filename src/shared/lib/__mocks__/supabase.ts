export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'mock-user-123',
    app_metadata: {},
    user_metadata: { name: 'Hacker' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
};

export const mockAuthSubscription = {
  unsubscribe: jest.fn(),
};

export const supabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: mockAuthSubscription },
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { session: mockSession, user: mockSession.user },
      error: null,
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
};
