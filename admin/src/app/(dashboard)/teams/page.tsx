'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Shield, Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { teamSchema, TeamInput } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatInIST } from '@/lib/date';

interface TeamRow {
  id: string;
  name: string;
  team_code: string;
  created_at: string;
  members: {
    id: string;
    full_name: string | null;
    email: string | null;
  }[];
}

export default function TeamsPage() {
  const supabase = createClient();

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null);
  const [formData, setFormData] = useState<TeamInput>({ name: '', team_code: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingTeam, setDeletingTeam] = useState<TeamRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('teams')
        .select(
          `
          id,
          name,
          team_code,
          created_at,
          members:profiles (
            id,
            full_name,
            email
          )
        `
        )
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setTeams((data as unknown as TeamRow[]) || []);
    } catch (err: unknown) {
      console.error('Error fetching teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve teams.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const filteredTeams = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teams;
    return teams.filter(
      (t) => t.name.toLowerCase().includes(q) || t.team_code.toLowerCase().includes(q)
    );
  }, [teams, searchQuery]);

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({ name: '', team_code: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (team: TeamRow) => {
    setEditingTeam(team);
    setFormData({ name: team.name, team_code: team.team_code });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = teamSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (editingTeam) {
        // Update
        const { error: updateErr } = await supabase
          .from('teams')
          .update({ name: result.data.name, team_code: result.data.team_code })
          .eq('id', editingTeam.id);

        if (updateErr) throw updateErr;

        await logAuditEvent({
          supabase,
          action: 'UPDATE_TEAM',
          resourceType: 'teams',
          resourceId: editingTeam.id,
          metadata: { previous: { name: editingTeam.name }, updated: result.data },
        });
      } else {
        // Create
        const { data: newTeam, error: insertErr } = await supabase
          .from('teams')
          .insert({ name: result.data.name, team_code: result.data.team_code })
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        await logAuditEvent({
          supabase,
          action: 'CREATE_TEAM',
          resourceType: 'teams',
          resourceId: newTeam?.id,
          metadata: result.data,
        });
      }

      setIsModalOpen(false);
      await fetchTeams();
    } catch (err: unknown) {
      console.error('Error saving team:', err);
      setFormErrors({ form: err instanceof Error ? err.message : 'Failed to save team' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;
    setIsDeleting(true);

    try {
      const { error: deleteErr } = await supabase.from('teams').delete().eq('id', deletingTeam.id);

      if (deleteErr) throw deleteErr;

      await logAuditEvent({
        supabase,
        action: 'DELETE_TEAM',
        resourceType: 'teams',
        resourceId: deletingTeam.id,
        metadata: { team_name: deletingTeam.name },
      });

      setDeletingTeam(null);
      await fetchTeams();
    } catch (err: unknown) {
      console.error('Error deleting team:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete team.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Squad Management
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">Registered Teams</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage participating squads, join codes, and assigned hackers.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search teams by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surfaceElevated pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 rounded-lg border border-border focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Table & States */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchTeams} />
      ) : filteredTeams.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-dashed border-border rounded-xl space-y-3">
          <Shield className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Teams Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No teams match "${searchQuery}". Clear your search query.`
              : 'No teams created yet. Click "Create Team" to register a squad.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surfaceElevated border-b border-border text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Team Name & Code</th>
                  <th className="px-6 py-3.5">Members</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-surfaceElevated/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-base">{team.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-accent font-mono bg-accent/10 px-2 py-0.5 rounded border border-accent/30 font-semibold">
                          #{team.team_code}
                        </span>
                        <Badge variant="default" size="sm">
                          {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-300">
                      {team.members.length === 0 ? (
                        <span className="text-slate-500 italic">No participants joined yet</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {team.members.map((m) => (
                            <span
                              key={m.id}
                              className="px-2 py-0.5 bg-surfaceElevated rounded text-slate-300 border border-border"
                              title={m.email || undefined}
                            >
                              {m.full_name || m.email || 'Participant'}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatInIST(team.created_at, 'dd MMM yyyy, hh:mm a')}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(team)}
                          title="Edit squad"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTeam(team)}
                          className="text-error hover:bg-error/15"
                          title="Delete squad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeam ? 'Edit Team Details' : 'Create New Team'}
      >
        <form onSubmit={handleSaveTeam} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-xs text-error">
              {formErrors.form}
            </div>
          )}

          <Input
            label="Team Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. CyberSentinels"
            error={formErrors.name}
            required
            autoFocus
          />

          <Input
            label="Team Join Code (Alphanumeric)"
            value={formData.team_code}
            onChange={(e) => setFormData({ ...formData, team_code: e.target.value.toUpperCase() })}
            placeholder="e.g. CYBER-26"
            error={formErrors.team_code}
            helperText="Short alphanumeric code used by participants to join the squad"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {editingTeam ? 'Save Changes' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingTeam)}
        onClose={() => setDeletingTeam(null)}
        title="Confirm Delete Team"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-error/10 border border-error/30 rounded-lg text-xs text-error">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Destructive Action</span>
              Are you sure you want to delete squad <strong>{deletingTeam?.name}</strong>? Assigned
              members will be unassigned from this team.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeletingTeam(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTeam} loading={isDeleting}>
              Delete Team
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
