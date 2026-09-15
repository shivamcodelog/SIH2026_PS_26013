/**
 * ProjectContext — lightweight global state for the active project.
 * Components read activeProject / setActiveProject via useProject().
 */
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client.js';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [activeProject, setActiveProject] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProjects();
      setProjects(res.projects || res.data?.projects || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectProject = useCallback(async (id) => {
    if (activeProject?.id === id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProject(id);
      setActiveProject(res.project || res.data?.project || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  const refreshActiveProject = useCallback(async () => {
    if (!activeProject?.id) return;
    try {
      const res = await api.getProject(activeProject.id);
      setActiveProject(res.project || res.data?.project || null);
    } catch {
      // silent refresh failure
    }
  }, [activeProject]);

  return (
    <ProjectContext.Provider value={{
      activeProject, setActiveProject,
      selectedMatchId, setSelectedMatchId,
      projects, setProjects,
      loading, error,
      loadProjects, selectProject, refreshActiveProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
