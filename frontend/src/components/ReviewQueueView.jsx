import React, { useState } from 'react';
import { HARMONIZATION_PAIRS } from '../map/mockGeoData';

export default function ReviewQueueView({ onInspectPair }) {
  const [filter, setFilter] = useState('ALL');

  const filteredPairs = HARMONIZATION_PAIRS.filter((pair) => {
    if (filter === 'NEEDS_REVIEW') return pair.status === 'NEEDS_REVIEW';
    if (filter === 'CONFLICT') return pair.status === 'CONFLICT';
    if (filter === 'AUTO_MATCHED') return pair.status === 'AUTO_MATCHED';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#07090e] p-6 text-xs font-mono text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1c2638] pb-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Human-in-the-Loop Adjudication Queue
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Low-confidence matches and geometric anomalies requiring official verification under Section 14 Land Administration.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 bg-[#0d121c] p-1 rounded border border-[#1c2638]">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'ALL' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL ({HARMONIZATION_PAIRS.length})
            </button>
            <button
              onClick={() => setFilter('NEEDS_REVIEW')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'NEEDS_REVIEW' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              REVIEW NEEDED
            </button>
            <button
              onClick={() => setFilter('CONFLICT')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'CONFLICT' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              DISPUTES
            </button>
          </div>
        </div>

        {/* Data Grid */}
        <div className="border border-[#1c2638] rounded-lg overflow-hidden bg-[#0a0e16]">
          <div className="grid grid-cols-12 bg-[#121824] border-b border-[#1c2638] p-3 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <div className="col-span-2">Pair ID</div>
            <div className="col-span-3">Cadastral Source</div>
            <div className="col-span-3">Municipal Record</div>
            <div className="col-span-2">Confidence & IoU</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-[#1c2638]">
            {filteredPairs.map((pair) => {
              const isAuto = pair.status === 'AUTO_MATCHED';
              const isConflict = pair.status === 'CONFLICT';

              return (
                <div
                  key={pair.pair_id}
                  className="grid grid-cols-12 p-3.5 items-center hover:bg-[#0e1420] transition-colors"
                >
                  <div className="col-span-2 font-bold text-white">
                    {pair.pair_id}
                    <div className="text-[10px] text-slate-500 font-normal">
                      {pair.status}
                    </div>
                  </div>

                  <div className="col-span-3 space-y-0.5">
                    <div className="text-blue-400 font-semibold">{pair.cadastral_id}</div>
                    <div className="text-slate-300">{pair.cadastral_record.owner}</div>
                    <div className="text-[10px] text-slate-500">{pair.cadastral_record.area} · {pair.cadastral_record.land_use}</div>
                  </div>

                  <div className="col-span-3 space-y-0.5">
                    <div className="text-amber-400 font-semibold">{pair.municipal_id}</div>
                    <div className={pair.metrics.name_similarity_pct < 90 ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                      {pair.municipal_record.owner}
                    </div>
                    <div className="text-[10px] text-slate-500">{pair.municipal_record.area} · {pair.municipal_record.tax_value}</div>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAuto
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isConflict
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {pair.confidence_score}%
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        IoU: {pair.metrics.spatial_iou}%
                      </span>
                    </div>
                    {pair.flags.length > 0 && (
                      <div className="text-[10px] text-red-400 truncate">
                        ⚠️ {pair.flags[0].label}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => onInspectPair(pair.pair_id)}
                      className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded transition-colors text-[11px] font-bold"
                    >
                      INSPECT IN MAP ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
