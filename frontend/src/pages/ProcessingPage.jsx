/**
 * Page 3 — Processing Pipeline (§17, §28, §29)
 * Triggers the end-to-end harmonization engine via POST /api/projects/:id/process.
 * Displays pipeline stages, progress, configurable thresholds, and post-processing summary.
 */
import { startTransition, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../lib/ProjectContext.jsx';
import api from '../api/client.js';

const PIPELINE_STAGES = [
  { id: 'read',       label: 'Reading source datasets',      desc: 'Validating GeoJSON structures and geometries' },
  { id: 'schema',     label: 'Detecting schema & aliases',   desc: 'Mapping field names (holder_name, plot_area)' },
  { id: 'crs',        label: 'Normalizing coordinate CRS',   desc: 'Ensuring common projected metric reference system' },
  { id: 'geom',       label: 'Validating & repairing geometry', desc: 'Checking self-intersections and slivers' },
  { id: 'match',      label: 'Spatial & attribute matching', desc: 'IoU bbox candidate search & multi-factor scoring' },
  { id: 'conflicts',  label: 'Detecting conflicts',          desc: 'Evaluating owner, area, and boundary discrepancies' },
  { id: 'confidence', label: 'Computing confidence & unified records', desc: 'Weighted fusion and geometry selection' },
];

export default function ProcessingPage() {
  const { activeProject, refreshActiveProject } = useProject();
  const navigate = useNavigate();

  const [threshold, setThreshold] = useState(0.90);
  const [spatialWeight, setSpatialWeight] = useState(0.50);
  const [areaWeight, setAreaWeight] = useState(0.20);
  const [attributeWeight, setAttributeWeight] = useState(0.30);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [processingResult, setProcessingResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [datasetError, setDatasetError] = useState('');
  const [datasetsLoading, setDatasetsLoading] = useState(false);

  // Load project datasets to verify readiness
  useEffect(() => {
    if (!activeProject?.id) return;
    startTransition(() => {
      setDatasetsLoading(true);
      setDatasetError('');
    });
    api.getDatasets(activeProject.id)
      .then((res) => setDatasets(res.datasets || res.data?.datasets || []))
      .catch((error) => { setDatasets([]); setDatasetError(error.message); })
      .finally(() => setDatasetsLoading(false));
  }, [activeProject]);

  const handleRunPipeline = async () => {
    if (!activeProject?.id || !hasDatasets) {
      setErrorMessage('Upload cadastral and municipal GeoJSON datasets before processing.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage('');
    setProcessingResult(null);
    setCurrentStageIdx(0);

    try {
      const res = await api.processProject(activeProject.id, {
        threshold: parseFloat(threshold),
        spatial_weight: parseFloat(spatialWeight),
        area_weight: parseFloat(areaWeight),
        attribute_weight: parseFloat(attributeWeight),
      });

      setCurrentStageIdx(PIPELINE_STAGES.length);
      setProcessingResult(res);
      await refreshActiveProject();
    } catch (err) {
      setErrorMessage(err.message || 'Pipeline processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center text-xl mb-3 text-slate-400">⚙</div>
        <p className="text-base text-slate-300 font-medium">No Project Selected</p>
        <p className="text-xs text-slate-500 mt-1 mb-4">Select or create a project on the Dashboard first.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const hasDatasets = datasets.length >= 2;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-blue-400">⚙</span> Processing Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated multi-source harmonization & conflict detection for <span className="text-slate-300 font-medium">{activeProject.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-[#0d121c] border border-[#1c2638] text-slate-400">
            {datasetsLoading ? 'Checking datasets…' : `${datasets.length} Datasets Loaded`}
          </span>
        </div>
      </div>

      {/* Main Grid: Parameters & Stage Execution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Configurable Weights & Thresholds (§10) */}
        <div className="space-y-4">
          <div className="bg-[#0d121c] border border-[#1c2638] rounded-lg p-4 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
              Harmonization Model (§10)
              <span className="text-[10px] text-blue-400 font-mono">Formula</span>
            </h2>

            {/* Threshold Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Auto-Verify Threshold</span>
                <span className="text-blue-400 font-mono font-semibold">{(threshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.99"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full accent-blue-500 bg-[#111724] h-1.5 rounded cursor-pointer"
              />
              <p className="text-[10px] text-slate-600">Scores below this value enter the Human Review Queue.</p>
            </div>

            {/* Weights Distribution */}
            <div className="border-t border-[#1c2638] pt-3 space-y-3">
              <span className="text-[11px] font-medium text-slate-300">Composite Score Weights:</span>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Spatial Weight (IoU)</span>
                  <span className="font-mono text-slate-200">{(spatialWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={spatialWeight}
                  onChange={(e) => setSpatialWeight(parseFloat(e.target.value))}
                  disabled={isProcessing}
                  className="w-full accent-blue-500 bg-[#111724] h-1.5 rounded"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Area Agreement</span>
                  <span className="font-mono text-slate-200">{(areaWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.05"
                  value={areaWeight}
                  onChange={(e) => setAreaWeight(parseFloat(e.target.value))}
                  disabled={isProcessing}
                  className="w-full accent-blue-500 bg-[#111724] h-1.5 rounded"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Attribute Similarity</span>
                  <span className="font-mono text-slate-200">{(attributeWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.60"
                  step="0.05"
                  value={attributeWeight}
                  onChange={(e) => setAttributeWeight(parseFloat(e.target.value))}
                  disabled={isProcessing}
                  className="w-full accent-blue-500 bg-[#111724] h-1.5 rounded"
                />
              </div>
            </div>

            {/* Execute Button */}
              <button
              onClick={handleRunPipeline}
              disabled={isProcessing || !hasDatasets}
              className={`w-full py-2.5 px-4 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isProcessing || !hasDatasets
                  ? 'bg-blue-600/40 text-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin text-sm">⟳</span> Harmonizing...
                </>
              ) : (
                <>
                  <span>▶</span> Run Harmonization Pipeline
                </>
              )}
            </button>

            {!hasDatasets && !datasetError && (
              <p className="text-[11px] text-amber-400/90 text-center">
                Upload cadastral and municipal GeoJSON datasets before processing.
              </p>
            )}
            {datasetError && <p className="text-[11px] text-red-400 text-center">Unable to load datasets: {datasetError}</p>}
          </div>
        </div>

        {/* Right Columns (2 cols wide): Pipeline Stages Tracker (§28) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-[#0d121c] border border-[#1c2638] rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center justify-between">
              <span>Pipeline Stage Execution (§28)</span>
              {isProcessing && (
                <span className="text-[10px] text-emerald-400 animate-pulse font-mono">
                  ACTIVE STAGE {currentStageIdx + 1}/{PIPELINE_STAGES.length}
                </span>
              )}
            </h2>

            <div className="space-y-3">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isDone = currentStageIdx > idx || processingResult !== null;
                const isRunning = isProcessing && currentStageIdx === idx;
                const isPending = !isDone && !isRunning;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-3 p-2.5 rounded border transition-all ${
                      isRunning
                        ? 'bg-blue-950/20 border-blue-500/50 text-slate-100'
                        : isDone
                        ? 'bg-[#111724]/60 border-emerald-500/20 text-slate-200'
                        : 'bg-[#090d14]/40 border-transparent text-slate-600'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      ) : isRunning ? (
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 flex items-center justify-center text-[10px] animate-spin">
                          ⟳
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[#111724] border border-[#1c2638] text-slate-600 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-medium ${isPending ? 'text-slate-600' : 'text-slate-200'}`}>
                          {stage.label}
                        </p>
                        {isDone && <span className="text-[10px] text-emerald-400 font-mono">COMPLETE</span>}
                        {isRunning && <span className="text-[10px] text-blue-400 font-mono animate-pulse">PROCESSING</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-950/30 border border-red-500/40 rounded text-xs text-red-400 flex items-center gap-2">
                <span>✗</span> Error: {errorMessage}
              </div>
            )}
          </div>

          {/* Result Banner (§29) */}
          {processingResult && (
            <div className="bg-[#0d121c] border border-emerald-500/40 rounded-lg p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <span>✓</span> Harmonization Complete (§29)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Unified dataset generated with PostGIS spatial indexing & conflict detection.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  {processingResult.records?.length || 0} Records Unified
                </span>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-[#111724] p-3 rounded border border-[#1c2638]">
                  <span className="text-[10px] text-slate-500 uppercase">Processed</span>
                  <p className="text-lg font-bold text-slate-200 tabular-nums">
                    {processingResult.metrics?.recordsProcessed ?? processingResult.records?.length}
                  </p>
                </div>
                <div className="bg-[#111724] p-3 rounded border border-[#1c2638]">
                  <span className="text-[10px] text-emerald-500 uppercase">Auto-Verified</span>
                  <p className="text-lg font-bold text-emerald-400 tabular-nums">
                    {processingResult.metrics?.autoVerifiedCount ?? 0}
                  </p>
                </div>
                <div className="bg-[#111724] p-3 rounded border border-[#1c2638]">
                  <span className="text-[10px] text-amber-500 uppercase">Review Required</span>
                  <p className="text-lg font-bold text-amber-400 tabular-nums">
                    {processingResult.metrics?.requiresReviewCount ?? 0}
                  </p>
                </div>
                <div className="bg-[#111724] p-3 rounded border border-[#1c2638]">
                  <span className="text-[10px] text-red-500 uppercase">Conflicts</span>
                  <p className="text-lg font-bold text-red-400 tabular-nums">
                    {processingResult.metrics?.conflictsCount ?? 0}
                  </p>
                </div>
              </div>

              {/* Action Navigation Buttons (§29) */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1c2638]">
                <button
                  onClick={() => navigate('/map')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors"
                >
                  View Unified Map →
                </button>
                <button
                  onClick={() => navigate('/records')}
                  className="px-4 py-2 bg-[#111724] hover:bg-[#1a2233] border border-[#2a3852] text-slate-200 text-xs font-semibold rounded transition-colors"
                >
                  View All Records →
                </button>
                {(processingResult.metrics?.requiresReviewCount > 0 || processingResult.metrics?.conflictsCount > 0) && (
                  <button
                    onClick={() => navigate('/review')}
                    className="px-4 py-2 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded transition-colors"
                  >
                    Review Conflicts Queue ({processingResult.metrics?.requiresReviewCount}) →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
