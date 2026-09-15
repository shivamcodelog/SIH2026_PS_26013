/**
 * API client — React talks only to Node.js API Gateway (never directly to FastAPI)
 * Architecture: React → Node (port 5000) → FastAPI (port 8000)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (err) {
    // Catch completely failed requests (e.g. Node server down, ECONNREFUSED)
    const error = new Error('Node Server Unavailable. Please check if the backend is running.');
    error.status = 503;
    error.body = { error: 'Node Server Unavailable' };
    throw error;
  }

  const body = await res.json().catch(() => ({})); // Handle empty/non-JSON bodies gracefully
  if (!res.ok) {
    const msg = body?.error?.message || body?.error || body?.message || `HTTP ${res.status}`;
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
  addDataset: async (projectId, formData) => {
    let r;
    try {
      r = await fetch(`${API_BASE}/projects/${projectId}/datasets`, { method: 'POST', body: formData });
    } catch (err) {
      const error = new Error('Node Server Unavailable. Please check if the backend is running.');
      error.status = 503;
      error.body = { error: 'Node Server Unavailable' };
      throw error;
    }
    const b = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = b?.error?.message || b?.error || b?.message || `HTTP ${r.status}`;
      const e = new Error(msg);
      e.status = r.status;
      throw e;
    }
    return b;
  },

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
  getMap: async (projectId) => {
    return request(`/projects/${projectId}/map`);
  },

  downloadGeoJSON: async (projectId) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/export/geojson`);
    if (!response.ok) throw new Error('Failed to download GeoJSON');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_${projectId}_unified.geojson`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadCSV: async (projectId) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/export/csv`);
    if (!response.ok) throw new Error('Failed to download CSV');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_${projectId}_results.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // ── Reviews ────────────────────────────────────────────────────────────────
  postDecision: (matchId, body) =>
    request(`/reviews/${matchId}/decision`, { method: 'POST', body: JSON.stringify(body) }),

  // ── AI Assistance ──────────────────────────────────────────────────────────
  getConflictExplanation: (recordData) =>
    request(`/ai/explain-conflict`, { method: 'POST', body: JSON.stringify({ recordData }) }),
    
  getSchemaMappingSuggestions: (headers) =>
    request(`/ai/suggest-mapping`, { method: 'POST', body: JSON.stringify({ headers }) }),
};

export default api;
