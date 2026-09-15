/**
 * Page 5 — Records Table (§15, §49 Page 5, §50)
 * Searchable, filterable unified land records table with multi-factor match explanations.
 */
import { startTransition, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../lib/ProjectContext.jsx';
import api from '../api/client.js';

export default function RecordsPage() {
  const { activeProject, selectedMatchId, setSelectedMatchId } = useProject();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');

  useEffect(() => {
    if (!activeProject?.id) return;
    startTransition(() => setLoading(true));
    api.getResults(activeProject.id)
      .then((res) => {
        setRecords(res.records || res.data?.records || []);
        setMetrics(res.metrics || res.data?.metrics || null);
      })
      .catch((err) => {
        console.error('Failed to load records:', err);
      })
      .finally(() => setLoading(false));
  }, [activeProject]);

  // Client-side filtering across search, status, and confidence range (§50)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Search term match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const pidMatch = (r.parcel_id || '').toLowerCase().includes(term);
        const ownerMatch = (r.owner_name || '').toLowerCase().includes(term);
        const bldgMatch = (r.building_id || '').toLowerCase().includes(term);
        const propertyMatch = (r.source_record_b || '').toLowerCase().includes(term);
        if (!pidMatch && !ownerMatch && !bldgMatch && !propertyMatch) return false;
      }

      // 2. Status filter
      if (statusFilter === 'VERIFIED') {
        if (r.status !== 'AUTO_VERIFIED' && r.status !== 'HUMAN_VERIFIED') return false;
      } else if (statusFilter === 'REVIEW') {
        if (r.status !== 'REQUIRES_REVIEW') return false;
      } else if (statusFilter === 'CONFLICTS') {
        if (!r.conflicts || r.conflicts.length === 0) return false;
      } else if (statusFilter === 'MISSING') {
        if (r.owner_name && r.area != null && r.building_id) return false;
      }

      // 3. Confidence range filter (§50: <90%, 90-95%, >95%)
      const conf = Number(r.confidence || 0);
      if (confidenceFilter === 'HIGH') {
        if (conf < 95) return false;
      } else if (confidenceFilter === 'MID') {
        if (conf < 90 || conf >= 95) return false;
      } else if (confidenceFilter === 'LOW') {
        if (conf >= 90) return false;
      }

      return true;
    });
  }, [records, searchTerm, statusFilter, confidenceFilter]);

  if (!activeProject) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c2638] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-blue-400">≡</span> Unified Land Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Harmonized entity registry with component scores & provenance for <span className="text-slate-300">{activeProject.name}</span>
          </p>
        </div>

        {metrics && (
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded bg-[#0d121c] border border-[#1c2638] text-slate-300">
              Total: <strong className="text-white">{metrics.matchedCount || records.length}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-400">
              Verified: <strong>{metrics.autoVerifiedCount + (metrics.humanVerifiedCount || 0)}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-950/30 border border-amber-500/30 text-amber-400">
              Review: <strong>{metrics.requiresReviewCount}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Filter Controls (§50) */}
      <div className="bg-[#0d121c] border border-[#1c2638] rounded-lg p-3.5 flex flex-wrap items-center gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-50">
          <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Search parcel, property, owner, or building ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#111724] border border-[#2a3852] rounded text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-[#111724] p-0.5 rounded border border-[#1c2638]">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'VERIFIED', label: 'Verified' },
            { id: 'REVIEW', label: 'Requires Review' },
            { id: 'CONFLICTS', label: 'Conflicts' },
            { id: 'MISSING', label: 'Missing Data' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id)}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                statusFilter === btn.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Confidence Filter Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Confidence:</span>
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            className="bg-[#111724] border border-[#2a3852] rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Scores</option>
            <option value="HIGH">&gt; 95% High Confidence</option>
            <option value="MID">90–95% Medium</option>
            <option value="LOW">&lt; 90% Uncertain</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-[#0d121c] border border-[#1c2638] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <span className="animate-spin">⟳</span> Loading harmonized records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            {records.length === 0
              ? 'No records processed yet. Go to the Processing page and run the engine.'
              : 'No records match your active search and filter criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#111724] border-b border-[#1c2638] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="px-3.5 py-2.5">Parcel ID</th>
                  <th className="px-3.5 py-2.5">Owner</th>
                  <th className="px-3.5 py-2.5">Area</th>
                  <th className="px-3.5 py-2.5">Building</th>
                  <th className="px-3.5 py-2.5">Sources</th>
                  <th className="px-3.5 py-2.5 text-center">Confidence</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Conflicts</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2638]">
                {filteredRecords.map((r) => {
                  const hasConflicts = r.conflicts && r.conflicts.length > 0;
                  const isVerified = r.status === 'AUTO_VERIFIED' || r.status === 'HUMAN_VERIFIED';

                  return (
                    <tr
                      key={r.match_id || r.parcel_id}
                      onClick={() => {
                        setSelectedMatchId(r.parcel_id || r.match_id);
                        navigate('/map');
                      }}
                      className={`cursor-pointer hover:bg-[#111724]/70 transition-colors ${
                        selectedMatchId === (r.parcel_id || r.match_id) ? 'bg-blue-950/30' : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-mono font-bold text-blue-400">
                        {r.parcel_id}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-200 font-medium">
                        {r.owner_name || <span className="text-slate-600 italic">None</span>}
                      </td>
                      <td className="px-3.5 py-2.5 tabular-nums text-slate-300 font-mono">
                        {r.area ? `${r.area} m²` : '—'}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-400">
                        {r.building_id || '—'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap gap-1 max-w-45">
                          {[r.source_record_a, r.source_record_b].filter(Boolean).map((source) => (
                            <span key={source} className="px-1.5 py-0.5 bg-[#111724] border border-[#2a3852] rounded text-[10px] font-mono text-slate-300">
                              {source}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`font-mono font-bold text-xs ${
                            r.confidence >= 90
                              ? 'text-emerald-400'
                              : r.confidence >= 70
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {r.confidence}%
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : r.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        {hasConflicts ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-950/30 border border-red-500/20 px-1.5 py-0.5 rounded"
                            title={r.conflicts.map((c) => (typeof c === 'string' ? c : c.description)).join('\n')}
                          >
                            <span>⚠</span> {r.conflicts.length}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">✓ none</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedMatchId(r.parcel_id || r.match_id);
                            navigate(r.status === 'REQUIRES_REVIEW' ? '/review' : '/map');
                          }}
                          className="text-blue-400 hover:text-blue-300 font-medium text-[11px]"
                        >
                          {r.status === 'REQUIRES_REVIEW' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
