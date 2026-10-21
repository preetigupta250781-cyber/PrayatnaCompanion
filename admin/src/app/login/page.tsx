'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Terminal } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMessage('Authentication failed. No user record returned.');
        setIsLoading(false);
        return;
      }

      // Check organizer role in public.profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileErr || profile?.role !== 'organizer') {
        await supabase.auth.signOut();
        setErrorMessage('Access Denied: Your account does not possess the organizer role.');
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent mb-4">
            <Terminal className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold tracking-widest text-accent uppercase mb-1">
            Prayatna 2026
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white">Organizer Portal</h1>
          <p className="text-xs text-slate-400 mt-2">
            Restricted access. Authenticate with verified organizer credentials.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-lg border border-error/40 bg-error/10 text-error flex items-start gap-2.5 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Organizer Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="organizer@prayatna.org"
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 font-bold tracking-wide"
            loading={isLoading}
          >
            SIGN IN TO DASHBOARD
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/60 text-center">
          <p className="text-[11px] text-slate-500">
            For access requests or credentials provisioning, run{' '}
            <code className="text-accent bg-accent/10 px-1 py-0.5 rounded">
              npm run create:organizer
            </code>{' '}
            in the terminal.
          </p>
        </div>
      </div>
    </div>
  );
}
