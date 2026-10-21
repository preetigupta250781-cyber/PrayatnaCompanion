'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, Clock, MapPin, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { scheduleEventSchema } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatInIST, toISTInputValue, fromISTInputValue } from '@/lib/date';
import { Database } from '@/types/database';

type ScheduleEvent = Database['public']['Tables']['schedule_events']['Row'];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ceremony: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  judging: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  meal: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  workshop: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  session: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  jamming: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  other: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
};

interface FormState {
  title: string;
  description: string;
  location: string;
  event_type: 'session' | 'workshop' | 'jamming' | 'judging' | 'meal' | 'ceremony' | 'other';
  starts_at_ist: string;
  ends_at_ist: string;
}

export default function SchedulePage() {
  const supabase = createClient();

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    location: '',
    event_type: 'session',
    starts_at_ist: '',
    ends_at_ist: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingEvent, setDeletingEvent] = useState<ScheduleEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('schedule_events')
        .select('*')
        .order('starts_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      setEvents(data || []);
    } catch (err: unknown) {
      console.error('Error fetching schedule events:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve schedule events.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Derive unique days in IST for grouping and tabs
  const days = useMemo(() => {
    const daySet = new Set<string>();
    events.forEach((ev) => {
      const dayStr = formatInIST(ev.starts_at, 'yyyy-MM-dd');
      if (dayStr !== '—' && dayStr !== 'Invalid date') {
        daySet.add(dayStr);
      }
    });
    return Array.from(daySet).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedTypeFilter === 'all' || ev.event_type === selectedTypeFilter;

      const evDay = formatInIST(ev.starts_at, 'yyyy-MM-dd');
      const matchesDay = selectedDayFilter === 'all' || evDay === selectedDayFilter;

      return matchesSearch && matchesType && matchesDay;
    });
  }, [events, searchQuery, selectedTypeFilter, selectedDayFilter]);

  // Group filtered events by Day string
  const groupedEvents = useMemo(() => {
    const groups: Record<string, ScheduleEvent[]> = {};
    filteredEvents.forEach((ev) => {
      const dayLabel = formatInIST(ev.starts_at, 'EEEE, dd MMMM yyyy');
      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(ev);
    });
    return groups;
  }, [filteredEvents]);

  const openCreateModal = () => {
    setEditingEvent(null);
    // Default start to current IST time, ends 1 hour later
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setFormData({
      title: '',
      description: '',
      location: '',
      event_type: 'session',
      starts_at_ist: toISTInputValue(now),
      ends_at_ist: toISTInputValue(oneHourLater),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      event_type: event.event_type as FormState['event_type'],
      starts_at_ist: toISTInputValue(event.starts_at),
      ends_at_ist: toISTInputValue(event.ends_at),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Convert IST inputs to UTC ISO
    const startsAtUtc = fromISTInputValue(formData.starts_at_ist);
    const endsAtUtc = fromISTInputValue(formData.ends_at_ist);

    const parseResult = scheduleEventSchema.safeParse({
      title: formData.title,
      description: formData.description,
      location: formData.location,
      event_type: formData.event_type,
      starts_at: startsAtUtc,
      ends_at: endsAtUtc,
    });

    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'starts_at') errMap['starts_at_ist'] = err.message;
        else if (field === 'ends_at') errMap['ends_at_ist'] = err.message;
        else errMap[field] = err.message;
      });
      setFormErrors(errMap);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: parseResult.data.title,
        description: parseResult.data.description || null,
        location: parseResult.data.location || null,
        event_type: parseResult.data.event_type,
        starts_at: parseResult.data.starts_at,
        ends_at: parseResult.data.ends_at,
      };

      if (editingEvent) {
        const { error: updateErr } = await supabase
          .from('schedule_events')
          .update(payload)
          .eq('id', editingEvent.id);

        if (updateErr) throw updateErr;

        await logAuditEvent({
          action: 'UPDATE_SCHEDULE',
          resourceType: 'schedule_events',
          resourceId: editingEvent.id,
          metadata: { title: payload.title, starts_at: payload.starts_at },
        });
      } else {
        const { data: created, error: insertErr } = await supabase
          .from('schedule_events')
          .insert(payload)
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        await logAuditEvent({
          action: 'CREATE_SCHEDULE',
          resourceType: 'schedule_events',
          resourceId: created?.id,
          metadata: { title: payload.title, starts_at: payload.starts_at },
        });
      }

      setIsModalOpen(false);
      await fetchEvents();
    } catch (err: unknown) {
      console.error('Error saving schedule event:', err);
      setFormErrors({
        form: err instanceof Error ? err.message : 'Failed to save event.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', deletingEvent.id);

      if (delErr) throw delErr;

      await logAuditEvent({
        action: 'DELETE_SCHEDULE',
        resourceType: 'schedule_events',
        resourceId: deletingEvent.id,
        metadata: { title: deletingEvent.title },
      });

      setDeletingEvent(null);
      await fetchEvents();
    } catch (err: unknown) {
      console.error('Error deleting event:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#00F0FF]" />
            Schedule Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create, edit, and organize schedule events in Indian Standard Time (IST).
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Schedule Event
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchEvents} />}

      {/* Filters & Search */}
      <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by title, location, desc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-zinc-400">Type:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              aria-label="Filter events by type"
              className="bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00F0FF]"
            >
              <option value="all">All Types</option>
              <option value="session">Session</option>
              <option value="workshop">Workshop</option>
              <option value="jamming">Jamming</option>
              <option value="judging">Judging</option>
              <option value="meal">Meal</option>
              <option value="ceremony">Ceremony</option>
              <option value="other">Other</option>
            </select>

            <span className="text-xs text-zinc-400 ml-2">Day:</span>
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              aria-label="Filter events by day"
              className="bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00F0FF]"
            >
              <option value="all">All Days</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events List / Day Groupings */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : Object.keys(groupedEvents).length === 0 ? (
        <div className="bg-[#12161F] border border-zinc-800/80 rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No Schedule Events Found</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-4">
            {searchQuery || selectedTypeFilter !== 'all' || selectedDayFilter !== 'all'
              ? 'No events match your current filter criteria.'
              : 'Add schedule events with start and end times in IST.'}
          </p>
          <Button onClick={openCreateModal} variant="outline" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Event
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([dayLabel, dayEvents]) => (
            <div key={dayLabel} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-px bg-zinc-800 flex-1" />
                <h2 className="text-sm font-semibold tracking-wider uppercase text-[#00F0FF] bg-[#12161F] px-3 py-1 rounded-full border border-[#00F0FF]/20 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {dayLabel}
                </h2>
                <span className="h-px bg-zinc-800 flex-1" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {dayEvents.map((event) => {
                  const fallbackStyle = {
                    bg: 'bg-zinc-500/10',
                    text: 'text-zinc-400',
                    border: 'border-zinc-500/30',
                  };
                  const typeStyle =
                    EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.other ?? fallbackStyle;
                  return (
                    <div
                      key={event.id}
                      className="bg-[#12161F] border border-zinc-800/80 hover:border-zinc-700 transition-colors rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border} uppercase tracking-wider`}
                          >
                            {event.event_type}
                          </span>
                          <h3 className="text-base font-semibold text-white">{event.title}</h3>
                        </div>

                        {event.description && (
                          <p className="text-sm text-zinc-400 line-clamp-2">{event.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
                            <span>
                              {formatInIST(event.starts_at, 'hh:mm a')} -{' '}
                              {formatInIST(event.ends_at, 'hh:mm a')}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1.5 text-zinc-300">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800/60 w-full md:w-auto justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(event)}
                          className="text-zinc-400 hover:text-white"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingEvent(event)}
                          className="text-zinc-400 hover:text-red-400"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingEvent ? 'Edit Schedule Event' : 'Add New Schedule Event'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formErrors.form}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Event Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Opening Ceremony & Keynote"
              required
            />
            {formErrors.title && <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Event Category <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.event_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    event_type: e.target.value as FormState['event_type'],
                  })
                }
                className="w-full bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
              >
                <option value="session">Session</option>
                <option value="workshop">Workshop</option>
                <option value="jamming">Jamming</option>
                <option value="judging">Judging</option>
                <option value="meal">Meal</option>
                <option value="ceremony">Ceremony</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Location / Venue
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Auditorium Hall B"
              />
              {formErrors.location && (
                <p className="text-xs text-red-400 mt-1">{formErrors.location}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Start Time (IST) <span className="text-red-400">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.starts_at_ist}
                onChange={(e) => setFormData({ ...formData, starts_at_ist: e.target.value })}
                required
              />
              {formErrors.starts_at_ist && (
                <p className="text-xs text-red-400 mt-1">{formErrors.starts_at_ist}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                End Time (IST) <span className="text-red-400">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.ends_at_ist}
                onChange={(e) => setFormData({ ...formData, ends_at_ist: e.target.value })}
                required
              />
              {formErrors.ends_at_ist && (
                <p className="text-xs text-red-400 mt-1">{formErrors.ends_at_ist}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Description / Notes
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Provide event details, speaker info, instructions for participants..."
              className="w-full bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
            />
            {formErrors.description && (
              <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingEvent)}
        onClose={() => !isDeleting && setDeletingEvent(null)}
        title="Confirm Event Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete the schedule event{' '}
            <span className="font-semibold text-white">&ldquo;{deletingEvent?.title}&rdquo;</span>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" onClick={() => setDeletingEvent(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
