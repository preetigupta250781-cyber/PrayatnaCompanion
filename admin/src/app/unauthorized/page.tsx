'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-surface border border-error/30 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-error/15 border border-error/30 flex items-center justify-center text-error mx-auto mb-4">
          <ShieldX className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold tracking-widest text-error uppercase">
          HTTP 403 // Access Denied
        </span>
        <h1 className="text-2xl font-black text-white mt-2">Organizer Privilege Required</h1>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Your current account does not have administrative permissions. The Prayatna Organizer
          Portal is strictly restricted to verified hackathon organizers.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button variant="danger" onClick={handleSignOut} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out & Switch Account
          </Button>
          <Button variant="outline" onClick={() => router.push('/login')} className="w-full">
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
