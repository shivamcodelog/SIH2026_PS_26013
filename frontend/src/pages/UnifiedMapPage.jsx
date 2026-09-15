/**
 * UnifiedMapPage.jsx — Mission 10: Leaflet GIS Map
 *
 * Sections implemented:
 *   §21 Interactive Map  — Leaflet canvas with parcel/building/unified layers
 *   §22 Map Layers       — Toggleable: Unified Parcels, Cadastral, Municipal, Drone Buildings
 *   §23 Map Interaction  — Click a parcel → detail panel (both clean and problem mockup exact fields)
 *   §24 Conflict Visual  — Problem parcels: pulsing ⚠ CONFLICT label + red dashed outline (not color alone)
 *
 * Coordinate contract (rules.md):
 *   GeoJSON [lng, lat] ←→ Leaflet [lat, lng]
 *   L.geoJSON() handles geometry automatically.
 *   L.marker() calls use getBounds().getCenter() (already Leaflet [lat,lng]).
 */
import { startTransition, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../lib/ProjectContext.jsx';
import api from '../api/client.js';
import WebGISMap from '../map/WebGISMap.jsx';
import LayerControlPanel from '../components/LayerControlPanel.jsx';
import TelemetryBar from '../components/TelemetryBar.jsx';

export default function UnifiedMapPage() {
  const { activeProject, selectedMatchId, setSelectedMatchId } = useProject();
  const navigate = useNavigate();

  // Real API map data (used if processing has run)
  const [realMapData, setRealMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Layer visibility state — 4 independent layers + conflict filter
  const [activeLayers, setActiveLayers] = useState({
    unified: true,
    cadastral: true,
    municipal: true,
    drone: true,
    conflictsOnly: false,
  });

  // Currently selected map feature (GeoJSON Feature object)
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Panel collapse state
  const [layerPanelCollapsed, setLayerPanelCollapsed] = useState(false);

  // Live cursor telemetry
  const [coords, setCoords] = useState({ lat: '28.62800', lng: '77.21800', zoom: 16 });

  // Fetch real processed map data from Node API gateway
  useEffect(() => {
    if (!activeProject?.id) return;
    startTransition(() => { setLoading(true); setError(null); });
    api.getMap(activeProject.id)
      .then((res) => {
        const fc = res.map || res.data?.map;
        setRealMapData(fc || { type: 'FeatureCollection', features: [] });
      })
      .catch((err) => {
        setError(err.message || 'Failed to load map data');
        setRealMapData({ type: 'FeatureCollection', features: [] });
      })
      .finally(() => setLoading(false));
  }, [activeProject]);

  useEffect(() => {
    if (!selectedMatchId) return;
    const feature = realMapData?.features?.find((item) => (
      item.properties?.parcel_id || item.properties?.match_id
    ) === selectedMatchId);
    if (feature) startTransition(() => setSelectedFeature(feature));
  }, [realMapData, selectedMatchId]);

  const handleFeatureSelect = (feature) => {
    setSelectedFeature(feature);
    setSelectedMatchId(feature.properties?.parcel_id || feature.properties?.match_id || null);
  };

  const p = selectedFeature?.properties || null;
  const hasConflicts = p?.conflicts?.length > 0;
  const statusBadge = {
    AUTO_VERIFIED:  { label: 'AUTO VERIFIED',  cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40' },
    HUMAN_VERIFIED: { label: 'HUMAN VERIFIED', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40' },
    REQUIRES_REVIEW:{ label: 'REQUIRES REVIEW',cls: 'text-amber-400 bg-amber-500/10 border-amber-500/40' },
    REJECTED:       { label: 'REJECTED',        cls: 'text-red-400 bg-red-500/10 border-red-500/40' },
  };
  const badge = statusBadge[p?.status] || { label: p?.status || '—', cls: 'text-slate-400 border-slate-500/30' };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#07090e]">

      {/* ── Sub-header ─────────────────────────────────────────────────────── */}
      <div className="h-12 shrink-0 bg-[#0d121c]/90 backdrop-blur-md border-b border-[#1c2638] px-5 flex items-center justify-between text-xs shadow-sm z-10">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-200 flex items-center gap-2 tracking-wide text-sm">
            <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">◈</span> Unified Geospatial Canvas
          </span>
          {activeProject && (
            <span className="text-slate-400 font-mono text-[11px] bg-[#111724] px-2 py-1 rounded-md border border-[#1c2638]">
              PROJ: <span className="text-slate-300 font-bold">{activeProject.name}</span>
            </span>
          )}
          {loading && (
            <span className="text-blue-400 flex items-center gap-1.5 font-medium animate-pulse text-[11px]">
              <span className="animate-spin text-sm">⟳</span> Loading live data…
            </span>
          )}
          {realMapData && (
            <span className="text-emerald-400 text-[11px] font-mono font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]"></span>
              {realMapData.features.length} LIVE records
            </span>
          )}
        </div>

        {/* Quick layer toggles in sub-header */}
        <div className="flex items-center gap-2.5 font-mono text-[11px]">
          {[
            { key: 'unified',   label: '◈ Unified',   color: 'text-emerald-400', activeBg: 'bg-emerald-500/10', activeBorder: 'border-emerald-500/40' },
            { key: 'cadastral', label: '■ Cadastral', color: 'text-blue-400', activeBg: 'bg-blue-500/10', activeBorder: 'border-blue-500/40' },
            { key: 'municipal', label: '⬦ Municipal', color: 'text-amber-400', activeBg: 'bg-amber-500/10', activeBorder: 'border-amber-500/40' },
            { key: 'drone',     label: '▲ Drone',     color: 'text-cyan-400', activeBg: 'bg-cyan-500/10', activeBorder: 'border-cyan-500/40' },
          ].map(({ key, label, color, activeBg, activeBorder }) => (
            <button
              key={key}
              onClick={() => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all duration-200 hover:scale-[1.02] ${
                activeLayers[key]
                  ? `${color} ${activeBg} ${activeBorder} shadow-sm`
                  : 'text-slate-500 border-[#2a3852] bg-[#111724]/50 hover:border-[#3b4b68] hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-5 bg-[#2a3852] mx-1"></div>
          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, conflictsOnly: !prev.conflictsOnly }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all duration-200 hover:scale-[1.02] ${
              activeLayers.conflictsOnly
                ? 'text-red-400 border-red-500/50 bg-red-500/15 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                : 'text-slate-500 border-[#2a3852] bg-[#111724]/50 hover:border-red-500/30 hover:text-red-400'
            }`}
          >
            <span className={activeLayers.conflictsOnly ? 'animate-pulse' : ''}>⚠</span> Conflicts Only
          </button>
        </div>
      </div>

      {/* ── Main canvas row ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Layer Control Sidebar */}
        <LayerControlPanel
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          selectedPairId={p?.pair_id || p?.parcel_id || p?.match_id || null}
          onSelectPair={(pairId) => {
            const feature = realMapData?.features?.find(f => (f.properties?.pair_id || f.properties?.parcel_id || f.properties?.match_id) === pairId);
            if (feature) {
              setSelectedFeature(feature);
              setSelectedMatchId(pairId);
            }
          }}
          isCollapsed={layerPanelCollapsed}
          onToggleCollapse={() => setLayerPanelCollapsed(v => !v)}
          realMapData={realMapData}
        />

        {/* Leaflet Map Canvas */}
        <div className="flex-1 h-full relative">
          {error && (
            <div className="absolute inset-x-0 top-0 z-500 p-4 bg-red-950/90 text-red-200 border-b border-red-500/50 flex flex-col items-center justify-center text-sm font-mono shadow-xl backdrop-blur-sm">
              <span className="font-bold text-red-400 mb-1 text-base">⚠ {error}</span>
              <span>The end-to-end processing pipeline requires the backend to be online.</span>
            </div>
          )}
          <WebGISMap
            activeLayers={activeLayers}
            selectedFeature={selectedFeature}
            onSelectFeature={handleFeatureSelect}
            onCoordsChange={setCoords}
            realMapData={realMapData}
          />
        </div>

        {/* ── Entity Inspector (§23 mockups) ───────────────────────────────── */}
        <aside className="w-80 shrink-0 bg-[#0d121c] border-l border-[#1c2638] flex flex-col overflow-y-auto text-xs">
          {/* Panel Header */}
          <div className="p-4 border-b border-[#1c2638] bg-[#090d14] flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Entity Inspector
            </h2>
            {p && <span className="font-mono text-blue-400 font-bold text-[11px]">{p.parcel_id}</span>}
          </div>

          {p ? (
            <div className="p-4 space-y-4">

              {/* ── §23 PARCEL HEADER ─────────────────────────────────────── */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase tracking-wider">Parcel</div>
                  <div className="text-white font-bold font-mono text-base mt-0.5">{p.parcel_id}</div>
                </div>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              <div className="border-b border-[#1c2638]" />

              {/* ── §23 ATTRIBUTE FIELDS ──────────────────────────────────── */}
              <div className="space-y-3">
                <Field label="Owner" value={p.owner_name || '—'} />
                <Field label="Area" value={p.area ? `${p.area.toLocaleString()} m²` : '—'} />
                <Field label="Building" value={p.building_id || 'None'} />
              </div>

              <div className="border-b border-[#1c2638]" />

              {/* ── §23 SOURCES ───────────────────────────────────────────── */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Sources</div>
                <div className="space-y-1">
                  {(p.sources || [p.parcel_id]).map((src) => (
                    <div key={src} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="font-mono">{src}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-b border-[#1c2638]" />

              {/* ── §23 CONFIDENCE ────────────────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Confidence</span>
                  <span className={`font-bold font-mono text-sm ${
                    p.confidence >= 90 ? 'text-emerald-400'
                    : p.confidence >= 70 ? 'text-amber-400'
                    : 'text-red-400'
                  }`}>
                    {p.confidence != null ? `${p.confidence}%` : '—'}
                  </span>
                </div>
                {p.confidence != null && (
                  <div className="w-full bg-[#0d121c] h-1.5 rounded-full overflow-hidden border border-[#1c2638]">
                    <div
                      className={`h-full transition-all ${
                        p.confidence >= 90 ? 'bg-emerald-500'
                        : p.confidence >= 70 ? 'bg-amber-500'
                        : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(p.confidence, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* ── §23 CONFLICTS ─────────────────────────────────────────── */}
              {hasConflicts ? (
                <div className="space-y-2 bg-red-950/20 border border-red-500/30 rounded-lg p-3">
                  <div className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                    Conflicts ({p.conflicts.length})
                  </div>
                  <div className="space-y-1.5">
                    {p.conflicts.map((c, i) => (
                      <div key={i} className="text-[11px] bg-red-900/20 border border-red-500/20 rounded p-2">
                        <div className="font-bold text-[10px] uppercase font-mono text-red-400">
                          ⚠ {typeof c === 'string' ? c : c.type}
                        </div>
                        {c.description && (
                          <div className="text-red-200 text-[10px] mt-0.5">{c.description}</div>
                        )}
                        {c.severity && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Severity: <span className={`font-bold ${c.severity === 'HIGH' ? 'text-red-400' : c.severity === 'MEDIUM' ? 'text-amber-400' : 'text-slate-300'}`}>{c.severity}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* §23 — [Review Record] button for uncertain parcels */}
                  <button
                    onClick={() => navigate('/review')}
                    className="mt-1 w-full py-1.5 px-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded font-bold text-[11px] transition-colors text-center"
                  >
                    [Review Record]
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 text-emerald-300 text-[11px] flex items-center gap-2">
                  <span className="font-bold">✓</span> Conflicts: None
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <svg className="w-10 h-10 text-slate-700 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/>
                <line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
              <p className="text-slate-600 text-[11px] font-mono">Click any parcel on the map to inspect</p>
              <p className="text-slate-700 text-[10px] mt-1">unified properties and conflict diagnostics</p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Bottom Telemetry Bar ───────────────────────────────────────────── */}
      <TelemetryBar
        lat={coords.lat}
        lng={coords.lng}
        zoom={coords.zoom}
      />
    </div>
  );
}

/** Utility: one row of parcel attribute */
function Field({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-slate-500 text-[11px] shrink-0">{label}</span>
      <span className="text-slate-200 text-[11px] font-mono text-right">{value}</span>
    </div>
  );
}
