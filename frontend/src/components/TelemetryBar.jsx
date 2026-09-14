import React from 'react';

export default function TelemetryBar({ coords }) {
  return (
    <footer className="h-7 border-t border-[#1c2638] bg-[#080b10] px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-30 flex-shrink-0">
      {/* Left: Pipeline Execution Stage Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="text-[10px] uppercase font-bold text-slate-500">PIPELINE:</span>
          <span className="text-slate-300">STAGE 3 · MULTI-SOURCE HARMONIZATION COMPLETE</span>
        </div>

        <div className="w-[1px] h-3 bg-[#1c2638] hidden sm:block" />

        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-500">
          <span>PARCELS EVALUATED: <b className="text-slate-300">4</b></span>
          <span>·</span>
          <span>TAX RECORDS: <b className="text-slate-300">3</b></span>
          <span>·</span>
          <span>DRONE STRUCTURES: <b className="text-slate-300">3</b></span>
        </div>
      </div>

      {/* Right: Live Cartographic Coordinates Reticle */}
      <div className="flex items-center space-x-3 text-[10px]">
        <div className="flex items-center gap-2 text-slate-300 bg-[#0e131d] px-2 py-0.5 rounded border border-[#1c2638] tabular-nums">
          <span className="text-slate-500">LAT:</span>
          <span className="font-semibold text-slate-200">{coords ? `${coords.lat}° N` : '28.62800° N'}</span>
          <span className="text-slate-500">LON:</span>
          <span className="font-semibold text-slate-200">{coords ? `${coords.lng}° E` : '77.21800° E'}</span>
          <span className="text-slate-500">ZOOM:</span>
          <span className="font-semibold text-cyan-400">{coords ? coords.zoom : 16}</span>
        </div>
      </div>
    </footer>
  );
}
