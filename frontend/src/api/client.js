/**
 * API client — React talks only to Node.js API Gateway (never directly to FastAPI)
 * Architecture: React → Node (port 5000) → FastAPI (port 8000)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = await res.json();
  if (!res.ok) {
    const msg = body?.error?.message || body?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// ── Health ────────────────────────────────────────────────────────────────────
export async function checkNodeHealth() {
  try {
    return await request('/health');
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export const api = {
  health: () => request('/health'),

  // ── Projects ───────────────────────────────────────────────────────────────
  getProjects: () => request('/projects'),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getProject: (id) => request(`/projects/${id}`),

  // ── Datasets ───────────────────────────────────────────────────────────────
  getDatasets: (projectId) => request(`/projects/${projectId}/datasets`),
  addDataset: (projectId, formData) =>
    fetch(`${API_BASE}/projects/${projectId}/datasets`, { method: 'POST', body: formData }).then(async (r) => {
      const b = await r.json();
      if (!r.ok) { const e = new Error(b?.error?.message || `HTTP ${r.status}`); e.status = r.status; throw e; }
      return b;
    }),

  // ── Processing ─────────────────────────────────────────────────────────────
  processProject: (projectId, options = {}) =>
    request(`/projects/${projectId}/process`, { method: 'POST', body: JSON.stringify(options) }),

  // ── Results ────────────────────────────────────────────────────────────────
  getResults: (projectId, filters = {}) => {
    const q = new URLSearchParams();
    if (filters.status) q.set('status', filters.status);
    if (filters.search) q.set('search', filters.search);
    return request(`/projects/${projectId}/results?${q}`);
  },

  // ── Conflicts ──────────────────────────────────────────────────────────────
  getConflicts: (projectId, filters = {}) => {
    const q = new URLSearchParams();
    if (filters.resolved !== undefined) q.set('resolved', filters.resolved);
    if (filters.severity) q.set('severity', filters.severity);
    return request(`/projects/${projectId}/conflicts?${q}`);
  },

  // ── Map ────────────────────────────────────────────────────────────────────
  getMap: (projectId) => request(`/projects/${projectId}/map`),

  // ── Reviews ────────────────────────────────────────────────────────────────
  postDecision: (matchId, body) =>
    request(`/reviews/${matchId}/decision`, { method: 'POST', body: JSON.stringify(body) }),
};

export default api;
