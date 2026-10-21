'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  FileJson,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatInIST } from '@/lib/date';
import { Database } from '@/types/database';

type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];

export default function AuditLogsPage() {
  const supabase = createClient();

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Metadata Inspector Modal
  const [inspectingLog, setInspectingLog] = useState<AuditLogRow | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (fetchErr) throw fetchErr;
      setLogs(data || []);
    } catch (err: unknown) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve audit trail.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.actor_email && log.actor_email.toLowerCase().includes(q)) ||
        log.action.toLowerCase().includes(q) ||
        log.resource_type.toLowerCase().includes(q) ||
        (log.resource_id && log.resource_id.toLowerCase().includes(q));

      const matchesAction =
        actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter.toLowerCase());

      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, actionFilter]);

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('UNPUBLISH')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (act.includes('CREATE') || act.includes('IMPORT') || act.includes('PUBLISH')) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (act.includes('UPDATE') || act.includes('SAVE') || act.includes('SCORE')) {
      return <Badge variant="neon">{action}</Badge>;
    }
    return <Badge variant="neutral">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#00F0FF]" />
            Organizer Audit Logs
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Immutable security audit trail of all organizer modifications across event operations.
          </p>
        </div>
        <Button
          onClick={fetchLogs}
          variant="outline"
          className="flex items-center gap-2 self-start sm:self-auto text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Log Feed
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchLogs} />}

      {/* Filters Bar */}
      <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search email, action, resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter audit logs by action category"
            className="bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00F0FF]"
          >
            <option value="all">All Action Categories</option>
            <option value="CREATE">Create Events</option>
            <option value="UPDATE">Update Events</option>
            <option value="DELETE">Delete Events</option>
            <option value="PUBLISH">Publish / Unpublish</option>
            <option value="IMPORT">Import Operations</option>
            <option value="SCORE">Scoring Operations</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#12161F] border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={8} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Activity className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm">No audit logs found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-[#0A0D14] text-xs uppercase font-medium text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Organizer</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Resource ID</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-zinc-300 whitespace-nowrap">
                      {formatInIST(log.created_at)}
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="font-medium text-white truncate max-w-[180px]">
                          {log.actor_email || log.actor_id || 'System'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>

                    <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                      {log.resource_type}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-zinc-500 truncate max-w-[120px]">
                      {log.resource_id || '—'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {log.metadata ? (
                        <button
                          type="button"
                          onClick={() => setInspectingLog(log)}
                          className="inline-flex items-center gap-1 text-xs text-[#00F0FF] hover:underline"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                          View JSON
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Metadata Inspector Modal */}
      <Modal
        isOpen={Boolean(inspectingLog)}
        onClose={() => setInspectingLog(null)}
        title="Audit Log Payload Details"
      >
        {inspectingLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs bg-[#0A0D14] p-3 rounded-lg border border-zinc-800">
              <div>
                <span className="text-zinc-500 block">Action:</span>
                <span className="text-white font-mono">{inspectingLog.action}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Resource:</span>
                <span className="text-white font-mono">{inspectingLog.resource_type}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Actor:</span>
                <span className="text-white truncate">{inspectingLog.actor_email}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Timestamp:</span>
                <span className="text-white">{formatInIST(inspectingLog.created_at)}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-zinc-400 block mb-1">
                Metadata JSON Payload
              </span>
              <pre className="p-3 bg-[#0A0D14] border border-zinc-800 rounded-lg text-xs font-mono text-[#00F0FF] overflow-x-auto max-h-64">
                {JSON.stringify(inspectingLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setInspectingLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
