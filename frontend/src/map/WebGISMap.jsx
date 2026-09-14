import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MAP_CENTER,
  DEFAULT_ZOOM,
  CADASTRAL_DATASET,
  MUNICIPAL_DATASET,
  DRONE_BUILDING_DATASET,
  HARMONIZATION_PAIRS
} from './mockGeoData';

export default function WebGISMap({
  activeLayers = { cadastral: true, municipal: true, drone: true, conflictsOnly: false },
  selectedPairId,
  onSelectPair,
  onCoordsChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoLayersRef = useRef({});
  const [basemap, setBasemap] = useState('dark');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MAP_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true
    });

    // Custom dark cartographic tile layer (clean & watermark-free)
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dark-tiles',
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Mouse movement listener for HUD coordinate reticle
    map.on('mousemove', (e) => {
      if (onCoordsChange) {
        onCoordsChange({
          lat: e.latlng.lat.toFixed(5),
          lng: e.latlng.lng.toFixed(5),
          zoom: map.getZoom()
        });
      }
    });

    mapInstanceRef.current = map;
    geoLayersRef.current.tileLayer = tileLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemaps dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoLayersRef.current.tileLayer) return;

    map.removeLayer(geoLayersRef.current.tileLayer);

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; OpenStreetMap contributors';
    let className = 'dark-tiles';

    if (basemap === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri &mdash; Earthstar Geographics';
      className = '';
    } else if (basemap === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
      className = '';
    }

    const newLayer = L.tileLayer(url, { maxZoom: 19, attribution, className }).addTo(map);
    geoLayersRef.current.tileLayer = newLayer;
  }, [basemap]);

  // Synchronize GeoJSON layers & selection highlights
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous vector layers
    ['cadastral', 'municipal', 'drone'].forEach((key) => {
      if (geoLayersRef.current[key]) {
        map.removeLayer(geoLayersRef.current[key]);
      }
    });

    // 1. Cadastral Layer
    if (activeLayers.cadastral && !activeLayers.conflictsOnly) {
      const cadastralLayer = L.geoJSON(CADASTRAL_DATASET, {
        style: (feature) => {
          const isSelected = selectedPairId && HARMONIZATION_PAIRS.find(p => p.pair_id === selectedPairId)?.cadastral_id === feature.id;
          return {
            color: isSelected ? '#60a5fa' : '#3b82f6',
            weight: isSelected ? 3 : 1.5,
            fillColor: isSelected ? '#3b82f6' : '#1d4ed8',
            fillOpacity: isSelected ? 0.35 : 0.15,
            dashArray: null
          };
        },
        onEachFeature: (feature, layer) => {
          const pair = HARMONIZATION_PAIRS.find(p => p.cadastral_id === feature.id);
          layer.on('click', () => {
            if (pair && onSelectPair) onSelectPair(pair.pair_id);
          });
          layer.bindTooltip(`<b>Cadastral: ${feature.properties.parcel_id}</b><br/>Owner: ${feature.properties.owner_name}<br/>Area: ${feature.properties.recorded_area} m²`, {
            className: 'text-xs font-mono',
            sticky: true
          });
        }
      }).addTo(map);
      geoLayersRef.current.cadastral = cadastralLayer;
    }

    // 2. Municipal Property Layer
    if (activeLayers.municipal && !activeLayers.conflictsOnly) {
      const municipalLayer = L.geoJSON(MUNICIPAL_DATASET, {
        style: (feature) => {
          const isSelected = selectedPairId && HARMONIZATION_PAIRS.find(p => p.pair_id === selectedPairId)?.municipal_id === feature.id;
          return {
            color: isSelected ? '#f59e0b' : '#d97706',
            weight: isSelected ? 2.5 : 1.5,
            fillColor: '#f59e0b',
            fillOpacity: isSelected ? 0.25 : 0.1,
            dashArray: '4, 4'
          };
        },
        onEachFeature: (feature, layer) => {
          const pair = HARMONIZATION_PAIRS.find(p => p.municipal_id === feature.id);
          layer.on('click', () => {
            if (pair && onSelectPair) onSelectPair(pair.pair_id);
          });
          layer.bindTooltip(`<b>Municipal: ${feature.properties.property_id}</b><br/>Holder: ${feature.properties.holder_name}<br/>Area: ${feature.properties.plot_area} m²`, {
            className: 'text-xs font-mono',
            sticky: true
          });
        }
      }).addTo(map);
      geoLayersRef.current.municipal = municipalLayer;
    }

    // 3. Drone Building Footprints Layer
    if (activeLayers.drone && !activeLayers.conflictsOnly) {
      const droneLayer = L.geoJSON(DRONE_BUILDING_DATASET, {
        style: () => ({
          color: '#06b6d4',
          weight: 1.5,
          fillColor: '#0891b2',
          fillOpacity: 0.45
        }),
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(`<b>Building: ${feature.properties.building_id}</b><br/>Height: ${feature.properties.height_meters}m (${feature.properties.floors} floors)<br/>Footprint: ${feature.properties.footprint_area} m²`, {
            className: 'text-xs font-mono',
            sticky: true
          });
        }
      }).addTo(map);
      geoLayersRef.current.drone = droneLayer;
    }

    // 4. Highlight Conflict Layer if Filtered
    if (activeLayers.conflictsOnly) {
      const conflictFeatures = CADASTRAL_DATASET.features.filter(f => f.id === 'CAD-2026-003');
      const conflictLayer = L.geoJSON({ type: 'FeatureCollection', features: conflictFeatures }, {
        style: {
          color: '#ef4444',
          weight: 3,
          fillColor: '#b91c1c',
          fillOpacity: 0.4,
          dashArray: '6, 3'
        },
        onEachFeature: (f, layer) => {
          layer.bindTooltip('<b>CONFLICT DETECTED</b><br/>Ownership Dispute: Vikram Malhotra vs Devendra Malhotra', {
            className: 'text-xs font-mono text-red-400',
            permanent: true
          });
        }
      }).addTo(map);
      geoLayersRef.current.conflict = conflictLayer;
    }

  }, [activeLayers, selectedPairId, onSelectPair]);

  // Reset to default extent
  const handleResetExtent = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(MAP_CENTER, DEFAULT_ZOOM);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#07090e] overflow-hidden select-none">
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating HUD: Cartographic Tools & Viewport Control (Top-Left) */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1 bg-[#0d121c]/90 backdrop-blur-md border border-[#1c2638] rounded-lg p-1 shadow-2xl">
        <button
          onClick={handleResetExtent}
          title="Reset Extent"
          className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-[#1c2638] rounded transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
          RESET
        </button>

        <div className="w-[1px] h-4 bg-[#1c2638]" />

        {/* Basemap Switcher */}
        <div className="flex items-center text-xs font-mono">
          <button
            onClick={() => setBasemap('dark')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              basemap === 'dark' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DARK
          </button>
          <button
            onClick={() => setBasemap('satellite')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              basemap === 'satellite' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SAT
          </button>
          <button
            onClick={() => setBasemap('osm')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              basemap === 'osm' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VECTOR
          </button>
        </div>
      </div>

      {/* Floating HUD: Spatial Legend & Active Harmonization Layer Overlays (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[400] bg-[#0d121c]/90 backdrop-blur-md border border-[#1c2638] rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300 shadow-2xl space-y-1.5 pointer-events-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-[#1c2638] pb-1">
          Spatial Entity Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-2 rounded-sm border border-blue-400 bg-blue-500/30"></span>
          <span>Cadastral Boundary (Revenue Dept)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-2 rounded-sm border border-amber-400 border-dashed bg-amber-500/20"></span>
          <span>Municipal Assessment Plot (Taxes)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-2 rounded-sm border border-cyan-400 bg-cyan-500/40"></span>
          <span>Drone Building Footprint (UAV)</span>
        </div>
        {activeLayers.conflictsOnly && (
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <span className="w-3 h-2 rounded-sm border border-red-500 bg-red-500/50"></span>
            <span>Unresolved Land Conflict</span>
          </div>
        )}
      </div>
    </div>
  );
}
