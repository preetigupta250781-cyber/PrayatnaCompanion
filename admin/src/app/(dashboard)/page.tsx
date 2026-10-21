'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  Calendar,
  Code2,
  Megaphone,
  Trophy,
  Bus,
  ArrowRight,
  Clock,
  Activity,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatInIST } from '@/lib/date';

interface DashboardStats {
  participantCount: number;
  teamCount: number;
  scheduleCount: number;
  problemCount: number;
  releasedProblemCount: number;
  announcementCount: number;
  routeCount: number;
  publishedRounds: string[];
}

interface AuditLogRow {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string;
  created_at: string;
}

export default function DashboardOverviewPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();

      const [
        { count: participantCount, error: pErr },
        { count: teamCount, error: tErr },
        { count: scheduleCount, error: sErr },
        { data: problems, error: prErr },
        { count: announcementCount, error: aErr },
        { count: routeCount, error: rErr },
        { data: publishedEntries, error: lErr },
        { data: audits, error: auErr },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'participant'),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('schedule_events').select('*', { count: 'exact', head: true }),
        supabase.from('problem_statements').select('release_at'),
        supabase.from('announcements').select('*', { count: 'exact', head: true }),
        supabase.from('bus_routes').select('*', { count: 'exact', head: true }),
        supabase.from('leaderboard_entries').select('round_name').eq('published', true),
        supabase
          .from('audit_logs')
          .select('id, actor_email, action, resource_type, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (pErr || tErr || sErr || prErr || aErr || rErr || lErr || auErr) {
        throw new Error(
          pErr?.message ||
            tErr?.message ||
            sErr?.message ||
            prErr?.message ||
            aErr?.message ||
            rErr?.message ||
            lErr?.message ||
            auErr?.message ||
            'Error loading overview metrics'
        );
      }

      const problemList = problems || [];
      const releasedCount = problemList.filter((p) => p.release_at <= nowIso).length;
      const uniquePublishedRounds = Array.from(
        new Set((publishedEntries || []).map((e) => e.round_name))
      );

      setStats({
        participantCount: participantCount || 0,
        teamCount: teamCount || 0,
        scheduleCount: scheduleCount || 0,
        problemCount: problemList.length,
        releasedProblemCount: releasedCount,
        announcementCount: announcementCount || 0,
        routeCount: routeCount || 0,
        publishedRounds: uniquePublishedRounds,
      });

      setRecentAudits(audits || []);
    } catch (err: unknown) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve hackathon metrics.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-150">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <ErrorBanner message={error || undefined} onRetry={fetchDashboardData} />;
  }

  const statCards = [
    {
      label: 'Registered Participants',
      value: stats.participantCount,
      icon: Users,
      href: '/participants',
      color: 'text-sky-400',
      badge: 'Active Roster',
      badgeVariant: 'accent' as const,
    },
    {
      label: 'Hackathon Squads',
      value: stats.teamCount,
      icon: Shield,
      href: '/teams',
      color: 'text-indigo-400',
      badge: `${stats.teamCount} Teams`,
      badgeVariant: 'default' as const,
    },
    {
      label: 'Problem Statements',
      value: `${stats.releasedProblemCount} / ${stats.problemCount}`,
      icon: Code2,
      href: '/problems',
      color: 'text-emerald-400',
      badge: stats.releasedProblemCount === stats.problemCount ? 'All Unlocked' : 'Time-Locked',
      badgeVariant:
        stats.releasedProblemCount === stats.problemCount
          ? ('success' as const)
          : ('warning' as const),
    },
    {
      label: 'Schedule Timeline',
      value: stats.scheduleCount,
      icon: Calendar,
      href: '/schedule',
      color: 'text-amber-400',
      badge: 'IST Sync Active',
      badgeVariant: 'default' as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Live Command Center
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Prayatna 2026 Hackathon Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time management portal for participants, evaluations, timeline, announcements, and
            logistics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" size="md">
            ● Supabase Connected
          </Badge>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className="p-5 rounded-xl bg-surface border border-border hover:border-slate-500 hover:bg-surfaceElevated transition-all flex flex-col justify-between group select-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-white">{card.value}</span>
                <Badge variant={card.badgeVariant} size="sm">
                  {card.badge}
                </Badge>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-slate-400 group-hover:text-accent transition-colors">
                <span>Manage records</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Management Shortcuts */}
        <div className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Operational Modules
              </h2>
              <span className="text-xs text-slate-400 font-medium">Click to navigate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/announcements"
                className="p-3.5 rounded-lg bg-surfaceElevated border border-border hover:border-accent/40 transition-colors flex items-center gap-3"
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-sm font-bold text-white">Announcements</div>
                  <div className="text-xs text-slate-400">{stats.announcementCount} broadcasts</div>
                </div>
              </Link>

              <Link
                href="/leaderboard"
                className="p-3.5 rounded-lg bg-surfaceElevated border border-border hover:border-accent/40 transition-colors flex items-center gap-3"
              >
                <Trophy className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-sm font-bold text-white">Leaderboard</div>
                  <div className="text-xs text-slate-400">
                    {stats.publishedRounds.length > 0
                      ? `${stats.publishedRounds.join(', ')} Published`
                      : 'No Rounds Published'}
                  </div>
                </div>
              </Link>

              <Link
                href="/bus"
                className="p-3.5 rounded-lg bg-surfaceElevated border border-border hover:border-accent/40 transition-colors flex items-center gap-3"
              >
                <Bus className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-sm font-bold text-white">Bus Transit</div>
                  <div className="text-xs text-slate-400">{stats.routeCount} scheduled routes</div>
                </div>
              </Link>

              <Link
                href="/participants"
                className="p-3.5 rounded-lg bg-surfaceElevated border border-border hover:border-accent/40 transition-colors flex items-center gap-3"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-bold text-white">CSV Importer</div>
                  <div className="text-xs text-slate-400">Bulk upload participant credentials</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Live Audit Log Preview */}
        <div className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Recent Organizer Audit Trail
              </h2>
              <Link
                href="/audit-logs"
                className="text-xs text-accent hover:underline font-semibold"
              >
                View Full Audit History →
              </Link>
            </div>

            {recentAudits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-border rounded-lg">
                No recent administrative actions recorded yet. Actions taken across schedule,
                problems, and scores will be logged here.
              </div>
            ) : (
              <div className="space-y-2">
                {recentAudits.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-surfaceElevated border border-border flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="accent" size="sm">
                        {item.action}
                      </Badge>
                      <span className="text-slate-300 font-medium">{item.resource_type}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      {formatInIST(item.created_at, 'hh:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
