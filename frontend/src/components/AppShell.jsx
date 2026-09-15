/**
 * AppShell — sidebar navigation + main content area.
 * Navigation: Dashboard | Datasets | Processing | Unified Map | Records | Review
 * Matches the §48 layout spec exactly.
 */
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useProject } from '../lib/ProjectContext.jsx';
import { checkNodeHealth } from '../api/client.js';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',    icon: '⊞' },
  { to: '/datasets',  label: 'Datasets',     icon: '⊡' },
  { to: '/processing',label: 'Processing',   icon: '⚙' },
  { to: '/map',       label: 'Unified Map',  icon: '◈' },
  { to: '/records',   label: 'Records',      icon: '≡' },
  { to: '/review',    label: 'Review',       icon: '◉' },
];

function StatusDot({ connected }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${connected ? 'bg-emerald-400' : 'bg-red-500'}`}
      title={connected ? 'Online' : 'Offline'}
    />
  );
}

export default function AppShell() {
  const { activeProject } = useProject();
  const navigate = useNavigate();
  const [apiHealth, setApiHealth] = useState({ loading: true, connected: false });

  useEffect(() => {
    checkNodeHealth()
      .then((health) => setApiHealth({ loading: false, connected: health.success === true, error: health.error }))
      .catch((error) => setApiHealth({ loading: false, connected: false, error: error.message }));
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#07090e] text-slate-200 overflow-hidden font-sans">
      {/* ── Top header bar ───────────────────────────────────────────────── */}
      <header className="shrink-0 h-11 flex items-center px-4 border-b border-[#1c2638] bg-[#0d121c]">
        <span className="text-sm font-semibold tracking-widest text-slate-300 uppercase">
          LandHarmonize
        </span>
        {activeProject && (
          <>
            <span className="mx-2 text-[#2a3852]">›</span>
            <span className="text-sm text-slate-400 truncate max-w-60">{activeProject.name}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
          <StatusDot connected={apiHealth.connected} />
          <span title={apiHealth.error || 'Node API connected'}>{apiHealth.loading ? 'API CHECKING' : apiHealth.connected ? 'API ONLINE' : 'API OFFLINE'}</span>
        </div>
      </header>

      {/* ── Body: sidebar + main ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-40 shrink-0 flex flex-col border-r border-[#1c2638] bg-[#0d121c] py-3 gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors rounded-none
                 ${isActive
                  ? 'bg-[#111724] text-blue-400 border-r-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111724]'
                 }`
              }
            >
              <span className="text-base leading-none opacity-80">{icon}</span>
              {label}
            </NavLink>
          ))}

          {/* Project selector at bottom */}
          <div className="mt-auto px-3 pt-3 border-t border-[#1c2638]">
            <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">Project</p>
            {activeProject ? (
              <div className="text-xs text-slate-400 truncate" title={activeProject.name}>
                {activeProject.name}
              </div>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Select project
              </button>
            )}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#07090e]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
