import React, { useState } from 'react';
import { HARMONIZATION_PAIRS } from '../map/mockGeoData';

export default function EntityInspectorPanel({
  selectedPairId,
  isCollapsed,
  onToggleCollapse
}) {
  const [resolutionStatus, setResolutionStatus] = useState(null);

  const currentPair = HARMONIZATION_PAIRS.find(p => p.pair_id === selectedPairId) || HARMONIZATION_PAIRS[0];

  const handleDecision = (decision) => {
    setResolutionStatus({
      decision,
      timestamp: new Date().toLocaleTimeString(),
      pairId: currentPair.pair_id
    });
  };

  if (isCollapsed) {
    return (
      <aside className="w-10 border-l border-[#1c2638] bg-[#0d121c] flex flex-col items-center py-3 select-none flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          title="Expand Inspector Panel"
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1c2638] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="mt-8 text-[10px] font-mono uppercase text-slate-500 tracking-widest [writing-mode:vertical-rl] rotate-180">
          ENTITY INSPECTOR
        </div>
      </aside>
    );
  }

  const isAuto = currentPair.status === 'AUTO_MATCHED';
  const isConflict = currentPair.status === 'CONFLICT';

  return (
    <aside className="w-96 border-l border-[#1c2638] bg-[#0d121c] flex flex-col select-none flex-shrink-0 z-20 text-xs font-mono">
      {/* Dock Header */}
      <div className="h-9 px-3 border-b border-[#1c2638] flex items-center justify-between bg-[#090d14]">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200 text-[11px]">
          <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Record Comparator
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold">{currentPair.pair_id}</span>
          <button
            onClick={onToggleCollapse}
            title="Collapse Panel"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#1c2638] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Harmonization Score Gauge */}
        <section className="bg-[#090d14] border border-[#1c2638] rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Confidence Index
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isAuto
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : isConflict
                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {currentPair.confidence_score}% · {currentPair.status}
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-[#1c2638] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isAuto ? 'bg-emerald-400' : isConflict ? 'bg-red-400' : 'bg-amber-400'
              }`}
              style={{ width: `${currentPair.confidence_score}%` }}
            />
          </div>

          {/* Metric telemetry grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1c2638] text-[10px]">
            <div>
              <div className="text-slate-500">SPATIAL IOU:</div>
              <div className="text-slate-200 font-bold tabular-nums">
                {currentPair.metrics.spatial_iou}%
              </div>
            </div>
            <div>
              <div className="text-slate-500">CENTROID DIST:</div>
              <div className="text-slate-200 font-bold tabular-nums">
                {currentPair.metrics.centroid_distance_meters} m
              </div>
            </div>
            <div>
              <div className="text-slate-500">AREA VARIANCE:</div>
              <div className="text-slate-200 font-bold tabular-nums">
                {currentPair.metrics.area_variance_pct}%
              </div>
            </div>
            <div>
              <div className="text-slate-500">NAME SIMILARITY:</div>
              <div className="text-slate-200 font-bold tabular-nums">
                {currentPair.metrics.name_similarity_pct}%
              </div>
            </div>
          </div>
        </section>

        {/* Anomaly & Dispute Flags */}
        {currentPair.flags.length > 0 ? (
          <section className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Discrepancy Flags ({currentPair.flags.length})
            </div>
            <div className="space-y-1">
              {currentPair.flags.map((flag, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-red-950/20 border border-red-500/30 text-[11px]"
                >
                  <div className="text-red-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                    {flag.label}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {flag.detail}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Zero topological conflicts detected between source layers.
          </div>
        )}

        {/* Side-by-Side Field Comparison Table */}
        <section className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Attribute Cross-Verification
          </div>

          <div className="border border-[#1c2638] rounded overflow-hidden text-[10px]">
            <div className="grid grid-cols-2 bg-[#121824] border-b border-[#1c2638] font-bold text-slate-300 p-1.5">
              <span className="text-blue-400">Cadastral Record</span>
              <span className="text-amber-400">Municipal Record</span>
            </div>

            {/* Field: ID */}
            <div className="grid grid-cols-2 p-1.5 border-b border-[#1c2638] bg-[#090d14]">
              <div>
                <span className="text-slate-500 block">ID</span>
                <span className="text-slate-200 font-bold">{currentPair.cadastral_record.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ID</span>
                <span className="text-slate-200 font-bold">{currentPair.municipal_record.id}</span>
              </div>
            </div>

            {/* Field: Owner */}
            <div className="grid grid-cols-2 p-1.5 border-b border-[#1c2638] bg-[#090d14]">
              <div>
                <span className="text-slate-500 block">Owner</span>
                <span className="text-slate-200 font-bold">{currentPair.cadastral_record.owner}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Holder</span>
                <span className={`font-bold ${
                  currentPair.metrics.name_similarity_pct < 90 ? 'text-amber-300 underline decoration-dashed' : 'text-slate-200'
                }`}>
                  {currentPair.municipal_record.owner}
                </span>
              </div>
            </div>

            {/* Field: Area */}
            <div className="grid grid-cols-2 p-1.5 border-b border-[#1c2638] bg-[#090d14]">
              <div>
                <span className="text-slate-500 block">Recorded Area</span>
                <span className="text-slate-200 tabular-nums">{currentPair.cadastral_record.area}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assessed Area</span>
                <span className="text-slate-200 tabular-nums">{currentPair.municipal_record.area}</span>
              </div>
            </div>

            {/* Field: Authority */}
            <div className="grid grid-cols-2 p-1.5 bg-[#090d14]">
              <div>
                <span className="text-slate-500 block">Authority</span>
                <span className="text-slate-400">{currentPair.cadastral_record.authority}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Authority</span>
                <span className="text-slate-400">{currentPair.municipal_record.authority}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Associated Drone Footprint */}
        <section className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Intersecting Drone Footprint
          </div>
          <div className="p-2 rounded bg-[#090d14] border border-[#1c2638] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
              <span className="font-bold text-slate-200">
                {currentPair.building_ids[0]}
              </span>
            </div>
            <span className="text-[10px] text-cyan-400">
              Photogrammetric Outline
            </span>
          </div>
        </section>

        {/* Human-in-the-loop Decision Console */}
        <section className="pt-2 border-t border-[#1c2638] space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Adjudication Actions
          </div>

          {resolutionStatus && resolutionStatus.pairId === currentPair.pair_id ? (
            <div className="p-2.5 rounded bg-blue-950/40 border border-blue-500/40 text-[11px] space-y-1">
              <div className="text-blue-300 font-bold flex items-center justify-between">
                <span>Decision Committed</span>
                <span className="text-[10px] text-slate-400">{resolutionStatus.timestamp}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Action: <span className="font-bold text-white">{resolutionStatus.decision}</span> logged into PostGIS review audit ledger.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => handleDecision('ACCEPT_HARMONIZATION')}
                className="w-full py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded font-bold text-[11px] transition-colors text-center"
              >
                ACCEPT & UNIFY RECORD
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleDecision('FLAG_FOR_FIELD_SURVEY')}
                  className="py-1.5 px-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded font-semibold text-[10px] transition-colors text-center"
                >
                  FLAG FOR SURVEY
                </button>
                <button
                  onClick={() => handleDecision('REJECT_MATCH')}
                  className="py-1.5 px-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded font-semibold text-[10px] transition-colors text-center"
                >
                  REJECT MATCH
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
