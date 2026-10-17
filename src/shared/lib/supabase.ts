import 'react-native-url-polyfill/auto';
import { createClient, SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { env } from '@/config/env';

// SecureStore has a 2048-byte limit per key-value pair on Android and iOS Keychain.
// We use a safe chunk size of 1800 bytes to account for any internal overhead.
const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = '__chunk_count';
const getChunkKey = (key: string, index: number): string => `${key}__chunk_${index}`;

const isSecureStoreAvailable = Platform.OS !== 'web';

/**
 * Custom auth storage adapter for Supabase that stores tokens in expo-secure-store
 * and transparently chunks payloads exceeding SecureStore's 2KB limit.
 */
const SecureStoreChunkingAdapter: SupportedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isSecureStoreAvailable) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }

    try {
      const chunkCountRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
      if (chunkCountRaw) {
        const count = parseInt(chunkCountRaw, 10);
        if (!isNaN(count) && count > 0) {
          const chunkPromises: Promise<string | null>[] = [];
          for (let i = 0; i < count; i++) {
            chunkPromises.push(SecureStore.getItemAsync(getChunkKey(key, i)));
          }
          const chunks = await Promise.all(chunkPromises);
          if (chunks.some((chunk) => chunk === null)) {
            return null;
          }
          return chunks.join('');
        }
      }

      return await SecureStore.getItemAsync(key);
    } catch (error: unknown) {
      console.warn('SecureStore getItem error:', error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (!isSecureStoreAvailable) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }

    try {
      const existingCountRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
      const existingCount = existingCountRaw ? parseInt(existingCountRaw, 10) : 0;

      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        // Clean up any previously stored chunks
        if (existingCount > 0) {
          for (let i = 0; i < existingCount; i++) {
            await SecureStore.deleteItemAsync(getChunkKey(key, i)).catch(() => {});
          }
          await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => {});
        }
        return;
      }

      // Value exceeds chunk size - split into chunks
      const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
      const writePromises: Promise<void>[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        writePromises.push(SecureStore.setItemAsync(getChunkKey(key, i), chunk));
      }
      await Promise.all(writePromises);

      // Save number of chunks
      await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(totalChunks));

      // Remove single item if it previously existed
      await SecureStore.deleteItemAsync(key).catch(() => {});

      // Clean up previous leftover chunks if previous count was higher than current
      if (existingCount > totalChunks) {
        for (let i = totalChunks; i < existingCount; i++) {
          await SecureStore.deleteItemAsync(getChunkKey(key, i)).catch(() => {});
        }
      }
    } catch (error: unknown) {
      console.error('SecureStore setItem error:', error);
      throw error;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (!isSecureStoreAvailable) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }

    try {
      const existingCountRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
      const existingCount = existingCountRaw ? parseInt(existingCountRaw, 10) : 0;

      if (existingCount > 0) {
        for (let i = 0; i < existingCount; i++) {
          await SecureStore.deleteItemAsync(getChunkKey(key, i)).catch(() => {});
        }
        await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (error: unknown) {
      console.warn('SecureStore removeItem error:', error);
    }
  },
};

export const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: SecureStoreChunkingAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
