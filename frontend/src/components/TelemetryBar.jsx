import React from 'react';

/**
 * TelemetryBar — bottom status bar showing live cartographic coordinates.
 * Props: lat, lng, zoom (individual strings/numbers, passed from WebGISMap via onCoordsChange).
 */
export default function TelemetryBar({ lat, lng, zoom }) {
  return (
    <footer className="h-7 border-t border-[#1c2638] bg-[#080b10] px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-30 flex-shrink-0">
      {/* Left: Pipeline Execution Stage Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] uppercase font-bold text-slate-500">PIPELINE:</span>
          <span className="text-slate-300">STAGE 3 · MULTI-SOURCE HARMONIZATION COMPLETE</span>
        </div>

        <div className="w-[1px] h-3 bg-[#1c2638] hidden sm:block" />

        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-500">
          <span>COORD SYS: <b className="text-slate-300">WGS84 / EPSG:4326</b></span>
          <span>·</span>
          <span>RENDER: <b className="text-slate-300">Leaflet 1.9</b></span>
        </div>
      </div>

      {/* Right: Live Cartographic Coordinates Reticle */}
      <div className="flex items-center space-x-3 text-[10px]">
        <div className="flex items-center gap-2 text-slate-300 bg-[#0e131d] px-2 py-0.5 rounded border border-[#1c2638] tabular-nums">
          <span className="text-slate-500">LAT:</span>
          <span className="font-semibold text-slate-200">{lat ?? '—'}° N</span>
          <span className="text-slate-500">LON:</span>
          <span className="font-semibold text-slate-200">{lng ?? '—'}° E</span>
          <span className="text-slate-500">ZOOM:</span>
          <span className="font-semibold text-cyan-400">{zoom ?? 16}</span>
        </div>
      </div>
    </footer>
  );
}
