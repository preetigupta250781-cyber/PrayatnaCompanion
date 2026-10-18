import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const { supabase } = jest.requireActual('../supabase');

interface AuthStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

describe('Supabase Client & SecureStore Chunking Adapter', () => {
  // Access the custom adapter passed into auth storage
  const adapter = (supabase.auth as unknown as { storage: AuthStorageAdapter }).storage;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports a configured supabase client', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  describe('SecureStoreChunkingAdapter setItem & getItem', () => {
    it('stores and retrieves items smaller than chunk size directly', async () => {
      const key = 'test-key-small';
      const value = 'small-token-value';

      await adapter.setItem(key, value);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(key, value);

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null); // no chunk count
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(value);

      const retrieved = await adapter.getItem(key);
      expect(retrieved).toBe(value);
    });

    it('splits large items exceeding 1800 bytes into chunks with count metadata', async () => {
      const key = 'test-key-large';
      // Create a 4000 byte string
      const largeValue = 'A'.repeat(4000);

      await adapter.setItem(key, largeValue);

      // 4000 bytes with 1800 byte chunk size -> 3 chunks
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${key}__chunk_count`, '3');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${key}__chunk_0`, 'A'.repeat(1800));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${key}__chunk_1`, 'A'.repeat(1800));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${key}__chunk_2`, 'A'.repeat(400));
    });

    it('reassembles chunked items correctly during getItem', async () => {
      const key = 'test-key-chunked';
      const chunk0 = 'first-part-';
      const chunk1 = 'second-part';

      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => {
        if (k === `${key}__chunk_count`) return '2';
        if (k === `${key}__chunk_0`) return chunk0;
        if (k === `${key}__chunk_1`) return chunk1;
        return null;
      });

      const result = await adapter.getItem(key);
      expect(result).toBe(`${chunk0}${chunk1}`);
    });

    it('returns null if any chunk is missing', async () => {
      const key = 'test-key-corrupted';

      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => {
        if (k === `${key}__chunk_count`) return '2';
        if (k === `${key}__chunk_0`) return 'part1';
        if (k === `${key}__chunk_1`) return null;
        return null;
      });

      const result = await adapter.getItem(key);
      expect(result).toBeNull();
    });

    it('cleans up extra old chunks when a smaller payload is written over previous chunks', async () => {
      const key = 'test-key-shrink';

      // Simulate previously having 3 chunks
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('3');

      // Writing small value
      await adapter.setItem(key, 'short-value');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${key}__chunk_0`);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${key}__chunk_1`);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${key}__chunk_2`);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${key}__chunk_count`);
    });

    it('deletes chunks and metadata during removeItem', async () => {
      const key = 'test-key-remove';

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('2');

      await adapter.removeItem(key);

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${key}__chunk_0`);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${key}__chunk_1`);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${key}__chunk_count`);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(key);
    });

    it('catches and handles exceptions gracefully during getItem and removeItem', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware lock'));

      const result = await adapter.getItem('error-key');
      expect(result).toBeNull();

      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware lock'));
      await expect(adapter.removeItem('error-key')).resolves.not.toThrow();
    });
  });

  describe('Web Storage Fallback', () => {
    const originalOS = Platform.OS;

    beforeAll(() => {
      Platform.OS = 'web';
      // Mock global localStorage
      const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => {
            store[k] = v;
          },
          removeItem: (k: string) => {
            delete store[k];
          },
          clear: () => {
            store = {};
          },
        };
      })();
      Object.defineProperty(globalThis, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });
    });

    afterAll(() => {
      Platform.OS = originalOS;
    });

    it('uses localStorage when Platform.OS is web', async () => {
      await adapter.setItem('web-key', 'web-value');
      const val = await adapter.getItem('web-key');
      expect(val).toBe('web-value');

      await adapter.removeItem('web-key');
      const removed = await adapter.getItem('web-key');
      expect(removed).toBeNull();
    });
  });
});
