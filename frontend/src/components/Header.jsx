import React from 'react';

export default function Header({ health, loading, activeView, setActiveView }) {
  return (
    <header className="h-12 border-b border-[#1c2638] bg-[#0c1017] px-4 flex items-center justify-between select-none z-30 flex-shrink-0">
      {/* Left: System Identifier */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-2">
          {/* Tactical GIS Reticle Icon */}
          <div className="w-7 h-7 rounded bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-white">
                SIH26013
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Geo-Harmonizer
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight">
              Multi-Source Geospatial Integration Platform
            </p>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[#1c2638] hidden md:block" />

        {/* Study Area Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
          <span className="text-slate-500">STUDY AREA:</span>
          <span className="text-slate-200 font-semibold">URBAN SECTOR 26 (SYNTHETIC BENCHMARK)</span>
        </div>
      </div>

      {/* Center: Live Engine Telemetry Readout */}
      <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono">
        {/* Node Gateway Health */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#07090e] border border-[#1c2638]">
          <span className={`w-1.5 h-1.5 rounded-full ${health?.success ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-slate-400">NODE:</span>
          <span className={health?.success ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
            {loading ? 'CONNECTING' : health?.success ? 'ONLINE' : 'STANDBY'}
          </span>
        </div>

        {/* FastAPI Geo Engine */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#07090e] border border-[#1c2638]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span className="text-slate-400">FASTAPI:</span>
          <span className="text-cyan-400 font-semibold">GEO-ENGINE</span>
        </div>

        {/* PostGIS Extension */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#07090e] border border-[#1c2638]">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          <span className="text-slate-400">SPATIAL DB:</span>
          <span className="text-blue-400 font-semibold">POSTGIS</span>
        </div>

        {/* CRS Projection */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#07090e] border border-[#1c2638]">
          <span className="text-slate-500">CRS:</span>
          <span className="text-slate-300 font-semibold">EPSG:4326</span>
        </div>
      </div>

      {/* Right: Workstation View Mode Switcher */}
      <div className="flex items-center space-x-1.5">
        <div className="bg-[#07090e] p-0.5 rounded border border-[#1c2638] flex items-center text-[11px] font-mono">
          <button
            onClick={() => setActiveView('map')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeView === 'map'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            WEBGIS MAP
          </button>
          <button
            onClick={() => setActiveView('review')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              activeView === 'review'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            REVIEW QUEUE
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">
              2
            </span>
          </button>
          <button
            onClick={() => setActiveView('telemetry')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeView === 'telemetry'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AUDIT
          </button>
        </div>
      </div>
    </header>
  );
}
