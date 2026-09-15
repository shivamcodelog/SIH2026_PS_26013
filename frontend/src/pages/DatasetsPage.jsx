/**
 * Page 2 — Datasets
 * Shows uploaded datasets with name/source/CRS/record count/status (§49 Page 2).
 * Upload UI: one control per dataset type with real status/error/success states (§27).
 */
import { startTransition, useEffect, useState, useRef, useCallback } from 'react';
import { useProject } from '../lib/ProjectContext.jsx';
import api from '../api/client.js';

const SOURCE_TYPES = [
  { key: 'CADASTRAL', label: 'Cadastral Dataset',      desc: 'Parcel/land ownership records',    icon: '⊞' },
  { key: 'MUNICIPAL', label: 'Municipal Dataset',      desc: 'Property tax / municipal records', icon: '⊡' },
  { key: 'DRONE',     label: 'Drone Building Dataset', desc: 'Building footprints from survey',  icon: '◈' },
];

const STATUS_STYLE = {
  UPLOADED:   'text-blue-400 bg-blue-900/20 border-blue-500/30',
  NORMALIZED: 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30',
  ERROR:      'text-red-400 bg-red-900/20 border-red-500/30',
};

function DatasetRow({ ds }) {
  return (
    <tr className="border-b border-[#1c2638] hover:bg-[#111724] transition-colors">
      <td className="px-4 py-3 text-sm text-slate-300">{ds.name}</td>
      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{ds.source_type}</td>
      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{ds.crs || '—'}</td>
      <td className="px-4 py-3 text-sm tabular-nums text-slate-400">{(ds.record_count || 0).toLocaleString()}</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_STYLE[ds.status] || 'text-slate-500 border-slate-600/30'}`}>
          {ds.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
        {ds.uploaded_at ? new Date(ds.uploaded_at).toLocaleDateString() : '—'}
      </td>
    </tr>
  );
}

function UploadCard({ sourceType, projectId, onUploaded }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [message, setMessage] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
      setStatus('error');
      setMessage('Only GeoJSON files are supported');
      return;
    }
    setStatus('uploading');
    setMessage('');
    setAiSuggestions(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sourceType', sourceType.key);
      fd.append('name', `${sourceType.label} — ${file.name}`);
      
      // Attempt to read file to get headers for AI
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const properties = json.features?.[0]?.properties || {};
          const headers = Object.keys(properties);
          const aiRes = await api.getSchemaMappingSuggestions(headers);
          if (aiRes.suggestions && Object.keys(aiRes.suggestions).length > 0) {
            setAiSuggestions(aiRes.suggestions);
          }
        } catch (err) {
          console.warn('Could not parse GeoJSON for AI suggestions');
        }
      };
      reader.readAsText(file.slice(0, 1024 * 50)); // read first 50kb for speed

      await api.addDataset(projectId, fd);
      setStatus('success');
      setMessage(`Uploaded: ${file.name}`);
      onUploaded();
    } catch (e) {
      setStatus('error');
      setMessage(e.message || 'Upload failed');
    }
  }, [sourceType, projectId, onUploaded]);

  const handleChange = (e) => handleFile(e.target.files?.[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };
  const handleDragOver = (e) => e.preventDefault();

  const borderColor = status === 'success' ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' :
                      status === 'error'   ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' :
                      status === 'uploading' ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-[#2a3852] hover:border-[#3b4b68] hover:shadow-lg hover:-translate-y-0.5';

  return (
    <div
      className={`backdrop-blur-md bg-[#0d121c]/80 border rounded-xl p-5 transition-all duration-300 ${borderColor}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#111724] border border-[#2a3852] text-xl text-slate-300 shadow-inner">{sourceType.icon}</span>
        <div>
          <p className="text-sm font-semibold text-slate-200">{sourceType.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{sourceType.desc}</p>
        </div>
      </div>

      {status === 'uploading' && (
        <div className="flex items-center gap-2 text-sm text-blue-400 mb-3 font-medium">
          <span className="animate-spin">⟳</span> Uploading…
        </div>
      )}
      {status === 'success' && (
        <div className="mb-3 space-y-2">
          <p className="text-xs text-emerald-400 font-medium">✓ {message}</p>
          {aiSuggestions && (
            <div className="p-2.5 rounded-lg bg-[#111724] border border-blue-900/40 mt-2">
              <h4 className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                AI Schema Mapping
              </h4>
              <ul className="text-xs text-slate-300 space-y-1 font-mono">
                {Object.entries(aiSuggestions).map(([from, to]) => (
                  <li key={from} className="flex items-center gap-2">
                    <span className="opacity-60 truncate w-16">{from}</span> 
                    <span className="text-blue-500/50">→</span> 
                    <span className="text-blue-300 truncate">{to}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[9px] text-slate-500 mt-1.5">Auto-mapped by AI Assistant</p>
            </div>
          )}
        </div>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 mb-3 font-medium">✗ {message}</p>
      )}

      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading'}
        className={`w-full py-2.5 rounded-lg border text-sm font-medium transition-all duration-200
          ${status === 'uploading'
            ? 'border-[#2a3852] text-slate-600 bg-[#111724]/50 cursor-not-allowed'
            : 'border-[#2a3852] bg-[#111724]/50 text-slate-300 hover:border-blue-500/50 hover:text-white hover:bg-blue-500/10'
          }`}
      >
        {status === 'success' ? 'Replace File' : 'Upload GeoJSON'}
      </button>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-3 text-center opacity-70">Drag & drop or click</p>

      <input
        ref={inputRef}
        type="file"
        accept=".geojson,.json"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export default function DatasetsPage() {
  const { activeProject } = useProject();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDatasets = useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getDatasets(activeProject.id);
      setDatasets(res.datasets || res.data?.datasets || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => { startTransition(() => loadDatasets()); }, [loadDatasets]);

  if (!activeProject) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-slate-600">
        <p className="text-4xl mb-3">⊡</p>
        <p className="text-sm">Select or create a project on the Dashboard first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Datasets</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload and manage geospatial source files for <span className="text-slate-300">{activeProject.name}</span></p>
      </div>

      {/* Upload cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {SOURCE_TYPES.map((st) => (
          <UploadCard
            key={st.key}
            sourceType={st}
            projectId={activeProject.id}
            onUploaded={loadDatasets}
          />
        ))}
      </div>

      {/* Dataset table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-widest text-slate-600">Uploaded Datasets</h2>
          <button onClick={loadDatasets} className="text-xs text-slate-600 hover:text-slate-400">↻ Refresh</button>
        </div>

        {loading && <p className="text-sm text-slate-600">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && datasets.length === 0 && (
          <div className="text-center py-12 border border-dashed border-[#1c2638] rounded-lg">
            <p className="text-slate-600 text-sm">No datasets uploaded yet.</p>
          </div>
        )}

        {datasets.length > 0 && (
          <div className="bg-[#0d121c] border border-[#1c2638] rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1c2638] bg-[#111724]">
                  <th className="px-4 py-2.5 text-xs uppercase tracking-widest text-slate-600">Name</th>
                  <th className="px-4 py-2.5 text-xs uppercase tracking-widest text-slate-600">Source</th>
                  <th className="px-4 py-2.5 text-xs uppercase tracking-widest text-slate-600">CRS</th>
                  <th className="px-4 py-2.5 text-xs uppercase tracking-widest text-slate-600">Records</th>
                  <th className="px-4 py-2.5 text-xs uppercase tracking-widest text-slate-600">Status</th>
                  <th className="px-4 py-2.5 text-xs uppercase tracking-widest text-slate-600">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds) => <DatasetRow key={ds.id} ds={ds} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
