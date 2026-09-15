/**
 * API client — React talks only to Node.js API Gateway (never directly to FastAPI)
 * Architecture: React → Node (port 5000) → FastAPI (port 8000)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function readResponseBody(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { return await res.json(); } catch { return null; }
  }
  const text = await res.text();
  return text ? { message: text } : null;
}

function getErrorMessage(body, fallback) {
  if (typeof body?.error === 'string') return body.error;
  return body?.error?.message || body?.message || fallback;
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    const error = new Error('Node API unavailable. Start node-server and try again.');
    error.code = 'NODE_UNAVAILABLE';
    throw error;
  }
  const body = await readResponseBody(res);
  if (!res.ok) {
    const err = new Error(getErrorMessage(body, `Request failed (HTTP ${res.status}).`));
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
    fetch(`${API_BASE}/projects/${projectId}/datasets`, { method: 'POST', body: formData })
      .catch(() => {
        const error = new Error('Node API unavailable. Start node-server and try again.');
        error.code = 'NODE_UNAVAILABLE';
        throw error;
      })
      .then(async (r) => {
        const body = await readResponseBody(r);
        if (!r.ok) {
          const error = new Error(getErrorMessage(body, `Upload failed (HTTP ${r.status}).`));
          error.status = r.status;
          error.body = body;
          throw error;
        }
        return body;
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
