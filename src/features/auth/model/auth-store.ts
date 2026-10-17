import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';

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
      console.warn('Sign out error:', error);
    } finally {
      set({ session: null, user: null });
    }
  },
}));
