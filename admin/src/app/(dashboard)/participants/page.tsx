'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Users,
  Upload,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { participantCsvRowSchema, ParticipantCsvRow } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatInIST } from '@/lib/date';

interface ParticipantProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  college: string | null;
  city: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  team: {
    id: string;
    name: string;
    team_code: string;
  } | null;
}

interface ParsedValidationResult {
  valid: ParticipantCsvRow[];
  errors: { row: number; error: string; raw: Record<string, unknown> }[];
}

export default function ParticipantsPage() {
  const supabase = createClient();

  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'participant' | 'organizer'>('all');

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          email,
          college,
          city,
          phone,
          role,
          created_at,
          team:teams (
            id,
            name,
            team_code
          )
        `
        )
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setParticipants((data as unknown as ParticipantProfile[]) || []);
    } catch (err: unknown) {
      console.error('Error fetching participants:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve participants.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Client-side search & filtering
  const filteredParticipants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return participants.filter((p) => {
      const matchesRole = roleFilter === 'all' || p.role === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;

      const nameMatch = p.full_name?.toLowerCase().includes(q);
      const emailMatch = p.email?.toLowerCase().includes(q);
      const collegeMatch = p.college?.toLowerCase().includes(q);
      const cityMatch = p.city?.toLowerCase().includes(q);
      const teamMatch = p.team?.name?.toLowerCase().includes(q);
      return nameMatch || emailMatch || collegeMatch || cityMatch || teamMatch;
    });
  }, [participants, searchQuery, roleFilter]);

  // Handle CSV file selection and Zod validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImportSummary(null);

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows: ParticipantCsvRow[] = [];
        const validationErrors: ParsedValidationResult['errors'] = [];

        results.data.forEach((rawRow, index) => {
          const parsed = participantCsvRowSchema.safeParse(rawRow);
          if (parsed.success) {
            validRows.push(parsed.data);
          } else {
            const firstError = parsed.error.issues[0]?.message || 'Invalid row fields';
            validationErrors.push({
              row: index + 2, // 1-indexed, accounting for header
              error: firstError,
              raw: rawRow,
            });
          }
        });

        setParsedResult({ valid: validRows, errors: validationErrors });
      },
      error: (parseError) => {
        setError(`CSV Parse Error: ${parseError.message}`);
      },
    });
  };

  // Perform bulk import
  const handleExecuteImport = async () => {
    if (!parsedResult || parsedResult.valid.length === 0) return;
    setIsImporting(true);
    setImportSummary(null);

    try {
      const rows = parsedResult.valid;
      let importedCount = 0;

      // Group teams to upsert them first
      const teamsToUpsert = Array.from(new Set(rows.map((r) => r.team_name).filter(Boolean)));

      const teamMap = new Map<string, string>(); // team_name -> team_id

      for (const teamName of teamsToUpsert) {
        if (!teamName) continue;
        const code = teamName.replace(/\s+/g, '-').toUpperCase().slice(0, 10);
        const { data: upsertedTeam } = await supabase
          .from('teams')
          .upsert({ name: teamName, team_code: code }, { onConflict: 'name' })
          .select('id, name')
          .single();

        if (upsertedTeam) {
          teamMap.set(upsertedTeam.name, upsertedTeam.id);
        }
      }

      // Upsert profiles
      for (const row of rows) {
        const teamId = row.team_name ? teamMap.get(row.team_name) || null : null;

        const { error: profileErr } = await supabase.from('profiles').upsert(
          {
            email: row.email,
            full_name: row.full_name,
            college: row.college || null,
            city: row.city || null,
            phone: row.phone || null,
            team_id: teamId,
            role: 'participant',
          },
          { onConflict: 'email' }
        );

        if (!profileErr) {
          importedCount++;
        }
      }

      await logAuditEvent({
        supabase,
        action: 'IMPORT_PARTICIPANTS',
        resourceType: 'profiles',
        metadata: {
          totalRows: rows.length,
          importedCount,
          fileName: csvFile?.name,
        },
      });

      setImportSummary(
        `Successfully imported/updated ${importedCount} of ${rows.length} participants.`
      );
      await fetchParticipants();
    } catch (err: unknown) {
      console.error('Error executing import:', err);
      setImportSummary(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Roster & Registration
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Participant Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse participants, search squads, and bulk-import rosters from CSV.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              setCsvFile(null);
              setParsedResult(null);
              setImportSummary(null);
              setIsImportModalOpen(true);
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, college, city, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surfaceElevated pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 rounded-lg border border-border focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-surfaceElevated border border-border text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
          >
            <option value="all">All Roles</option>
            <option value="participant">Participants Only</option>
            <option value="organizer">Organizers Only</option>
          </select>
        </div>
      </div>

      {/* Main Table / State Container */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchParticipants} />
      ) : filteredParticipants.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-dashed border-border rounded-xl space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Participants Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No records match "${searchQuery}". Clear your search query or role filter.`
              : 'No participants registered yet. Click "Import CSV" to upload participant rosters.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surfaceElevated border-b border-border text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Participant</th>
                  <th className="px-6 py-3.5">Assigned Squad</th>
                  <th className="px-6 py-3.5">College & City</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-surfaceElevated/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{p.full_name || 'Anonymous'}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {p.email || '—'}
                      </div>
                      {p.phone && (
                        <div className="text-[11px] text-slate-500 mt-0.5">📞 {p.phone}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {p.team ? (
                        <div>
                          <span className="font-semibold text-slate-200 block">{p.team.name}</span>
                          <span className="text-[10px] text-accent font-mono">
                            #{p.team.team_code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No Squad Assigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      <div>{p.college || '—'}</div>
                      {p.city && <div className="text-xs text-slate-500">{p.city}</div>}
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={p.role === 'organizer' ? 'accent' : 'default'} size="sm">
                        {p.role}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatInIST(p.created_at, 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-border bg-surfaceElevated/20 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Showing {filteredParticipants.length} of {participants.length} total participants
            </span>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Participants from CSV"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a valid CSV file containing participant records. Format headers:{' '}
              <code className="text-accent bg-accent/10 px-1 py-0.5 rounded">
                full_name, email, college, city, phone, team_name
              </code>
              .
            </p>
          </div>

          {/* File Picker */}
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent/40 transition-colors bg-surfaceElevated/30">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-upload"
            />
            <label htmlFor="csv-file-upload" className="cursor-pointer flex flex-col items-center">
              <FileSpreadsheet className="w-10 h-10 text-accent mb-2" />
              <span className="text-sm font-semibold text-slate-200">
                {csvFile ? csvFile.name : 'Click to select participants.csv'}
              </span>
              <span className="text-xs text-slate-500 mt-1">CSV files up to 5MB supported</span>
            </label>
          </div>

          {/* Validation Feedback */}
          {parsedResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {parsedResult.valid.length} Valid Rows
                </span>
                {parsedResult.errors.length > 0 && (
                  <span className="flex items-center gap-1.5 text-error font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    {parsedResult.errors.length} Invalid Rows Rejected
                  </span>
                )}
              </div>

              {parsedResult.errors.length > 0 && (
                <div className="max-h-36 overflow-y-auto p-3 rounded-lg bg-error/10 border border-error/20 text-xs text-error space-y-1">
                  {parsedResult.errors.slice(0, 5).map((err, i) => (
                    <div key={i}>
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                  {parsedResult.errors.length > 5 && (
                    <div className="text-[11px] text-slate-400 pt-1">
                      ...and {parsedResult.errors.length - 5} more invalid rows
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Import Summary */}
          {importSummary && (
            <div className="p-3 rounded-lg bg-surfaceElevated border border-accent/30 text-xs text-accent">
              {importSummary}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteImport}
              loading={isImporting}
              disabled={!parsedResult || parsedResult.valid.length === 0}
            >
              Confirm Import ({parsedResult?.valid.length || 0} Records)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
