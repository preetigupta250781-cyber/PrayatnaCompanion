import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import { logger } from '@/shared/lib/logger';

export interface AuthState {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isInitialized: false,
  setSession: (session: Session | null) =>
    set({
      session,
      user: session?.user ?? null,
    }),
  setIsInitialized: (isInitialized: boolean) => set({ isInitialized }),
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: unknown) {
      logger.warn('Sign out error', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      set({ session: null, user: null });
    }
  },
}));
