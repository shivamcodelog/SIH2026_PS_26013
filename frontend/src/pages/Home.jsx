import React, { useState } from 'react';
import Header from '../components/Header';
import WebGISMap from '../map/WebGISMap';
import LayerControlPanel from '../components/LayerControlPanel';
import EntityInspectorPanel from '../components/EntityInspectorPanel';
import TelemetryBar from '../components/TelemetryBar';
import ReviewQueueView from '../components/ReviewQueueView';
import AuditTelemetryView from '../components/AuditTelemetryView';
import { useHealth } from '../hooks/useHealth';

export default function Home() {
  const { health, loading } = useHealth();
  const [activeView, setActiveView] = useState('map'); // 'map' | 'review' | 'telemetry'
  const [activeLayers, setActiveLayers] = useState({
    cadastral: true,
    municipal: true,
    drone: true,
    conflictsOnly: false
  });
  const [selectedPairId, setSelectedPairId] = useState('HARM-PAIR-01');
  const [coords, setCoords] = useState({ lat: '28.62800', lng: '77.21800', zoom: 16 });
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const handleInspectPairFromQueue = (pairId) => {
    setSelectedPairId(pairId);
    setActiveView('map');
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#07090e] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Tactical Command & Telemetry Header */}
      <Header
        health={health}
        loading={loading}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* 2. Main Workstation Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeView === 'map' && (
          <>
            {/* Left Geospatial Layers & Dataset Dock */}
            <LayerControlPanel
              activeLayers={activeLayers}
              setActiveLayers={setActiveLayers}
              selectedPairId={selectedPairId}
              onSelectPair={setSelectedPairId}
              isCollapsed={isLeftCollapsed}
              onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
            />

            {/* Central WebGIS Map Canvas */}
            <div className="flex-1 h-full relative overflow-hidden">
              <WebGISMap
                activeLayers={activeLayers}
                selectedPairId={selectedPairId}
                onSelectPair={setSelectedPairId}
                onCoordsChange={setCoords}
              />
            </div>

            {/* Right Entity Inspector & Adjudication Dock */}
            <EntityInspectorPanel
              selectedPairId={selectedPairId}
              isCollapsed={isRightCollapsed}
              onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
            />
          </>
        )}

        {activeView === 'review' && (
          <ReviewQueueView onInspectPair={handleInspectPairFromQueue} />
        )}

        {activeView === 'telemetry' && (
          <AuditTelemetryView health={health} />
        )}
      </main>

      {/* 3. Bottom Cartographic Coordinates & Telemetry Bar */}
      <TelemetryBar coords={coords} />
    </div>
  );
}
