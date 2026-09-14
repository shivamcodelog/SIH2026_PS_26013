import React from 'react';

export default function AuditTelemetryView({ health }) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#07090e] p-6 text-xs font-mono text-slate-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#1c2638] pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Platform Architecture & Spatial Pipeline Audit
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              National-level evaluation telemetry, spatial engine verification, and system provenance logs.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            SYSTEM STATUS: VERIFIED
          </span>
        </div>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Node Gateway */}
          <div className="p-4 rounded-lg bg-[#0a0e16] border border-[#1c2638] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase">API Gateway</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                PORT 5000
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Technology: Node.js (ESM) + Express
            </div>
            <div className="text-[10px] text-slate-500 border-t border-[#1c2638] pt-2">
              Endpoint: <code className="text-slate-300">GET /api/health</code>
              <br/>
              Status: {health?.success ? 'HTTP 200 OK (node-server)' : 'STANDBY'}
            </div>
          </div>

          {/* FastAPI Geo Engine */}
          <div className="p-4 rounded-lg bg-[#0a0e16] border border-[#1c2638] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase">FastAPI Engine</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                PORT 8000
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Technology: Python 3.10 + GeoPandas + Shapely
            </div>
            <div className="text-[10px] text-slate-500 border-t border-[#1c2638] pt-2">
              Endpoint: <code className="text-slate-300">GET /health</code>
              <br/>
              Algorithms: PyProj CRS Reprojection &amp; IoU Matcher
            </div>
          </div>

          {/* Spatial Database */}
          <div className="p-4 rounded-lg bg-[#0a0e16] border border-[#1c2638] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase">PostGIS Storage</span>
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                PORT 5432
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Technology: PostgreSQL 18 + PostGIS 3.4
            </div>
            <div className="text-[10px] text-slate-500 border-t border-[#1c2638] pt-2">
              Indexing: GIST Spatial Geometry Indexes
              <br/>
              Storage: Multi-tier non-destructive provenance
            </div>
          </div>
        </div>

        {/* Spatial Processing Specification */}
        <div className="p-4 rounded-lg bg-[#0a0e16] border border-[#1c2638] space-y-3">
          <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Deterministic Harmonization Pipeline Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded bg-[#07090e] border border-[#1c2638]">
              <div className="text-slate-500 font-bold mb-1">COORDINATE REFERENCE SYSTEMS (CRS)</div>
              <div className="text-slate-300">Primary Canonical: <span className="text-white font-bold">EPSG:4326 (WGS84)</span></div>
              <div className="text-slate-300">Projected Planar: <span className="text-white font-bold">EPSG:32643 (UTM Zone 43N)</span></div>
              <p className="text-[10px] text-slate-500 mt-1">
                Preserves metric distance accuracy for parcel area variance calculations.
              </p>
            </div>

            <div className="p-3 rounded bg-[#07090e] border border-[#1c2638]">
              <div className="text-slate-500 font-bold mb-1">MULTI-CRITERIA MATCHING WEIGHTS</div>
              <div className="text-slate-300">Spatial IoU Weight: <span className="text-cyan-400 font-bold">50%</span></div>
              <div className="text-slate-300">Attribute / Levenshtein Weight: <span className="text-blue-400 font-bold">30%</span></div>
              <div className="text-slate-300">Area Tolerance Weight: <span className="text-emerald-400 font-bold">20%</span></div>
              <p className="text-[10px] text-slate-500 mt-1">
                High confidence threshold set strictly at ≥ 90.0% composite score.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Log Terminal */}
        <div className="rounded-lg border border-[#1c2638] bg-[#05070a] overflow-hidden">
          <div className="px-3 py-1.5 bg-[#0e131d] border-b border-[#1c2638] flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-bold uppercase tracking-wider">Audit Console / Provenance Stream</span>
            <span className="text-emerald-400">● LIVE</span>
          </div>
          <div className="p-3 text-[11px] space-y-1 text-slate-300 font-mono">
            <div><span className="text-slate-600">[00:01:14]</span> <span className="text-blue-400">INIT:</span> System boot in pure JavaScript React 19 execution environment.</div>
            <div><span className="text-slate-600">[00:01:15]</span> <span className="text-cyan-400">PROBE:</span> Node.js API Gateway pinged at port 5000 &rarr; <span className="text-emerald-400">HTTP 200 OK</span>.</div>
            <div><span className="text-slate-600">[00:01:16]</span> <span className="text-blue-400">GEO:</span> FastAPI Engine registered at port 8000 &rarr; GeoPandas &amp; Shapely loaded.</div>
            <div><span className="text-slate-600">[00:01:17]</span> <span className="text-amber-400">CRS:</span> Reprojected Municipal layer (EPSG:32643) to canonical WGS84 (EPSG:4326).</div>
            <div><span className="text-slate-600">[00:01:18]</span> <span className="text-emerald-400">MATCH:</span> Computed spatial IoU for 3 parcel pairs in 12.4ms.</div>
            <div><span className="text-slate-600">[00:01:19]</span> <span className="text-amber-400">FLAG:</span> Detected spelling variation for pair HARM-PAIR-01 ("Ravi Kumar" ⇄ "Ravi K.").</div>
            <div><span className="text-slate-600">[00:01:20]</span> <span className="text-red-400">DISPUTE:</span> Critical ownership conflict logged for parcel CAD-2026-003.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
