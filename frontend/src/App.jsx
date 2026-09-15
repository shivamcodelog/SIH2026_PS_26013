/**
 * Frontend Root Application
 * Configures React Router and Project Context Provider with the 6 core pages (§18)
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './lib/ProjectContext.jsx';
import AppShell from './components/AppShell.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DatasetsPage from './pages/DatasetsPage.jsx';
import ProcessingPage from './pages/ProcessingPage.jsx';
import UnifiedMapPage from './pages/UnifiedMapPage.jsx';
import RecordsPage from './pages/RecordsPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/datasets" element={<DatasetsPage />} />
            <Route path="/processing" element={<ProcessingPage />} />
            <Route path="/map" element={<UnifiedMapPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  );
}
