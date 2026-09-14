/**
 * Page 1 — Dashboard
 * Pulls real metrics from /api/projects/:id (§26).
 * Shows project selector when no active project.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../lib/ProjectContext.jsx';
import api from '../api/client.js';

function MetricCard({ label, value, sub, accent }) {
  const colors = {
    blue: 'border-blue-500/40 text-blue-400',
    green: 'border-emerald-500/40 text-emerald-400',
    amber: 'border-amber-500/40 text-amber-400',
    red: 'border-red-500/40 text-red-400',
    slate: 'border-slate-600/40 text-slate-300',
  };
  return (
    <div className={`bg-[#0d121c] border rounded-lg p-5 flex flex-col gap-1 border-l-2 ${colors[accent] || colors.slate}`}>
      <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${colors[accent]?.split(' ')[1] || 'text-slate-200'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function ProjectCard({ project, onSelect, isActive }) {
  return (
    <button
      onClick={() => onSelect(project.id)}
      className={`w-full text-left bg-[#0d121c] border rounded-lg p-4 transition-all hover:border-blue-500/50 hover:bg-[#111724]
        ${isActive ? 'border-blue-500/60 ring-1 ring-blue-500/20' : 'border-[#1c2638]'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-200 truncate">{project.name}</span>
        {isActive && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">Active</span>}
      </div>
      {project.description && <p className="text-xs text-slate-500 mb-2 truncate">{project.description}</p>}
      <div className="flex gap-4 text-xs text-slate-600">
        <span>{project.datasets_count ?? 0} datasets</span>
        <span>{project.matches_count ?? 0} matches</span>
        <span>{project.conflicts_count ?? 0} conflicts</span>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { activeProject, projects, loading, error, loadProjects, selectProject, refreshActiveProject } = useProject();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (!activeProject?.id) { setMetrics(null); return; }
    setMetricsLoading(true);
    api.getProject(activeProject.id)
      .then((r) => setMetrics(r.project?.metrics || r.data?.project?.metrics || null))
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));
  }, [activeProject]);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    if (!newName.trim()) { setCreateError('Project name is required'); return; }
    setCreateError('');
    try {
      const res = await api.createProject({ name: newName.trim(), description: newDesc.trim() });
      const created = res.project || res.data?.project;
      await loadProjects();
      if (created?.id) { await selectProject(created.id); }
      setNewName('');
      setNewDesc('');
      setCreating(false);
    } catch (e) {
      setCreateError(e.message);
    }
  }, [newName, newDesc, loadProjects, selectProject]);

  const confidence = metrics
    ? Math.round(((metrics.auto_verified_count || 0) / Math.max(metrics.matched_count || 1, 1)) * 100)
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Geospatial Data Harmonization Platform — SIH26013</p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Create Project form */}
      {creating && (
        <form onSubmit={handleCreate} className="bg-[#0d121c] border border-[#2a3852] rounded-lg p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">New Project</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Project name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-[#111724] border border-[#2a3852] rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-[#111724] border border-[#2a3852] rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            {createError && <p className="text-xs text-red-400">{createError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors">
                Create
              </button>
              <button type="button" onClick={() => { setCreating(false); setCreateError(''); }} className="px-4 py-2 bg-transparent border border-[#2a3852] text-slate-400 text-sm rounded-md hover:border-slate-500">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Projects list */}
      {loading && <p className="text-sm text-slate-500">Loading projects…</p>}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {!loading && projects.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <p className="text-4xl mb-3">◈</p>
          <p className="text-sm">No projects yet. Create one to begin.</p>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-slate-600 mb-3">Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onSelect={selectProject}
                isActive={activeProject?.id === p.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dashboard metrics (shown when project is active) */}
      {activeProject && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-widest text-slate-600">Processing Summary</h2>
            <button onClick={refreshActiveProject} className="text-xs text-slate-600 hover:text-slate-400">↻ Refresh</button>
          </div>
          {metricsLoading ? (
            <p className="text-sm text-slate-600">Loading metrics…</p>
          ) : metrics ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <MetricCard label="Datasets" value={metrics.datasets_count ?? 0} accent="blue" />
              <MetricCard label="Records Processed" value={(metrics.records_processed ?? 0).toLocaleString()} accent="slate" />
              <MetricCard label="Matched" value={(metrics.matched_count ?? 0).toLocaleString()} accent="green" />
              <MetricCard label="Conflicts" value={metrics.conflicts_count ?? 0} accent="amber" />
              <MetricCard label="Human Review" value={metrics.requires_review_count ?? 0} accent="red" />
              <MetricCard
                label="Auto-Verified"
                value={confidence !== null ? `${confidence}%` : '—'}
                sub="high-confidence matches"
                accent="green"
              />
            </div>
          ) : (
            <p className="text-sm text-slate-600 mb-6">No processing results yet. Upload datasets and run processing.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/datasets')}
              className="px-4 py-2 bg-[#111724] border border-[#2a3852] text-sm text-slate-300 rounded-md hover:border-blue-500/50 transition-colors"
            >
              Upload Datasets →
            </button>
            {metrics && metrics.matched_count > 0 && (
              <>
                <button onClick={() => navigate('/map')} className="px-4 py-2 bg-[#111724] border border-[#2a3852] text-sm text-slate-300 rounded-md hover:border-blue-500/50 transition-colors">
                  View Unified Map →
                </button>
                <button onClick={() => navigate('/records')} className="px-4 py-2 bg-[#111724] border border-[#2a3852] text-sm text-slate-300 rounded-md hover:border-blue-500/50 transition-colors">
                  View All Records →
                </button>
                {metrics.requires_review_count > 0 && (
                  <button onClick={() => navigate('/review')} className="px-4 py-2 bg-red-900/30 border border-red-500/40 text-sm text-red-400 rounded-md hover:bg-red-900/50 transition-colors">
                    Review {metrics.requires_review_count} Conflicts →
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
