'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  Code2,
  Megaphone,
  Trophy,
  Bus,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/participants', label: 'Participants', icon: Users },
  { href: '/teams', label: 'Teams', icon: Shield },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/problems', label: 'Problem Statements', icon: Code2 },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/bus', label: 'Bus Transit', icon: Bus },
  { href: '/audit-logs', label: 'Audit Logs', icon: FileText },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent text-lg">
          P
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-white block leading-none">
            Prayatna{' '}
            <span className="text-accent text-xs font-bold px-1.5 py-0.5 rounded bg-accent/10 border border-accent/30 ml-1">
              ADMIN
            </span>
          </span>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
            Organizer Portal
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors select-none',
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surfaceElevated border border-transparent'
              )}
            >
              <Icon className={clsx('w-4 h-4', isActive ? 'text-accent' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-surfaceElevated/40 text-[11px] text-slate-500 text-center">
        Prayatna 2026 • Medi-Caps Univ
      </div>
    </aside>
  );
};
