import { queryClient } from '../query-client';

describe('QueryClient Configuration', () => {
  it('creates query client with default retry and staleTime', () => {
    expect(queryClient).toBeDefined();
    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.retry).toBe(2);
    expect(defaultOptions.queries?.staleTime).toBe(300000);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
  });
});
