import { logAuditEvent } from '@/lib/audit';

describe('logAuditEvent', () => {
  it('inserts audit log payload when user is authenticated', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'test-organizer-id',
              email: 'organizer@prayatna.acm.org',
            },
          },
        }),
      },
      from: jest.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };

    await logAuditEvent({
      supabase: mockSupabase as any,
      action: 'CREATE_PROBLEM',
      resourceType: 'problem_statements',
      resourceId: 'prob-123',
      metadata: { code: 'AI-01', title: 'Edge AI Detection' },
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: 'test-organizer-id',
      actor_email: 'organizer@prayatna.acm.org',
      action: 'CREATE_PROBLEM',
      resource_type: 'problem_statements',
      resource_id: 'prob-123',
      metadata: { code: 'AI-01', title: 'Edge AI Detection' },
    });
  });

  it('skips insert and warns if user is not authenticated', async () => {
    const mockInsert = jest.fn();
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
      from: jest.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await logAuditEvent({
      supabase: mockSupabase as any,
      action: 'DELETE_SCHEDULE',
      resourceType: 'schedule_events',
      resourceId: 'ev-1',
    });

    expect(mockInsert).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
