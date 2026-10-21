'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Bus,
  Plus,
  MapPin,
  Route,
  Edit2,
  Trash2,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { busRouteSchema, busStopSchema, BusRouteInput, BusStopInput } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { StopCoordinate, LatLngPoint } from '@/components/bus/BusMapEditor';
import { Database } from '@/types/database';

// Dynamically import BusMapEditor with SSR disabled to safeguard Leaflet
const BusMapEditor = dynamic(() => import('@/components/bus/BusMapEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-[#0A0D14] border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
      Loading interactive route map...
    </div>
  ),
});

type BusRoute = Database['public']['Tables']['bus_routes']['Row'];
type BusStop = Database['public']['Tables']['bus_stops']['Row'];
type BusRoutePath = Database['public']['Tables']['bus_route_paths']['Row'];

const PRESET_COLORS = [
  '#00F0FF', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export default function BusRoutesAdminPage() {
  const supabase = createClient();

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [pathPoints, setPathPoints] = useState<LatLngPoint[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Route Form Modal State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  const [routeFormData, setRouteFormData] = useState<BusRouteInput>({
    name: '',
    description: '',
    origin_city: '',
    departs_at: '',
    color: '#00F0FF',
    sort_order: 0,
  });
  const [routeFormErrors, setRouteFormErrors] = useState<Record<string, string>>({});
  const [isSavingRoute, setIsSavingRoute] = useState(false);

  // Stop Form Modal State
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [stopFormData, setStopFormData] = useState<BusStopInput>({
    route_id: '',
    name: '',
    latitude: 13.0827,
    longitude: 80.2707,
    stop_order: 1,
    scheduled_time: '',
    notes: '',
  });
  const [stopFormErrors, setStopFormErrors] = useState<Record<string, string>>({});
  const [isSavingStop, setIsSavingStop] = useState(false);

  // Delete State
  const [deletingRoute, setDeletingRoute] = useState<BusRoute | null>(null);
  const [deletingStop, setDeletingStop] = useState<BusStop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Path saving state
  const [isSavingPath, setIsSavingPath] = useState(false);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('bus_routes')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchErr) throw fetchErr;
      const loadedRoutes = data || [];
      setRoutes(loadedRoutes);

      // Select first route if none selected
      if (loadedRoutes.length > 0 && !selectedRouteId) {
        setSelectedRouteId(loadedRoutes[0].id);
      }
    } catch (err: unknown) {
      console.error('Error fetching bus routes:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve bus routes.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedRouteId]);

  // Fetch stops and path for the selected route
  const fetchRouteDetails = useCallback(
    async (routeId: string) => {
      try {
        const [stopsRes, pathRes] = await Promise.all([
          supabase
            .from('bus_stops')
            .select('*')
            .eq('route_id', routeId)
            .order('stop_order', { ascending: true }),
          supabase.from('bus_route_paths').select('*').eq('route_id', routeId).maybeSingle(),
        ]);

        if (stopsRes.error) throw stopsRes.error;
        setStops(stopsRes.data || []);

        if (pathRes.data && Array.isArray(pathRes.data.points)) {
          setPathPoints(pathRes.data.points as unknown as LatLngPoint[]);
        } else {
          setPathPoints([]);
        }
      } catch (err: unknown) {
        console.error('Error fetching route stops/path:', err);
      }
    },
    [supabase]
  );

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    if (selectedRouteId) {
      fetchRouteDetails(selectedRouteId);
    }
  }, [selectedRouteId, fetchRouteDetails]);

  const activeRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) || null,
    [routes, selectedRouteId]
  );

  // Map click handler to open Add Stop modal with clicked coords
  const handleMapClickToAddStop = ({ lat, lng }: { lat: number; lng: number }) => {
    if (!selectedRouteId) return;
    setEditingStop(null);
    const nextOrder = stops.length > 0 ? Math.max(...stops.map((s) => s.stop_order)) + 1 : 1;
    setStopFormData({
      route_id: selectedRouteId,
      name: '',
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
      stop_order: nextOrder,
      scheduled_time: '',
      notes: '',
    });
    setStopFormErrors({});
    setIsStopModalOpen(true);
  };

  const openCreateRouteModal = () => {
    setEditingRoute(null);
    setRouteFormData({
      name: '',
      description: '',
      origin_city: '',
      departs_at: '07:00 AM',
      color: '#00F0FF',
      sort_order: routes.length,
    });
    setRouteFormErrors({});
    setIsRouteModalOpen(true);
  };

  const openEditRouteModal = (route: BusRoute) => {
    setEditingRoute(route);
    setRouteFormData({
      name: route.name,
      description: route.description || '',
      origin_city: route.origin_city || '',
      departs_at: route.departs_at || '',
      color: route.color || '#00F0FF',
      sort_order: route.sort_order,
    });
    setRouteFormErrors({});
    setIsRouteModalOpen(true);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteFormErrors({});

    const parseResult = busRouteSchema.safeParse(routeFormData);
    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        errMap[err.path[0] as string] = err.message;
      });
      setRouteFormErrors(errMap);
      return;
    }

    setIsSavingRoute(true);
    try {
      const payload = parseResult.data;

      if (editingRoute) {
        const { error: updateErr } = await supabase
          .from('bus_routes')
          .update(payload)
          .eq('id', editingRoute.id);

        if (updateErr) throw updateErr;

        await logAuditEvent({
          action: 'UPDATE_ROUTE',
          resourceType: 'bus_routes',
          resourceId: editingRoute.id,
          metadata: { name: payload.name },
        });
      } else {
        const { data: created, error: insertErr } = await supabase
          .from('bus_routes')
          .insert(payload)
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        await logAuditEvent({
          action: 'CREATE_ROUTE',
          resourceType: 'bus_routes',
          resourceId: created?.id,
          metadata: { name: payload.name },
        });

        if (created?.id) setSelectedRouteId(created.id);
      }

      setIsRouteModalOpen(false);
      await fetchRoutes();
    } catch (err: unknown) {
      console.error('Error saving bus route:', err);
      setRouteFormErrors({
        form: err instanceof Error ? err.message : 'Failed to save route.',
      });
    } finally {
      setIsSavingRoute(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!deletingRoute) return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase
        .from('bus_routes')
        .delete()
        .eq('id', deletingRoute.id);

      if (delErr) throw delErr;

      await logAuditEvent({
        action: 'DELETE_ROUTE',
        resourceType: 'bus_routes',
        resourceId: deletingRoute.id,
        metadata: { name: deletingRoute.name },
      });

      setDeletingRoute(null);
      if (selectedRouteId === deletingRoute.id) {
        setSelectedRouteId(null);
      }
      await fetchRoutes();
    } catch (err: unknown) {
      console.error('Error deleting route:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete route.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateStopModal = () => {
    if (!selectedRouteId) return;
    setEditingStop(null);
    const nextOrder = stops.length > 0 ? Math.max(...stops.map((s) => s.stop_order)) + 1 : 1;
    const lastStop = stops.length > 0 ? stops[stops.length - 1] : undefined;
    setStopFormData({
      route_id: selectedRouteId,
      name: '',
      latitude: lastStop ? lastStop.latitude : 13.0827,
      longitude: lastStop ? lastStop.longitude : 80.2707,
      stop_order: nextOrder,
      scheduled_time: '',
      notes: '',
    });
    setStopFormErrors({});
    setIsStopModalOpen(true);
  };

  const openEditStopModal = (stop: BusStop) => {
    setEditingStop(stop);
    setStopFormData({
      route_id: stop.route_id,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      stop_order: stop.stop_order,
      scheduled_time: stop.scheduled_time || '',
      notes: stop.notes || '',
    });
    setStopFormErrors({});
    setIsStopModalOpen(true);
  };

  const handleSaveStop = async (e: React.FormEvent) => {
    e.preventDefault();
    setStopFormErrors({});

    const parseResult = busStopSchema.safeParse(stopFormData);
    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        errMap[err.path[0] as string] = err.message;
      });
      setStopFormErrors(errMap);
      return;
    }

    setIsSavingStop(true);
    try {
      const payload = parseResult.data;

      if (editingStop) {
        const { error: updateErr } = await supabase
          .from('bus_stops')
          .update(payload)
          .eq('id', editingStop.id);

        if (updateErr) throw updateErr;

        await logAuditEvent({
          action: 'UPDATE_BUS_STOP',
          resourceType: 'bus_stops',
          resourceId: editingStop.id,
          metadata: { name: payload.name, stop_order: payload.stop_order },
        });
      } else {
        const { data: created, error: insertErr } = await supabase
          .from('bus_stops')
          .insert(payload)
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        await logAuditEvent({
          action: 'CREATE_BUS_STOP',
          resourceType: 'bus_stops',
          resourceId: created?.id,
          metadata: { name: payload.name, stop_order: payload.stop_order },
        });
      }

      setIsStopModalOpen(false);
      if (selectedRouteId) await fetchRouteDetails(selectedRouteId);
    } catch (err: unknown) {
      console.error('Error saving stop:', err);
      setStopFormErrors({
        form: err instanceof Error ? err.message : 'Failed to save stop.',
      });
    } finally {
      setIsSavingStop(false);
    }
  };

  const handleDeleteStop = async () => {
    if (!deletingStop) return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase.from('bus_stops').delete().eq('id', deletingStop.id);

      if (delErr) throw delErr;

      await logAuditEvent({
        action: 'DELETE_BUS_STOP',
        resourceType: 'bus_stops',
        resourceId: deletingStop.id,
        metadata: { name: deletingStop.name },
      });

      setDeletingStop(null);
      if (selectedRouteId) await fetchRouteDetails(selectedRouteId);
    } catch (err: unknown) {
      console.error('Error deleting stop:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete stop.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePath = async () => {
    if (!selectedRouteId) return;
    setIsSavingPath(true);
    setStatusMessage(null);
    try {
      // Upsert to bus_route_paths
      const { error: pathErr } = await supabase.from('bus_route_paths').upsert(
        {
          route_id: selectedRouteId,
          points:
            pathPoints as unknown as Database['public']['Tables']['bus_route_paths']['Insert']['points'],
        },
        { onConflict: 'route_id' }
      );

      if (pathErr) throw pathErr;

      await logAuditEvent({
        action: 'SAVE_BUS_PATH',
        resourceType: 'bus_route_paths',
        metadata: {
          route_id: selectedRouteId,
          points_count: pathPoints.length,
        },
      });

      setStatusMessage(`Saved ${pathPoints.length} route path waypoints!`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: unknown) {
      console.error('Error saving route path:', err);
      alert(err instanceof Error ? err.message : 'Failed to save route path.');
    } finally {
      setIsSavingPath(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-[#00F0FF]" />
            Bus Routes & Transit Editor
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage transit routes, interactive stop locations, and drawn path polyline waypoints.
          </p>
        </div>
        <Button
          onClick={openCreateRouteModal}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Route
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchRoutes} />}

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Routes Selector Bar */}
      <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Select Route
          </span>
          <span className="text-xs text-zinc-500">{routes.length} configured routes</span>
        </div>

        {routes.length === 0 ? (
          <p className="text-sm text-zinc-500 italic py-2">
            No transit routes created yet. Click &ldquo;Create New Route&rdquo; to get started.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {routes.map((route) => {
              const isSelected = route.id === selectedRouteId;
              const color = route.color || '#00F0FF';
              return (
                <div
                  key={route.id}
                  className={`flex items-center gap-2 rounded-lg pl-3 pr-2 py-1.5 transition-all text-xs font-medium border ${
                    isSelected
                      ? 'bg-zinc-800/90 text-white border-zinc-600 shadow-md'
                      : 'bg-[#0A0D14] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    className="flex items-center gap-2"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-semibold text-white">{route.name}</span>
                    {route.origin_city && (
                      <span className="text-[11px] text-zinc-400">({route.origin_city})</span>
                    )}
                  </button>

                  <div className="flex items-center border-l border-zinc-700 pl-1.5 ml-1">
                    <button
                      type="button"
                      onClick={() => openEditRouteModal(route)}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="Edit Route Details"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRoute(route)}
                      className="p-1 text-zinc-400 hover:text-red-400"
                      title="Delete Route"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeRoute && (
        <div className="space-y-6">
          {/* Active Route Summary Bar */}
          <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: activeRoute.color || '#00F0FF' }}
              />
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {activeRoute.name}
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 font-normal text-zinc-300">
                    {stops.length} stops
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                  {activeRoute.origin_city && <span>Origin: {activeRoute.origin_city}</span>}
                  {activeRoute.departs_at && <span>Departs: {activeRoute.departs_at}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={openCreateStopModal}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Stop Manually
              </Button>

              <Button
                size="sm"
                onClick={handleSavePath}
                disabled={isSavingPath}
                className="flex items-center gap-1.5 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingPath ? 'Saving...' : `Save Drawn Path (${pathPoints.length} pts)`}
              </Button>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-4">
            <BusMapEditor
              stops={stops}
              pathPoints={pathPoints}
              routeColor={activeRoute.color || '#00F0FF'}
              onAddStopClick={handleMapClickToAddStop}
              onPathChange={setPathPoints}
              onSelectStop={(stop) => {
                const found = stops.find((s) => s.id === stop.id);
                if (found) openEditStopModal(found);
              }}
            />
          </div>

          {/* Stops Table */}
          <div className="bg-[#12161F] border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00F0FF]" />
                Route Stops & Schedule
              </h3>
              <span className="text-xs text-zinc-400">
                Stops ordered chronologically by Stop Order
              </span>
            </div>

            {stops.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <MapPin className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm">No stops added yet.</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Click anywhere on the map above in &ldquo;Add Stop&rdquo; mode to place stops!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-[#0A0D14] text-xs uppercase font-medium text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 w-16 text-center">#</th>
                      <th className="py-3 px-4">Stop Name</th>
                      <th className="py-3 px-4">Scheduled Time</th>
                      <th className="py-3 px-4">Coordinates</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {stops.map((stop) => (
                      <tr key={stop.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#00F0FF]">
                          {stop.stop_order}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">{stop.name}</td>
                        <td className="py-3 px-4 text-xs text-zinc-300">
                          {stop.scheduled_time || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                          {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-400 max-w-xs truncate">
                          {stop.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditStopModal(stop)}
                              className="text-zinc-400 hover:text-white"
                              title="Edit Stop"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingStop(stop)}
                              className="text-zinc-400 hover:text-red-400"
                              title="Delete Stop"
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
            )}
          </div>
        </div>
      )}

      {/* Route Modal (Create / Edit) */}
      <Modal
        isOpen={isRouteModalOpen}
        onClose={() => !isSavingRoute && setIsRouteModalOpen(false)}
        title={editingRoute ? 'Edit Bus Route' : 'Create Bus Route'}
      >
        <form onSubmit={handleSaveRoute} className="space-y-4">
          {routeFormErrors.form && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{routeFormErrors.form}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Route Name <span className="text-red-400">*</span>
            </label>
            <Input
              value={routeFormData.name}
              onChange={(e) => setRouteFormData({ ...routeFormData, name: e.target.value })}
              placeholder="e.g. Route 1 - City Express"
              required
            />
            {routeFormErrors.name && (
              <p className="text-xs text-red-400 mt-1">{routeFormErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Origin City</label>
              <Input
                value={routeFormData.origin_city || ''}
                onChange={(e) =>
                  setRouteFormData({ ...routeFormData, origin_city: e.target.value })
                }
                placeholder="e.g. Chennai Central"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Departure Time</label>
              <Input
                value={routeFormData.departs_at || ''}
                onChange={(e) => setRouteFormData({ ...routeFormData, departs_at: e.target.value })}
                placeholder="e.g. 07:30 AM"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Route Accent Color
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setRouteFormData({ ...routeFormData, color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    routeFormData.color === c ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={routeFormData.color || '#00F0FF'}
                onChange={(e) => setRouteFormData({ ...routeFormData, color: e.target.value })}
                className="w-8 h-8 rounded bg-transparent cursor-pointer ml-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Description / Notes
            </label>
            <textarea
              value={routeFormData.description || ''}
              onChange={(e) => setRouteFormData({ ...routeFormData, description: e.target.value })}
              rows={3}
              placeholder="Provide bus coordinator contact numbers, landmark pick-up points..."
              className="w-full bg-[#0A0D14] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRouteModalOpen(false)}
              disabled={isSavingRoute}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingRoute}>
              {isSavingRoute ? 'Saving...' : editingRoute ? 'Save Changes' : 'Create Route'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stop Modal (Create / Edit) */}
      <Modal
        isOpen={isStopModalOpen}
        onClose={() => !isSavingStop && setIsStopModalOpen(false)}
        title={editingStop ? 'Edit Transit Stop' : 'Add Transit Stop'}
      >
        <form onSubmit={handleSaveStop} className="space-y-4">
          {stopFormErrors.form && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{stopFormErrors.form}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Stop Name <span className="text-red-400">*</span>
            </label>
            <Input
              value={stopFormData.name}
              onChange={(e) => setStopFormData({ ...stopFormData, name: e.target.value })}
              placeholder="e.g. Guindy Metro Station"
              required
            />
            {stopFormErrors.name && (
              <p className="text-xs text-red-400 mt-1">{stopFormErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Stop Order # <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={stopFormData.stop_order}
                onChange={(e) =>
                  setStopFormData({
                    ...stopFormData,
                    stop_order: parseInt(e.target.value, 10) || 1,
                  })
                }
                required
              />
              {stopFormErrors.stop_order && (
                <p className="text-xs text-red-400 mt-1">{stopFormErrors.stop_order}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Scheduled Time</label>
              <Input
                value={stopFormData.scheduled_time || ''}
                onChange={(e) =>
                  setStopFormData({ ...stopFormData, scheduled_time: e.target.value })
                }
                placeholder="e.g. 07:45 AM"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Latitude <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                step="any"
                value={stopFormData.latitude}
                onChange={(e) =>
                  setStopFormData({
                    ...stopFormData,
                    latitude: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Longitude <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                step="any"
                value={stopFormData.longitude}
                onChange={(e) =>
                  setStopFormData({
                    ...stopFormData,
                    longitude: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Stop Notes / Landmark
            </label>
            <Input
              value={stopFormData.notes || ''}
              onChange={(e) => setStopFormData({ ...stopFormData, notes: e.target.value })}
              placeholder="e.g. Near Exit Gate 2"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStopModalOpen(false)}
              disabled={isSavingStop}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingStop}>
              {isSavingStop ? 'Saving...' : editingStop ? 'Save Changes' : 'Add Stop'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Route Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingRoute)}
        onClose={() => !isDeleting && setDeletingRoute(null)}
        title="Delete Bus Route"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete bus route{' '}
            <span className="font-semibold text-white">&ldquo;{deletingRoute?.name}&rdquo;</span>?
            All associated stops and paths will be deleted permanently.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" onClick={() => setDeletingRoute(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteRoute} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Route'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Stop Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingStop)}
        onClose={() => !isDeleting && setDeletingStop(null)}
        title="Delete Stop"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete transit stop{' '}
            <span className="font-semibold text-white">&ldquo;{deletingStop?.name}&rdquo;</span>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" onClick={() => setDeletingStop(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteStop} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Stop'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
