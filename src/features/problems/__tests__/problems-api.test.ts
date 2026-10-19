import { supabase } from '@/shared/lib/supabase';

import { problemsApi } from '../api/problems-api';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe('problemsApi', () => {
  const mockFrom = supabase.from as jest.Mock;
  const mockRpc = supabase.rpc as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProblemStatements', () => {
    it('fetches and validates problem statements ordered by code', async () => {
      const mockRawData = [
        {
          id: 'b1111111-0001-4000-a000-000000000001',
          code: 'PRB-AI-01',
          title: 'Emergency Dispatch Coordinator',
          description: 'Build an AI dispatcher',
          domain: 'Artificial Intelligence',
          difficulty: 'Hard',
          release_at: '2026-10-18T10:00:00.000Z',
          created_at: '2026-10-17T00:00:00.000Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockRawData, error: null });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await problemsApi.fetchProblemStatements();

      expect(mockFrom).toHaveBeenCalledWith('problem_statements');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('code', { ascending: true });
      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe('PRB-AI-01');
    });

    it('returns empty array when data is null', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      const result = await problemsApi.fetchProblemStatements();
      expect(result).toEqual([]);
    });

    it('throws AppError when Supabase returns an error', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network request failed', code: 'PGRST500' },
      });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      await expect(problemsApi.fetchProblemStatements()).rejects.toMatchObject({
        userMessage: expect.any(String),
      });
    });

    it('throws AppError when data violates zod schema', async () => {
      const invalidData = [
        {
          id: 'invalid-id',
          code: '', // Invalid empty code
          title: 'Missing fields',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: invalidData, error: null });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      await expect(problemsApi.fetchProblemStatements()).rejects.toMatchObject({
        userMessage: expect.any(String),
      });
    });
  });

  describe('fetchProblemStatementById', () => {
    it('fetches a single problem statement by ID successfully', async () => {
      const mockItem = {
        id: 'b1111111-0001-4000-a000-000000000001',
        code: 'PRB-AI-01',
        title: 'Emergency Dispatch Coordinator',
        description: 'Build an AI dispatcher',
        domain: 'Artificial Intelligence',
        difficulty: 'Hard',
        release_at: '2026-10-18T10:00:00.000Z',
        created_at: '2026-10-17T00:00:00.000Z',
      };

      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

      const result = await problemsApi.fetchProblemStatementById(mockItem.id);
      expect(result?.id).toBe(mockItem.id);
      expect(result?.code).toBe('PRB-AI-01');
    });

    it('returns null when problem statement is not found', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

      const result = await problemsApi.fetchProblemStatementById(
        'b1111111-0000-0000-0000-000000000000'
      );
      expect(result).toBeNull();
    });
  });

  describe('fetchNextProblemRelease', () => {
    it('returns next release timestamp from RPC', async () => {
      const mockTimestamp = '2026-10-25T14:00:00.000Z';
      mockRpc.mockResolvedValue({ data: mockTimestamp, error: null });

      const result = await problemsApi.fetchNextProblemRelease();
      expect(mockRpc).toHaveBeenCalledWith('next_problem_release');
      expect(result).toBe(mockTimestamp);
    });

    it('returns null when no upcoming releases remain', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await problemsApi.fetchNextProblemRelease();
      expect(result).toBeNull();
    });

    it('throws AppError when RPC fails', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'PGRST500' },
      });

      await expect(problemsApi.fetchNextProblemRelease()).rejects.toMatchObject({
        userMessage: expect.any(String),
      });
    });
  });
});
