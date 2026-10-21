'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FileCode2,
  Plus,
  Search,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { problemStatementSchema } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { MarkdownPreview } from '@/components/ui/MarkdownPreview';
import { formatInIST, toISTInputValue, fromISTInputValue } from '@/lib/date';
import { Database } from '@/types/database';

type ProblemStatement = Database['public']['Tables']['problem_statements']['Row'];

interface FormState {
  code: string;
  title: string;
  domain: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  release_at_ist: string;
  description: string;
}

export default function ProblemsPage() {
  const supabase = createClient();

  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Preview Drawer/Modal State
  const [viewingProblem, setViewingProblem] = useState<ProblemStatement | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editingProblem, setEditingProblem] = useState<ProblemStatement | null>(null);
  const [formData, setFormData] = useState<FormState>({
    code: '',
    title: '',
    domain: '',
    difficulty: 'Medium',
    release_at_ist: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingProblem, setDeletingProblem] = useState<ProblemStatement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProblems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('problem_statements')
        .select('*')
        .order('release_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      setProblems(data || []);
    } catch (err: unknown) {
      console.error('Error fetching problem statements:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve problem statements.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const now = useMemo(() => new Date(), []);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.domain && p.domain.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      const matchesDiff = difficultyFilter === 'all' || p.difficulty === difficultyFilter;

      const isReleased = new Date(p.release_at) <= now;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'released' && isReleased) ||
        (statusFilter === 'locked' && !isReleased);

      return matchesSearch && matchesDiff && matchesStatus;
    });
  }, [problems, searchQuery, difficultyFilter, statusFilter, now]);

  const openCreateModal = () => {
    setEditingProblem(null);
    const defaultDate = new Date();
    setFormData({
      code: '',
      title: '',
      domain: 'AI/ML',
      difficulty: 'Medium',
      release_at_ist: toISTInputValue(defaultDate),
      description:
        '### Problem Statement Overview\n\nDescribe the challenge here...\n\n### Requirements\n- Point 1\n- Point 2',
    });
    setFormErrors({});
    setActiveTab('edit');
    setIsModalOpen(true);
  };

  const openEditModal = (problem: ProblemStatement) => {
    setEditingProblem(problem);
    setFormData({
      code: problem.code,
      title: problem.title,
      domain: problem.domain || '',
      difficulty: (problem.difficulty as FormState['difficulty']) || 'Medium',
      release_at_ist: toISTInputValue(problem.release_at),
      description: problem.description || '',
    });
    setFormErrors({});
    setActiveTab('edit');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const releaseAtUtc = fromISTInputValue(formData.release_at_ist);

    const parseResult = problemStatementSchema.safeParse({
      code: formData.code,
      title: formData.title,
      domain: formData.domain,
      difficulty: formData.difficulty,
      release_at: releaseAtUtc,
      description: formData.description,
    });

    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'release_at') errMap['release_at_ist'] = err.message;
        else errMap[field] = err.message;
      });
      setFormErrors(errMap);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: parseResult.data.code,
        title: parseResult.data.title,
        domain: parseResult.data.domain,
        difficulty: parseResult.data.difficulty,
        release_at: parseResult.data.release_at,
        description: parseResult.data.description,
      };

      if (editingProblem) {
        const { error: updateErr } = await supabase
          .from('problem_statements')
          .update(payload)
          .eq('id', editingProblem.id);

        if (updateErr) throw updateErr;

        await logAuditEvent({
          action: 'UPDATE_PROBLEM',
          resourceType: 'problem_statements',
          resourceId: editingProblem.id,
          metadata: { code: payload.code, title: payload.title, release_at: payload.release_at },
        });
      } else {
        const { data: created, error: insertErr } = await supabase
          .from('problem_statements')
          .insert(payload)
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        await logAuditEvent({
          action: 'CREATE_PROBLEM',
          resourceType: 'problem_statements',
          resourceId: created?.id,
          metadata: { code: payload.code, title: payload.title, release_at: payload.release_at },
        });
      }

      setIsModalOpen(false);
      await fetchProblems();
    } catch (err: unknown) {
      console.error('Error saving problem statement:', err);
      setFormErrors({
        form: err instanceof Error ? err.message : 'Failed to save problem statement.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProblem) return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase
        .from('problem_statements')
        .delete()
        .eq('id', deletingProblem.id);

      if (delErr) throw delErr;

      await logAuditEvent({
        action: 'DELETE_PROBLEM',
        resourceType: 'problem_statements',
        resourceId: deletingProblem.id,
        metadata: { code: deletingProblem.code, title: deletingProblem.title },
      });

      setDeletingProblem(null);
      await fetchProblems();
    } catch (err: unknown) {
      console.error('Error deleting problem:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete problem statement.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyBadge = (diff: string | null) => {
    switch (diff) {
      case 'Easy':
        return <Badge variant="success">Easy</Badge>;
      case 'Medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'Hard':
        return <Badge variant="danger">Hard</Badge>;
      default:
        return <Badge variant="neutral">{diff || 'Unset'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-[#00F0FF]" />
            Problem Statements
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage hackathon problem statements, domain tracks, and release schedules (IST).
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Problem Statement
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchProblems} />}

      {/* Filters */}
      <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by code, title, domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-zinc-400">Difficulty:</span>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            aria-label="Filter problems by difficulty"
            className="bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00F0FF]"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <span className="text-xs text-zinc-400 ml-2">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter problems by release status"
            className="bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00F0FF]"
          >
            <option value="all">All Statuses</option>
            <option value="released">Released</option>
            <option value="locked">Locked (Scheduled)</option>
          </select>
        </div>
      </div>

      {/* Problems Grid / Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filteredProblems.length === 0 ? (
        <div className="bg-[#12161F] border border-zinc-800/80 rounded-xl p-12 text-center">
          <FileCode2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No Problems Found</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-4">
            {searchQuery || difficultyFilter !== 'all' || statusFilter !== 'all'
              ? 'No problems match your current filter settings.'
              : 'Add your first problem statement with description and release time.'}
          </p>
          <Button onClick={openCreateModal} variant="outline" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Problem
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProblems.map((problem) => {
            const isReleased = new Date(problem.release_at) <= now;
            return (
              <div
                key={problem.id}
                className="bg-[#12161F] border border-zinc-800/80 hover:border-zinc-700 transition-colors rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
                      {problem.code}
                    </span>
                    <h3 className="text-base font-semibold text-white">{problem.title}</h3>
                    {getDifficultyBadge(problem.difficulty)}
                    {problem.domain && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {problem.domain}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      {isReleased ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          <Unlock className="w-3 h-3" /> Released to Participants
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          <Lock className="w-3 h-3" /> Locked until release
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Release: {formatInIST(problem.release_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800/60 w-full md:w-auto justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingProblem(problem)}
                    className="text-zinc-400 hover:text-[#00F0FF]"
                    title="View Full Markdown Description"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(problem)}
                    className="text-zinc-400 hover:text-white"
                    title="Edit Problem"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingProblem(problem)}
                    className="text-zinc-400 hover:text-red-400"
                    title="Delete Problem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Description Preview Modal */}
      <Modal
        isOpen={Boolean(viewingProblem)}
        onClose={() => setViewingProblem(null)}
        title={
          viewingProblem ? `${viewingProblem.code} - ${viewingProblem.title}` : 'Problem Preview'
        }
      >
        {viewingProblem && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-zinc-800 text-xs text-zinc-400">
              {getDifficultyBadge(viewingProblem.difficulty)}
              {viewingProblem.domain && (
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Track: {viewingProblem.domain}
                </span>
              )}
              <span className="ml-auto text-zinc-400">
                Release: {formatInIST(viewingProblem.release_at)}
              </span>
            </div>

            <div className="p-4 bg-[#0A0D14] border border-zinc-800 rounded-xl">
              <MarkdownPreview content={viewingProblem.description || ''} />
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewingProblem(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingProblem ? 'Edit Problem Statement' : 'Create Problem Statement'}
      >
        <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {formErrors.form && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formErrors.form}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Problem Code <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. AI-01, WEB-04"
                required
              />
              {formErrors.code && <p className="text-xs text-red-400 mt-1">{formErrors.code}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Domain / Track <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g. AI/ML, FinTech, Healthcare"
                required
              />
              {formErrors.domain && (
                <p className="text-xs text-red-400 mt-1">{formErrors.domain}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Autonomous Traffic Flow Optimization using Edge AI"
              required
            />
            {formErrors.title && <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Difficulty <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty: e.target.value as FormState['difficulty'],
                  })
                }
                className="w-full bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Release Date/Time (IST) <span className="text-red-400">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.release_at_ist}
                onChange={(e) => setFormData({ ...formData, release_at_ist: e.target.value })}
                required
              />
              {formErrors.release_at_ist && (
                <p className="text-xs text-red-400 mt-1">{formErrors.release_at_ist}</p>
              )}
            </div>
          </div>

          {/* Description with Markdown Tabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Description (Markdown) <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-1 bg-[#0A0D14] p-0.5 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    activeTab === 'edit'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Edit Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={8}
                placeholder="Write full problem description in Markdown format..."
                className="w-full bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-[#00F0FF]"
                required
              />
            ) : (
              <div className="p-4 bg-[#0A0D14] border border-zinc-800 rounded-lg min-h-[190px] max-h-72 overflow-y-auto">
                <MarkdownPreview content={formData.description} />
              </div>
            )}
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
              {isSaving ? 'Saving...' : editingProblem ? 'Save Changes' : 'Create Problem'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingProblem)}
        onClose={() => !isDeleting && setDeletingProblem(null)}
        title="Confirm Problem Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete problem statement{' '}
            <span className="font-semibold text-white">
              &ldquo;{deletingProblem?.code} - {deletingProblem?.title}&rdquo;
            </span>
            ? This will remove it from all participant views permanently.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={() => setDeletingProblem(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Problem'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
