'use client';

import React, { useEffect, useRef, useState } from 'react';
import type * as LeafletType from 'leaflet';
import { MapPin, Route, MousePointer, Undo2, Trash2 } from 'lucide-react';

export interface StopCoordinate {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  scheduled_time?: string | null;
  notes?: string | null;
}

export interface LatLngPoint {
  latitude: number;
  longitude: number;
}

interface BusMapEditorProps {
  stops: StopCoordinate[];
  pathPoints: LatLngPoint[];
  routeColor: string;
  onAddStopClick?: (coords: { lat: number; lng: number }) => void;
  onPathChange?: (points: LatLngPoint[]) => void;
  onSelectStop?: (stop: StopCoordinate) => void;
}

export default function BusMapEditor({
  stops,
  pathPoints,
  routeColor = '#00F0FF',
  onAddStopClick,
  onPathChange,
  onSelectStop,
}: BusMapEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const markersLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const polylineRef = useRef<LeafletType.Polyline | null>(null);

  const [mapMode, setMapMode] = useState<'view' | 'add_stop' | 'draw_path'>('view');
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [L, setL] = useState<typeof LeafletType | null>(null);

  // Dynamically load leaflet on client mount
  useEffect(() => {
    let mounted = true;
    import('leaflet').then((leaflet) => {
      if (mounted) {
        setL(leaflet.default || leaflet);
        setIsLeafletReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isLeafletReady || !L || !mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on India (e.g., Chennai / Bangalore region where Prayatna typically is)
    const initialLat = stops.length > 0 && stops[0] ? stops[0].latitude : 13.0827;
    const initialLng = stops.length > 0 && stops[0] ? stops[0].longitude : 80.2707;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: true,
    });

    // Dark theme OpenStreetMap tiles via CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeafletReady, L]);

  // Click handler on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: LeafletType.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (mapMode === 'add_stop' && onAddStopClick) {
        onAddStopClick({ lat, lng });
      } else if (mapMode === 'draw_path' && onPathChange) {
        const newPoints = [...pathPoints, { latitude: lat, longitude: lng }];
        onPathChange(newPoints);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mapMode, pathPoints, onAddStopClick, onPathChange]);

  // Update stops markers and polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || !L) return;

    markersGroup.clearLayers();

    // Render Markers for stops
    const bounds: [number, number][] = [];

    stops.forEach((stop) => {
      if (typeof stop.latitude !== 'number' || typeof stop.longitude !== 'number') return;
      bounds.push([stop.latitude, stop.longitude]);

      const iconHtml = `
        <div style="
          background-color: ${routeColor || '#00F0FF'};
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 11px;
          color: #000000;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
        ">
          ${stop.stop_order}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'stop-marker-div',
        html: iconHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; color: #111; padding: 4px;">
          <div style="font-weight: bold; font-size: 13px;">Stop ${stop.stop_order}: ${stop.name}</div>
          ${stop.scheduled_time ? `<div style="font-size: 11px; color: #555;">Time: ${stop.scheduled_time}</div>` : ''}
          ${stop.notes ? `<div style="font-size: 11px; color: #777; margin-top: 4px;">${stop.notes}</div>` : ''}
          <div style="font-size: 10px; color: #888; margin-top: 4px;">Lat: ${stop.latitude.toFixed(5)}, Lng: ${stop.longitude.toFixed(5)}</div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop);
      });

      markersGroup.addLayer(marker);
    });

    // Render Polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Use pathPoints if present, else fallback to connecting stops in stop_order
    let lineCoordinates: [number, number][] = [];
    if (pathPoints.length > 0) {
      lineCoordinates = pathPoints.map((p) => [p.latitude, p.longitude]);
      pathPoints.forEach((p) => bounds.push([p.latitude, p.longitude]));
    } else if (stops.length > 1) {
      const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
      lineCoordinates = sortedStops.map((s) => [s.latitude, s.longitude]);
    }

    if (lineCoordinates.length > 0) {
      const poly = L.polyline(lineCoordinates, {
        color: routeColor || '#00F0FF',
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1,
      }).addTo(map);

      polylineRef.current = poly;
    }

    // Auto fit bounds if coordinates exist and view mode isn't actively drawing
    if (bounds.length > 0 && mapMode === 'view') {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch {
        // Safe catch for zero area bounds
      }
    }
  }, [stops, pathPoints, routeColor, L, onSelectStop, mapMode]);

  const handleUndoPoint = () => {
    if (pathPoints.length > 0 && onPathChange) {
      onPathChange(pathPoints.slice(0, -1));
    }
  };

  const handleClearPath = () => {
    if (onPathChange) {
      onPathChange([]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A0D14] p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMapMode('view')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mapMode === 'view'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            Pan & Inspect
          </button>

          <button
            type="button"
            onClick={() => setMapMode('add_stop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mapMode === 'add_stop'
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#00F0FF]" />
            Click Map to Add Stop
          </button>

          <button
            type="button"
            onClick={() => setMapMode('draw_path')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mapMode === 'draw_path'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Route className="w-3.5 h-3.5 text-purple-400" />
            Draw Path ({pathPoints.length} pts)
          </button>
        </div>

        {mapMode === 'draw_path' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndoPoint}
              disabled={pathPoints.length === 0}
              className="px-2.5 py-1 text-xs rounded bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 flex items-center gap-1"
            >
              <Undo2 className="w-3 h-3" /> Undo Point
            </button>
            <button
              type="button"
              onClick={handleClearPath}
              disabled={pathPoints.length === 0}
              className="px-2.5 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear Path
            </button>
          </div>
        )}
      </div>

      {/* Helper text for current mode */}
      <div className="text-xs text-zinc-400 px-1">
        {mapMode === 'add_stop' && (
          <span className="text-[#00F0FF]">
            Target Mode Active: Click anywhere on the map to place a new stop at that exact
            coordinate.
          </span>
        )}
        {mapMode === 'draw_path' && (
          <span className="text-purple-400">
            Path Drawing Active: Click points along the road or transit corridor to construct the
            route polyline.
          </span>
        )}
        {mapMode === 'view' && (
          <span>Hover or click on numbered stop markers to see arrival times and details.</span>
        )}
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-96 sm:h-[450px] rounded-xl border border-zinc-800 overflow-hidden relative z-0 ${
          mapMode === 'add_stop'
            ? 'cursor-crosshair'
            : mapMode === 'draw_path'
              ? 'cursor-cell'
              : 'cursor-grab'
        }`}
      />
    </div>
  );
}
