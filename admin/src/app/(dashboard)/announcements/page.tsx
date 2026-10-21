'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Megaphone,
  Send,
  AlertTriangle,
  Info,
  Flame,
  Trash2,
  Clock,
  Sparkles,
  Search,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { announcementSchema, AnnouncementInput } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatInIST } from '@/lib/date';
import { Database } from '@/types/database';

type Announcement = Database['public']['Tables']['announcements']['Row'];

const PRIORITY_CONFIG = {
  normal: {
    label: 'Normal',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    icon: Info,
    iconColor: 'text-blue-400',
  },
  important: {
    label: 'Important',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  urgent: {
    label: 'Urgent',
    badge: 'bg-red-500/15 text-red-400 border-red-500/40',
    border: 'border-red-500/40 hover:border-red-500/60',
    icon: Flame,
    iconColor: 'text-red-400 animate-pulse',
  },
};

export default function AnnouncementsPage() {
  const supabase = createClient();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Composer State
  const [formData, setFormData] = useState<AnnouncementInput>({
    title: '',
    body: '',
    priority: 'normal',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Delete State
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setAnnouncements(data || []);
    } catch (err: unknown) {
      console.error('Error fetching announcements:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve announcements.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const parseResult = announcementSchema.safeParse(formData);
    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        errMap[err.path[0] as string] = err.message;
      });
      setFormErrors(errMap);
      return;
    }

    setIsBroadcasting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: created, error: insertErr } = await supabase
        .from('announcements')
        .insert({
          title: parseResult.data.title,
          body: parseResult.data.body,
          priority: parseResult.data.priority,
          created_by: user?.id || null,
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      await logAuditEvent({
        action: 'CREATE_ANNOUNCEMENT',
        resourceType: 'announcements',
        resourceId: created?.id,
        metadata: {
          title: parseResult.data.title,
          priority: parseResult.data.priority,
        },
      });

      // Reset form
      setFormData({ title: '', body: '', priority: 'normal' });
      await fetchAnnouncements();
    } catch (err: unknown) {
      console.error('Error broadcasting announcement:', err);
      setFormErrors({
        form: err instanceof Error ? err.message : 'Failed to broadcast announcement.',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement) return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase
        .from('announcements')
        .delete()
        .eq('id', deletingAnnouncement.id);

      if (delErr) throw delErr;

      await logAuditEvent({
        action: 'DELETE_ANNOUNCEMENT',
        resourceType: 'announcements',
        resourceId: deletingAnnouncement.id,
        metadata: {
          title: deletingAnnouncement.title,
          priority: deletingAnnouncement.priority,
        },
      });

      setDeletingAnnouncement(null);
      await fetchAnnouncements();
    } catch (err: unknown) {
      console.error('Error deleting announcement:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete announcement.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAnnouncements = announcements.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q || item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q);

    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const previewConfig =
    PRIORITY_CONFIG[formData.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
  const PreviewIcon = previewConfig.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-[#00F0FF]" />
          Announcements Desk
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Compose real-time broadcasts sent immediately to all participants and organizers.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchAnnouncements} />}

      {/* Composer Section with Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-[#12161F] border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-base font-semibold text-white">Compose Broadcast</h2>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            {formErrors.form && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formErrors.form}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Announcement Title <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Dinner is served in Cafeteria A"
                required
              />
              {formErrors.title && <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Priority Level <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['normal', 'important', 'urgent'] as const).map((level) => {
                  const cfg = PRIORITY_CONFIG[level];
                  const Icon = cfg.icon;
                  const isSelected = formData.priority === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: level })}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? `${cfg.badge} border-current ring-1 ring-current`
                          : 'bg-[#0A0D14] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                      <span className="capitalize">{level}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Message Body <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
                placeholder="Detailed instructions, venue directions, or reminders..."
                className="w-full bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
                required
              />
              {formErrors.body && <p className="text-xs text-red-400 mt-1">{formErrors.body}</p>}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isBroadcasting} className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {isBroadcasting ? 'Broadcasting...' : 'Broadcast Announcement'}
              </Button>
            </div>
          </form>
        </div>

        {/* Live Card Preview Column */}
        <div className="lg:col-span-5 bg-[#12161F]/60 border border-zinc-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-zinc-800/80 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              Live Participant App Preview
            </div>

            {/* Simulated Mobile Card */}
            <div
              className={`bg-[#0A0D14] border rounded-xl p-4 space-y-3 transition-colors ${previewConfig.border}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PreviewIcon className={`w-4 h-4 ${previewConfig.iconColor}`} />
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border uppercase tracking-wider ${previewConfig.badge}`}
                  >
                    {formData.priority}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">Just now</span>
              </div>

              <h3 className="text-sm font-semibold text-white">
                {formData.title.trim() || 'Announcement Title Preview'}
              </h3>

              <p className="text-xs text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                {formData.body.trim() ||
                  'Your announcement message content will appear formatted like this in participants’ mobile devices.'}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 text-center mt-4">
            Subscribers receive instant Supabase Realtime alerts across mobile tabs.
          </p>
        </div>
      </div>

      {/* Broadcasted Announcements History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Broadcast History</h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter broadcast history by priority"
              className="bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00F0FF]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-[#12161F] border border-zinc-800/80 rounded-xl p-10 text-center">
            <Megaphone className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-white mb-1">No Announcements Found</h3>
            <p className="text-xs text-zinc-400">
              {searchQuery || priorityFilter !== 'all'
                ? 'No past broadcasts match the filter.'
                : 'Compose your first broadcast above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredAnnouncements.map((item) => {
              const cfg =
                PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG] ||
                PRIORITY_CONFIG.normal;
              const Icon = cfg.icon;

              return (
                <div
                  key={item.id}
                  className={`bg-[#12161F] border ${cfg.border} rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border uppercase tracking-wider ${cfg.badge}`}
                      >
                        {item.priority}
                      </span>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    </div>

                    <p className="text-xs text-zinc-300 whitespace-pre-wrap">{item.body}</p>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>Broadcast: {formatInIST(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingAnnouncement(item)}
                      className="text-zinc-400 hover:text-red-400"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingAnnouncement)}
        onClose={() => !isDeleting && setDeletingAnnouncement(null)}
        title="Delete Announcement"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete broadcast{' '}
            <span className="font-semibold text-white">
              &ldquo;{deletingAnnouncement?.title}&rdquo;
            </span>
            ? It will be removed from all participant streams.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={() => setDeletingAnnouncement(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Broadcast'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
