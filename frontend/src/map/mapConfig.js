/**
 * mapConfig.js — Tile provider configuration (separated from app logic)
 *
 * IMPORTANT: This file is the single source of truth for basemap providers.
 * Application logic (WebGISMap.jsx, UnifiedMapPage.jsx) should import from here,
 * never hard-code tile URLs in component files.
 *
 * GeoJSON coordinate order:  [lng, lat]  (GeoJSON spec 3.1.1)
 * Leaflet coordinate order:   [lat, lng]  (L.latLng / L.geoJSON needs reversal)
 * All geometry crossing this boundary MUST be reordered explicitly.
 */

// Center matches the synthetic sample-data zone: Nagpur urban block (lat~21.140, lng~79.090)
// WebGISMap.fitBounds() will override this when actual feature data is loaded.
export const MAP_CENTER = [21.14046, 79.09073];
export const DEFAULT_ZOOM = 16;
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 19;

export const TILE_PROVIDERS = {
  dark: {
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    },
  },
  satellite: {
    label: 'SAT',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: '&copy; Esri &mdash; Earthstar Geographics',
      maxZoom: 19,
    },
  },
  osm: {
    label: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
  },
};

export const DEFAULT_BASEMAP = 'dark';

export const LAYER_STYLES = {
  unified: {
    verified:  { color: '#10b981', weight: 2.5, fillColor: '#10b981', fillOpacity: 0.22, opacity: 0.9 },
    review:    { color: '#f59e0b', weight: 2.5, fillColor: '#f59e0b', fillOpacity: 0.22, opacity: 0.9, dashArray: '6 3' },
    conflict:  { color: '#ef4444', weight: 3,   fillColor: '#ef4444', fillOpacity: 0.28, opacity: 1,   dashArray: '4 2' },
    selected:  { color: '#38bdf8', weight: 4,   fillColor: '#38bdf8', fillOpacity: 0.40, opacity: 1 },
  },
  cadastral: { color: '#3b82f6', weight: 1.5, fillColor: '#1d4ed8', fillOpacity: 0.15, opacity: 0.9 },
  municipal: { color: '#d97706', weight: 1.5, fillColor: '#f59e0b', fillOpacity: 0.10, opacity: 0.9, dashArray: '4 4' },
  drone:     { color: '#06b6d4', weight: 1.5, fillColor: '#0891b2', fillOpacity: 0.45, opacity: 0.9 },
};
