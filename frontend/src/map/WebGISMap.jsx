/**
 * WebGISMap.jsx — Core Leaflet map component (Mission 10)
 *
 * Responsibilities:
 * - Initialize Leaflet with config from mapConfig.js (tile URLs never hard-coded here)
 * - Render four toggleable layers: Unified Parcels, Cadastral, Municipal, Drone Buildings
 * - Visualize problem parcels distinctly (color + dash + pulsing icon label) not by color alone
 * - Fire onSelectFeature with the clicked unified feature or harmonization pair
 * - Zoom/pan/fitBounds/focusOnSelection all work
 *
 * Coordinate contract (per rules.md):
 *   GeoJSON is [lng, lat] — Leaflet is [lat, lng]
 *   L.geoJSON() handles this conversion automatically ONLY for geometry.
 *   Any manual L.latLng() / L.marker() calls that consume GeoJSON coords must reorder explicitly.
 */
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MAP_CENTER,
  DEFAULT_ZOOM,
  TILE_PROVIDERS,
  DEFAULT_BASEMAP,
  LAYER_STYLES,
} from './mapConfig';

/**
 * Keep the map data contract real-data-only. An empty collection is rendered
 * when processing has not produced a map response yet.
 */
function buildUnifiedFeatures(realMapData) {
  return realMapData?.features ? realMapData : { type: 'FeatureCollection', features: [] };
}

function buildSourceFeatures(realMapData, source) {
  if (realMapData?.[source]?.features) return realMapData[source];

  const features = (realMapData?.features || []).map((feature) => {
    const properties = feature.properties || {};
    const geometry = source === 'municipal' ? properties.source_geometry_b : feature.geometry;
    if (!geometry) return null;
    return {
      type: 'Feature',
      id: `${source}-${properties.parcel_id || feature.id}`,
      properties: {
        parcel_id: properties.parcel_id,
        owner_name: source === 'municipal' ? properties.owner_name_b : properties.owner_name,
        recorded_area: source === 'municipal' ? properties.area_b : properties.area,
      },
      geometry,
    };
  }).filter(Boolean);
  return { type: 'FeatureCollection', features };
}

