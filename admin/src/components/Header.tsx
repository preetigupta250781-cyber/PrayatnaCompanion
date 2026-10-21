'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export const Header: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });
  }, [supabase]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Command Center
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surfaceElevated border border-border">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-200 font-medium">
            {userEmail || 'organizer@prayatna.org'}
          </span>
          <Badge variant="accent" size="sm" className="ml-1">
            Organizer
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          loading={isSigningOut}
          className="text-slate-400 hover:text-error"
          title="Sign out of Admin Dashboard"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};
