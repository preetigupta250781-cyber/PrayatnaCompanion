import type { Session, User } from '@supabase/supabase-js';

import { useAuthStore } from '../model/auth-store';

export interface UseSessionReturn {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
  signOut: (notice?: string) => Promise<void>;
}

/**
 * Hook providing reactive access to current auth session and user identity.
 */
export function useSession(): UseSessionReturn {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const authNotice = useAuthStore((s) => s.authNotice);
  const clearAuthNotice = useAuthStore((s) => s.clearAuthNotice);
  const signOut = useAuthStore((s) => s.signOut);

  return {
    session,
    user,
    isAuthenticated: session !== null,
    isInitialized,
    isLoading: !isInitialized,
    authNotice,
    clearAuthNotice,
    signOut,
  };
}
