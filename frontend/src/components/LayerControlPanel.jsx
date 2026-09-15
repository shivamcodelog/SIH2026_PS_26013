export default function LayerControlPanel({
  activeLayers,
  setActiveLayers,
  selectedPairId,
  onSelectPair,
  features = [],
  isCollapsed,
  onToggleCollapse
}) {
  const toggleLayer = (key) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setFilter = (type) => {
    if (type === 'conflicts') {
      setActiveLayers(prev => ({ ...prev, conflictsOnly: true }));
    } else {
      setActiveLayers(prev => ({ ...prev, conflictsOnly: false }));
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-10 border-r border-[#1c2638] bg-[#0d121c] flex flex-col items-center py-3 select-none shrink-0">
        <button
          onClick={onToggleCollapse}
          title="Expand Layer Panel"
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1c2638] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <div className="mt-8 text-[10px] font-mono uppercase text-slate-500 tracking-widest [writing-mode:vertical-rl] rotate-180">
          DATASET LAYERS
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-r border-[#1c2638] bg-[#0d121c] flex flex-col select-none shrink-0 z-20 text-xs font-mono">
      {/* Dock Header */}
      <div className="h-9 px-3 border-b border-[#1c2638] flex items-center justify-between bg-[#090d14]">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200 text-[11px]">
          <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          Geospatial Layers
        </div>
        <button
          onClick={onToggleCollapse}
          title="Collapse Panel"
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#1c2638] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Source Datasets Hierarchy */}
        <section className="space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Active Multi-Source Datasets
          </div>

          <div className="space-y-1.5">
            {/* Layer 1: Cadastral */}
            <label className={`flex items-start gap-2.5 p-2 rounded border transition-colors cursor-pointer ${
              activeLayers.cadastral && !activeLayers.conflictsOnly
                ? 'bg-[#121824] border-blue-500/30 text-white'
                : 'bg-[#090d14] border-[#1c2638] text-slate-400 opacity-60'
            }`}>
              <input
                type="checkbox"
                checked={activeLayers.cadastral && !activeLayers.conflictsOnly}
                onChange={() => toggleLayer('cadastral')}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">1. Cadastral Parcels</span>
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 border border-blue-400"></span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                  <span>State Land Records</span>
                  <span className="text-blue-400">{features.length} Parcels</span>
                </div>
              </div>
            </label>

            {/* Layer 2: Municipal */}
            <label className={`flex items-start gap-2.5 p-2 rounded border transition-colors cursor-pointer ${
              activeLayers.municipal && !activeLayers.conflictsOnly
                ? 'bg-[#121824] border-amber-500/30 text-white'
                : 'bg-[#090d14] border-[#1c2638] text-slate-400 opacity-60'
            }`}>
              <input
                type="checkbox"
                checked={activeLayers.municipal && !activeLayers.conflictsOnly}
                onChange={() => toggleLayer('municipal')}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">2. Municipal Tax Plots</span>
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-amber-400"></span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                  <span>Tax Assessment Board</span>
                  <span className="text-amber-400">{features.length} Plots</span>
                </div>
              </div>
            </label>

            {/* Layer 3: Drone Building Footprints */}
            <label className={`flex items-start gap-2.5 p-2 rounded border transition-colors cursor-pointer ${
              activeLayers.drone && !activeLayers.conflictsOnly
                ? 'bg-[#121824] border-cyan-500/30 text-white'
                : 'bg-[#090d14] border-[#1c2638] text-slate-400 opacity-60'
            }`}>
              <input
                type="checkbox"
                checked={activeLayers.drone && !activeLayers.conflictsOnly}
                onChange={() => toggleLayer('drone')}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">3. Drone Footprints</span>
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 border border-cyan-400"></span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                  <span>UAV Photogrammetry</span>
                  <span className="text-cyan-400">0 Structures</span>
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Harmonization Filter Matrix */}
        <section className="space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Harmonization Filters
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1.5 rounded border text-left transition-colors ${
                !activeLayers.conflictsOnly
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                  : 'bg-[#090d14] border-[#1c2638] text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold">ALL LAYERS</div>
              <div className="text-[10px] text-slate-500">Full Overlay View</div>
            </button>

            <button
              onClick={() => setFilter('conflicts')}
              className={`px-2 py-1.5 rounded border text-left transition-colors ${
                activeLayers.conflictsOnly
                  ? 'bg-red-950/40 border-red-500/40 text-red-300'
                  : 'bg-[#090d14] border-[#1c2638] text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>CONFLICTS</span>
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
              </div>
              <div className="text-[10px] text-slate-500">Flagged Anomalies</div>
            </button>
          </div>
        </section>

        {/* Entity Matches & Review Queue List */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-500">
            <span>Processed Records ({features.length})</span>
            <span className="text-slate-400">IoU Score</span>
          </div>

          <div className="space-y-1.5">
            {features.map((feature) => {
              const properties = feature.properties || {};
              const isSelected = selectedPairId === properties.parcel_id;
              const isVerified = properties.status === 'AUTO_VERIFIED' || properties.status === 'HUMAN_VERIFIED';
              const isConflict = (properties.conflicts || []).length > 0;

              return (
                <div
                  key={feature.id || properties.parcel_id}
                  onClick={() => onSelectPair(properties.parcel_id)}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#151d2d] border-blue-500 text-white shadow-lg'
                      : 'bg-[#090d14] border-[#1c2638] hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{properties.parcel_id}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isVerified
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isConflict
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {properties.confidence ?? '—'}%
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span className="truncate max-w-35">{properties.owner_name || 'Unknown owner'}</span>
                    <span className="text-slate-500">⇄ {properties.source_record_b || 'No municipal match'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ingestion Engine Status */}
        <section className="p-2.5 rounded bg-[#090d14] border border-[#1c2638] space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Ingestion Pipeline</span>
            <span className="text-emerald-400">READY</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Showing records returned by the Node API after FastAPI processing.
          </p>
        </section>
      </div>
    </aside>
  );
}
