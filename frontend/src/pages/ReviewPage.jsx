/**
 * Page 6 — Human Review Queue (§11, §30, §31)
 * Adjudication interface for records requiring human verification.
 * Features side-by-side source comparison, component score breakdowns, and decision actions.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../lib/ProjectContext.jsx';
import api from '../api/client.js';

export default function ReviewPage() {
  const { activeProject, refreshActiveProject } = useProject();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewerName, setReviewerName] = useState('Survey Officer Sharma');
  const [reviewComment, setReviewComment] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Fetch all records requiring review
  const loadReviewQueue = async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getResults(activeProject.id, { status: 'REQUIRES_REVIEW' });
      const recs = res.records || res.data?.records || [];
      setRecords(recs);
      if (recs.length > 0 && !selectedRecordId) {
        setSelectedRecordId(recs[0].match_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load review queue');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewQueue();
  }, [activeProject]);

  const activeRecord = useMemo(() => {
    return records.find((r) => r.match_id === selectedRecordId) || records[0] || null;
  }, [records, selectedRecordId]);

  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!activeRecord) {
      setAiExplanation('');
      return;
    }
    setAiLoading(true);
    api.getConflictExplanation(activeRecord)
      .then(res => {
        setAiExplanation(res.data?.explanation || res.explanation || 'Explanation unavailable.');
      })
      .catch(err => {
        console.error('AI Error:', err);
        setAiExplanation('Failed to fetch AI explanation.');
      })
      .finally(() => setAiLoading(false));
  }, [activeRecord]);

  // Handle adjudication decision submission
  const handleDecision = async (decisionType) => {
    if (!activeRecord) return;
    setSubmitting(true);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await api.postDecision(activeRecord.match_id, {
        decision: decisionType,
        reviewer: reviewerName.trim() || 'Survey Officer',
        comment: reviewComment.trim(),
      });

      setActionSuccess(`Record ${activeRecord.parcel_id} adjudicated as ${res.matchStatus || decisionType}`);
      setReviewComment('');

      // Refresh queue and project metrics
      await loadReviewQueue();
      await refreshActiveProject();
    } catch (err) {
      setActionError(err.message || 'Failed to submit review decision');
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-amber-400">◉</span> Human-in-the-Loop Adjudication Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Resolve boundary, area, and ownership discrepancies for <span className="text-slate-300">{activeProject.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-amber-950/30 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            {records.length} Pending Review
          </span>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded text-xs text-emerald-300 flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-950/30 border border-red-500/40 rounded text-xs text-red-300 flex items-center justify-between">
          <span>✗ Error: {actionError}</span>
          <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <span className="animate-spin">⟳</span> Loading review queue...
        </div>
      ) : error ? (
        <div className="bg-[#0d121c] border border-red-500/50 rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <span className="text-3xl text-red-500 mb-3">⚠</span>
          <h3 className="text-sm font-semibold text-red-400 mb-1">{error}</h3>
          <p className="text-xs text-slate-500 max-w-md">
            Could not retrieve review queue from the backend database. Ensure the Node server and PostgreSQL are running.
          </p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-[#0d121c] border border-[#1c2638] rounded-lg p-12 text-center space-y-3">
          <span className="text-3xl text-emerald-400">✓</span>
          <h3 className="text-sm font-semibold text-slate-200">Zero Unresolved Discrepancies</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All land records in this project are either auto-verified by the matching engine or have been human-adjudicated.
          </p>
          <button
            onClick={() => navigate('/map')}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors"
          >
            Explore Unified Map →
          </button>
        </div>
      ) : (
        /* Review Queue Split Layout */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Queue List (§30) */}
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Uncertain Cases ({records.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {records.map((r) => {
                const isSelected = activeRecord?.match_id === r.match_id;
                const conf = Number(r.confidence || 0);

                return (
                  <button
                    key={r.match_id}
                    onClick={() => {
                      setSelectedRecordId(r.match_id);
                      setActionSuccess('');
                      setActionError('');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-[#111724] border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-[#0d121c] border-[#1c2638] hover:border-[#2a3852]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-200">{r.parcel_id}</span>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          conf >= 70 ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {conf}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">{r.owner_name || 'Unknown'}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {r.conflicts && r.conflicts.length > 0 ? (
                        r.conflicts.slice(0, 2).map((c, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/40 border border-red-500/20 text-red-300 uppercase font-mono"
                          >
                            {typeof c === 'string' ? c : c.type}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-amber-400">Low Confidence Match</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Columns: Comparison & Decision Panel (§11, §31) */}
          <div className="md:col-span-2 space-y-5">
            {activeRecord && (
              <div className="bg-[#0d121c]/90 backdrop-blur-md border border-[#1c2638] rounded-xl p-6 space-y-5 shadow-lg">
                {/* Header of Active Record */}
                <div className="flex items-center justify-between border-b border-[#1c2638] pb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span className="opacity-70">Comparison Dossier:</span>
                      <span className="text-blue-400 font-mono text-lg bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{activeRecord.parcel_id}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Cross-source comparison between Cadastral Survey and Municipal Records
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-0.5">Composite Score</span>
                    <p
                      className={`text-2xl font-bold font-mono px-3 py-1 rounded-md border ${
                        activeRecord.confidence >= 70 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      {activeRecord.confidence}%
                    </p>
                  </div>
                </div>

                {/* Side-by-Side Source Comparison Table (§31) */}
                <div className="border border-[#1c2638] rounded-lg overflow-hidden shadow-inner bg-[#090d14]/50">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#111724]/80 border-b border-[#1c2638] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="px-4 py-3 text-left w-1/4 border-r border-[#1c2638]/50">Attribute</th>
                        <th className="px-4 py-3 text-left w-3/8 text-blue-400 border-r border-[#1c2638]/50">Cadastral Record</th>
                        <th className="px-4 py-3 text-left w-3/8 text-emerald-400">Municipal Record</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c2638] font-mono">
                      <tr>
                        <td className="px-4 py-2.5 font-sans font-medium text-slate-500">Record ID</td>
                        <td className="px-4 py-2.5 text-slate-200">{activeRecord.source_record_a || activeRecord.parcel_id}</td>
                        <td className="px-4 py-2.5 text-slate-200">{activeRecord.source_record_b || 'No Matching ID'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-sans font-medium text-slate-500">Owner Name</td>
                        <td className="px-4 py-2.5 text-slate-200">{activeRecord.owner_name || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-200">
                          {activeRecord.owner_name_b || activeRecord.owner_name || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-sans font-medium text-slate-500">Declared Area</td>
                        <td className="px-4 py-2.5 text-slate-200">{activeRecord.area ? `${activeRecord.area} m²` : '—'}</td>
                        <td className="px-4 py-2.5 text-slate-200">
                          {activeRecord.area_b ? `${activeRecord.area_b} m²` : activeRecord.area ? `${activeRecord.area} m²` : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-sans font-medium text-slate-500">Geometry</td>
                        <td className="px-4 py-2.5 text-slate-400">Polygon A (Survey Footprint)</td>
                        <td className="px-4 py-2.5 text-slate-400">
                          {activeRecord.source_record_b ? 'Polygon B (Tax Assessment Bound)' : 'Missing Geometry'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* AI Conflict Explanation (Mission 16) */}
                <div className="bg-[#111724]/60 border border-blue-900/30 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
                  <h3 className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                    AI Assistant Explanation
                  </h3>
                  {aiLoading ? (
                    <p className="text-sm text-slate-500 italic animate-pulse">Analyzing conflicts and compiling explanation...</p>
                  ) : (
                    <p className="text-sm text-slate-300 leading-relaxed font-serif tracking-wide">{aiExplanation || 'No explanation available.'}</p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide opacity-70">
                    * AI suggestions are non-authoritative. Final decision requires human verification.
                  </p>
                </div>

                {/* Score Breakdown Bars (§10, §31) */}
                <div className="bg-[#111724] border border-[#1c2638] rounded-lg p-4 space-y-3">
                  <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Component Similarity Explanation (§10)
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Spatial (IoU):</span>
                        <span className="font-mono text-slate-200">
                          {activeRecord.spatial_score !== undefined
                            ? `${(Number(activeRecord.spatial_score) * 100).toFixed(0)}%`
                            : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-[#090d14] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(Number(activeRecord.spatial_score || 0) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Area Agreement:</span>
                        <span className="font-mono text-slate-200">
                          {activeRecord.area_score !== undefined
                            ? `${(Number(activeRecord.area_score) * 100).toFixed(0)}%`
                            : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-[#090d14] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.min(Number(activeRecord.area_score || 0) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Attribute Fuzzy:</span>
                        <span className="font-mono text-slate-200">
                          {activeRecord.attribute_score !== undefined
                            ? `${(Number(activeRecord.attribute_score) * 100).toFixed(0)}%`
                            : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-[#090d14] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${Math.min(Number(activeRecord.attribute_score || 0) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detected Conflicts */}
                {activeRecord.conflicts && activeRecord.conflicts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] uppercase tracking-wider text-red-400 font-semibold">
                      Flagged Conflicts ({activeRecord.conflicts.length})
                    </h3>
                    <div className="space-y-2">
                      {activeRecord.conflicts.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 rounded bg-red-950/20 border border-red-500/30 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-red-400">
                              {typeof c === 'string' ? c : c.type}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/40 text-red-300 font-mono">
                              {c.severity || 'HIGH'}
                            </span>
                          </div>
                          {c.description && <p className="text-slate-300">{c.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Adjudication Input Controls (§11) */}
                <div className="border-t border-[#1c2638] pt-4 space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Officer Adjudication Actions
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-500 font-medium mb-1 block">Reviewer Name</label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#111724] border border-[#2a3852] rounded text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium mb-1 block">Review Notes / Audit Trail</label>
                      <input
                        type="text"
                        placeholder="e.g., On-ground inspection confirms municipal area typo."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#111724] border border-[#2a3852] rounded text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Decision Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleDecision('RESOLVE')}
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : '✓ Resolve & Harmonize'}
                    </button>
                    <button
                      onClick={() => handleDecision('ACCEPT')}
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Accept Cadastral
                    </button>
                    <button
                      onClick={() => handleDecision('REJECT')}
                      disabled={submitting}
                      className="py-2 px-4 rounded bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Reject Match
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