export default function WebGISMap({
  activeLayers = { unified: true, cadastral: true, municipal: true, drone: true, conflictsOnly: false },
  selectedFeature,
  onSelectFeature,
  onCoordsChange,
  realMapData = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoLayersRef = useRef({});
  const onCoordsChangeRef = useRef(onCoordsChange);
  const [basemap, setBasemap] = useState(DEFAULT_BASEMAP);

  // Keep ref current so the init effect doesn't re-run when onCoordsChange identity changes
  useEffect(() => { onCoordsChangeRef.current = onCoordsChange; }, [onCoordsChange]);

  // ── Initialize Leaflet ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MAP_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });
    const sourcePane = map.createPane('sourceOverlayPane');
    sourcePane.style.zIndex = 350;

    const provider = TILE_PROVIDERS[DEFAULT_BASEMAP];
    const tile = L.tileLayer(provider.url, provider.options).addTo(map);
    geoLayersRef.current.tileLayer = tile;

    L.control.zoom({ position: 'topright' }).addTo(map);

    map.on('mousemove', (e) => {
      if (onCoordsChangeRef.current) {
        onCoordsChangeRef.current({ lat: e.latlng.lat.toFixed(5), lng: e.latlng.lng.toFixed(5), zoom: map.getZoom() });
      }
    });

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // ── Basemap switcher ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoLayersRef.current.tileLayer) return;
    map.removeLayer(geoLayersRef.current.tileLayer);
    const provider = TILE_PROVIDERS[basemap] || TILE_PROVIDERS[DEFAULT_BASEMAP];
    geoLayersRef.current.tileLayer = L.tileLayer(provider.url, provider.options).addTo(map);
  }, [basemap]);

  // ── Render / sync vector layers ──────────────────────────────────────────────
  // Rebuilds layers when data or visibility toggles change.
  // selectedFeature is intentionally NOT in the dependency array — selection
  // highlight is handled separately below to avoid a full layer rebuild on click.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old vector layers (including the conflict-label layerGroup)
    ['unified', 'cadastral', 'municipal', 'drone', 'conflictLabels'].forEach((k) => {
      if (geoLayersRef.current[k]) {
        map.removeLayer(geoLayersRef.current[k]);
        geoLayersRef.current[k] = null;
      }
    });

    const unified = buildUnifiedFeatures(realMapData);
    const cadastralData = buildSourceFeatures(realMapData, 'cadastral');
    const municipalData = buildSourceFeatures(realMapData, 'municipal');
    let fittedBounds = false;

    // ── 1. Unified Parcels ─────────────────────────────────────────────────────
    if (activeLayers.unified) {
      // Create the conflict-labels layerGroup first (added to map once)
      const conflictLabelsGroup = L.layerGroup().addTo(map);
      geoLayersRef.current.conflictLabels = conflictLabelsGroup;

      const unifiedLayer = L.geoJSON(unified, {
        filter: (f) => {
          if (activeLayers.conflictsOnly) {
            return (f.properties?.conflicts?.length ?? 0) > 0;
          }
          return true;
        },
        style: (f) => {
          const s = f.properties?.status;
          if (s === 'AUTO_VERIFIED' || s === 'HUMAN_VERIFIED') return LAYER_STYLES.unified.verified;
          if (s === 'REQUIRES_REVIEW' || s === 'REQUIRES_REVIEW') {
            const hasConflicts = (f.properties?.conflicts?.length ?? 0) > 0;
            return hasConflicts ? LAYER_STYLES.unified.conflict : LAYER_STYLES.unified.review;
          }
          return LAYER_STYLES.unified.review;
        },
        onEachFeature: (f, lyr) => {
          const p = f.properties || {};
          const hasConflicts = (p.conflicts?.length ?? 0) > 0;
          const conflictCount = p.conflicts?.length ?? 0;

          // Tooltip: parcel id + owner + confidence
          lyr.bindTooltip(
            `<b class="font-mono">${p.parcel_id}</b><br/>${p.owner_name || '—'}<br/>` +
            `Confidence: <b>${p.confidence ?? '?'}%</b>` +
            (hasConflicts ? `<br/><span style="color:#ef4444">⚠ ${conflictCount} conflict(s)</span>` : ''),
            { className: 'leaflet-tooltip-gis', sticky: true }
          );

          lyr.on('click', () => {
            if (onSelectFeature) onSelectFeature(f);
          });

          // Problem parcels: pulsing ⚠ CONFLICT label (distinct beyond color)
          // Markers go into the layerGroup ONLY — cleanup via group.clearLayers()
          if (hasConflicts) {
            try {
              const center = lyr.getBounds().getCenter();
              // getBounds().getCenter() returns Leaflet [lat,lng] — correct for L.marker
              const icon = L.divIcon({
                className: '',
                html: '<span style="background:#ef4444;color:#fff;padding:1px 5px;border-radius:3px;' +
                      'font-size:10px;font-weight:700;font-family:monospace;' +
                      'box-shadow:0 0 6px #ef4444aa;white-space:nowrap;">⚠ CONFLICT</span>',
                iconAnchor: [38, 8],
              });
              // Add ONLY to the layerGroup, not directly to the map
              conflictLabelsGroup.addLayer(
                L.marker(center, { icon, interactive: false, keyboard: false })
              );
            } catch { /* ignore parcels without renderable bounds */ }
          }
        },
      }).addTo(map);
      geoLayersRef.current.unified = unifiedLayer;

      // Fit bounds on first render of this data
      try {
        const bounds = unifiedLayer.getBounds();
        if (bounds.isValid() && !fittedBounds) {
          map.fitBounds(bounds, { padding: [40, 40] });
          fittedBounds = true;
        }
      } catch { /* ignore */ }
    }

    // ── 2. Cadastral (blue source boundaries) ─────────────────────────────────
    if (activeLayers.cadastral && !activeLayers.conflictsOnly && cadastralData.features.length) {
      const s = LAYER_STYLES.cadastral;
      const cadLayer = L.geoJSON(cadastralData, {
        pane: 'sourceOverlayPane',
        style: () => s,
        onEachFeature: (f, lyr) => {
          lyr.bindTooltip(
            `<b>Cadastral: ${f.properties?.parcel_id || f.id}</b><br/>Owner: ${f.properties?.owner_name || '—'}<br/>Area: ${f.properties?.recorded_area || f.properties?.area || '—'} m²`,
            { sticky: true, className: 'leaflet-tooltip-gis' }
          );
          // Clicking cadastral selects the matching unified feature
          const unified2 = buildUnifiedFeatures(realMapData);
          lyr.on('click', () => {
            const match = unified2.features.find(
              uf => uf.properties?.parcel_id === f.properties?.parcel_id ||
                    uf.properties?.source_record_a === f.id
            );
            if (match && onSelectFeature) onSelectFeature(match);
          });
        },
      }).addTo(map);
      geoLayersRef.current.cadastral = cadLayer;
    }

    // ── 3. Municipal (amber dashed source boundaries) ─────────────────────────
    if (activeLayers.municipal && !activeLayers.conflictsOnly && municipalData.features.length) {
      const s = LAYER_STYLES.municipal;
      const munLayer = L.geoJSON(municipalData, {
        pane: 'sourceOverlayPane',
        style: () => s,
        onEachFeature: (f, lyr) => {
          lyr.bindTooltip(
            `<b>Municipal: ${f.properties?.parcel_id || f.properties?.property_id || f.id}</b><br/>Holder: ${f.properties?.owner_name || f.properties?.holder_name || '—'}<br/>Area: ${f.properties?.recorded_area ?? f.properties?.plot_area ?? f.properties?.area ?? '—'} m²`,
            { sticky: true, className: 'leaflet-tooltip-gis' }
          );
        },
      }).addTo(map);
      geoLayersRef.current.municipal = munLayer;
    }

    // ── 4. Drone Building Footprints (cyan filled) ────────────────────────────
    if (activeLayers.drone && !activeLayers.conflictsOnly && realMapData?.drone?.features?.length) {
      const s = LAYER_STYLES.drone;
      const droneLayer = L.geoJSON(realMapData.drone, {
        pane: 'sourceOverlayPane',
        style: () => s,
        onEachFeature: (f, lyr) => {
          lyr.bindTooltip(
            `<b>Building: ${f.properties?.building_id || f.id}</b><br/>Height: ${f.properties?.height_meters || '—'}m (${f.properties?.floors || '—'} fl)<br/>Footprint: ${f.properties?.footprint_area || f.properties?.area || '—'} m²`,
            { sticky: true, className: 'leaflet-tooltip-gis' }
          );
        },
      }).addTo(map);
      geoLayersRef.current.drone = droneLayer;
    }

    if (geoLayersRef.current.unified) {
      geoLayersRef.current.unified.eachLayer((layer) => layer.bringToFront());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayers, realMapData]);

  // ── Highlight selected feature (no full layer rebuild) ────────────────────
  // Iterates only the unified layer's sub-layers to apply/remove selection style.
  useEffect(() => {
    const unifiedLayer = geoLayersRef.current.unified;
    if (!unifiedLayer) return;

    const selectedId = selectedFeature?.properties?.parcel_id
      || selectedFeature?.properties?.match_id
      || selectedFeature?.properties?.pair_id
      || null;

    unifiedLayer.eachLayer((lyr) => {
      const f = lyr.feature;
      if (!f) return;
      const fId = f.properties?.parcel_id || f.properties?.match_id || f.properties?.pair_id;
      if (fId && fId === selectedId) {
        lyr.setStyle(LAYER_STYLES.unified.selected);
        lyr.bringToFront();
      } else {
        // Restore status-based style
        const s = f.properties?.status;
        const hasConflicts = (f.properties?.conflicts?.length ?? 0) > 0;
        if (s === 'AUTO_VERIFIED' || s === 'HUMAN_VERIFIED') {
          lyr.setStyle(LAYER_STYLES.unified.verified);
        } else if (hasConflicts) {
          lyr.setStyle(LAYER_STYLES.unified.conflict);
        } else {
          lyr.setStyle(LAYER_STYLES.unified.review);
        }
      }
    });
  }, [selectedFeature]);

  // ── Focus on selected feature (zoom to bounds) ───────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFeature?.geometry) return;
    try {
      // L.geoJSON handles [lng,lat] -> [lat,lng] conversion automatically here
      const bounds = L.geoJSON(selectedFeature).getBounds();
      if (bounds.isValid()) map.flyToBounds(bounds, { padding: [60, 60], duration: 0.6 });
    } catch { /* ignore */ }
  }, [selectedFeature]);

  const handleResetExtent = () => {
    mapInstanceRef.current?.setView(MAP_CENTER, DEFAULT_ZOOM);
  };

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    const bounds = geoLayersRef.current.unified?.getBounds();
    if (map && bounds?.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
  };

  return (
    <div className="relative w-full h-full bg-[#07090e] overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating HUD: Cartographic tools */}
      <div className="absolute top-3 left-3 z-400 flex items-center gap-1 bg-[#0d121c]/90 backdrop-blur-md border border-[#1c2638] rounded-lg p-1 shadow-2xl">
        <button
          onClick={handleResetExtent}
          title="Reset Extent"
          className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-[#1c2638] rounded transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
          RESET
        </button>
        <button
          onClick={handleFitBounds}
          title="Fit all visible unified parcels"
          className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-[#1c2638] rounded transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 3 3 3 3 8" /><polyline points="16 3 21 3 21 8" />
            <polyline points="8 21 3 21 3 16" /><polyline points="16 21 21 21 21 16" />
          </svg>
          FIT
        </button>
        <div className="w-px h-4 bg-[#1c2638]" />
        {Object.entries(TILE_PROVIDERS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => setBasemap(key)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              basemap === key ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Spatial Legend (bottom-left) */}
      <div className="absolute bottom-3 left-3 z-400 bg-[#0d121c]/90 backdrop-blur-md border border-[#1c2638] rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300 shadow-2xl space-y-1.5 pointer-events-none">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-[#1c2638] pb-1">Legend</div>
        <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm bg-emerald-500/40 border border-emerald-500"></span><span>Unified · Verified</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm bg-amber-500/40 border border-amber-500 border-dashed"></span><span>Unified · Review</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm bg-red-500/40 border border-red-500 border-dashed"></span><span>Unified · Conflict</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm border border-blue-400 bg-blue-500/20"></span><span>Cadastral</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm border border-amber-400 border-dashed bg-amber-500/10"></span><span>Municipal</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm border border-cyan-400 bg-cyan-500/40"></span><span>Drone Footprint</span></div>
      </div>
    </div>
  );
}
