/**
 * Deterministic Synthetic Geospatial Benchmark Data for SIH26013
 *
 * Coordinate zone: Nagpur urban area (Lat ~21.140, Lng ~79.090)
 * This matches the real sample-data/*.geojson files so that mock and live
 * data render in the same Leaflet viewport.
 *
 * GeoJSON coordinate order: [lng, lat]  (GeoJSON spec §3.1.1)
 * Leaflet order:            [lat, lng]  (L.geoJSON handles reversal automatically)
 *
 * SYNTHETIC DATA ONLY. Does not represent any real geography or land records.
 */

export const MAP_CENTER = [21.14046, 79.09073]; // [lat, lng] for Leaflet
export const DEFAULT_ZOOM = 17;

// ── Cadastral Dataset ─────────────────────────────────────────────────────────
// Field names match real cadastral.geojson schema: parcel_id, owner_name, area
export const CADASTRAL_DATASET = {
  type: 'FeatureCollection',
  id: 'cadastral-layer',
  name: 'Cadastral Land Registry',
  source: 'State Revenue Department',
  crs: 'EPSG:4326',
  features: [
    {
      type: 'Feature',
      id: 'P101',
      properties: {
        parcel_id: 'P101',
        owner_name: 'Ravi Kumar',
        recorded_area: 500,
        land_use: 'Residential',
        status: 'ACTIVE',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[ // [lng, lat]
          [79.0900, 21.1400],
          [79.0924, 21.1400],
          [79.0924, 21.1409],
          [79.0900, 21.1409],
          [79.0900, 21.1400],
        ]],
      },
    },
    {
      type: 'Feature',
      id: 'P102',
      properties: {
        parcel_id: 'P102',
        owner_name: 'Priya Sharma',
        recorded_area: 480,
        land_use: 'Residential',
        status: 'ACTIVE',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [79.0924, 21.1400],
          [79.0948, 21.1400],
          [79.0948, 21.1409],
          [79.0924, 21.1409],
          [79.0924, 21.1400],
        ]],
      },
    },
    {
      type: 'Feature',
      id: 'P103',
      properties: {
        parcel_id: 'P103',
        owner_name: 'Vikram Malhotra',
        recorded_area: 620,
        land_use: 'Mixed Use',
        status: 'DISPUTED',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [79.0900, 21.1409],
          [79.0924, 21.1409],
          [79.0924, 21.1418],
          [79.0900, 21.1418],
          [79.0900, 21.1409],
        ]],
      },
    },
  ],
};

// ── Municipal Dataset ─────────────────────────────────────────────────────────
// Field names match real municipal.geojson schema: property_id, holder_name, plot_area
export const MUNICIPAL_DATASET = {
  type: 'FeatureCollection',
  id: 'municipal-layer',
  name: 'Municipal Property Tax Registry',
  source: 'Municipal Corporation Assessment',
  crs: 'EPSG:4326',
  features: [
    {
      type: 'Feature',
      id: 'M-101',
      properties: {
        property_id: 'M-101',
        holder_name: 'Ravi Kumar',        // exact match → high confidence
        plot_area: 498,
        ward: 'Vastu Nagar',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [79.0901, 21.1401],
          [79.0923, 21.1401],
          [79.0923, 21.1408],
          [79.0901, 21.1408],
          [79.0901, 21.1401],
        ]],
      },
    },
    {
      type: 'Feature',
      id: 'M-102',
      properties: {
        property_id: 'M-102',
        holder_name: 'P. Sharma',         // abbreviation variance → medium confidence
        plot_area: 475,
        ward: 'Vastu Nagar',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [79.0924, 21.1401],
          [79.0947, 21.1401],
          [79.0947, 21.1408],
          [79.0924, 21.1408],
          [79.0924, 21.1401],
        ]],
      },
    },
    {
      type: 'Feature',
      id: 'M-103',
      properties: {
        property_id: 'M-103',
        holder_name: 'Devendra Malhotra', // genuinely different name → conflict
        plot_area: 615,
        ward: 'Vastu Nagar',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [79.0900, 21.1410],
          [79.0923, 21.1410],
          [79.0923, 21.1417],
          [79.0900, 21.1417],
          [79.0900, 21.1410],
        ]],
      },
    },
  ],
};

// ── Drone Building Footprints ─────────────────────────────────────────────────
// Field names match real buildings.geojson schema: building_id, building_area, floors
export const DRONE_BUILDING_DATASET = {
  type: 'FeatureCollection',
  id: 'drone-layer',
  name: 'Drone Survey Footprints',
  source: 'UAV Photogrammetry (GSD 5cm)',
  crs: 'EPSG:4326',
  features: [
    {
      type: 'Feature',
      id: 'B-101',
      properties: {
        building_id: 'B-101',
        building_area: 266,
        footprint_area: 266,
        floors: 3,
        survey_date: '2026-08-10',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [79.0904, 21.1402],
          [79.0914, 21.1402],
          [79.0914, 21.1407],
          [79.0904, 21.1407],
          [79.0904, 21.1402],
        ]],
      },
    },
    {
      type: 'Feature',
      id: 'B-102',
      properties: {
        building_id: 'B-102',
        building_area: 240,
        footprint_area: 240,
        floors: 2,
        survey_date: '2026-08-10',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [79.0928, 21.1402],
          [79.0942, 21.1402],
          [79.0942, 21.1407],
          [79.0928, 21.1407],
          [79.0928, 21.1402],
        ]],
      },
    },
    {
      type: 'Feature',
      id: 'B-103',
      properties: {
        building_id: 'B-103',
        building_area: 310,
        footprint_area: 310,
        floors: 4,
        survey_date: '2026-08-10',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [79.0903, 21.1411],
          [79.0918, 21.1411],
          [79.0918, 21.1416],
          [79.0903, 21.1416],
          [79.0903, 21.1411],
        ]],
      },
    },
  ],
};

// ── Benchmark Harmonization Pairs ─────────────────────────────────────────────
// These represent the three expected match scenarios: HIGH / MEDIUM / CONFLICT
export const HARMONIZATION_PAIRS = [
  {
    pair_id: 'HARM-PAIR-01',
    cadastral_id: 'P101',
    municipal_id: 'M-101',
    building_ids: ['B-101'],
    status: 'AUTO_MATCHED',
    confidence_score: 97.4,
    metrics: {
      spatial_iou: 98.2,
      centroid_distance_meters: 0.8,
      area_variance_pct: -0.4,
      name_similarity_pct: 100.0,
    },
    flags: [],
    cadastral_record: {
      id: 'P101',
      owner: 'Ravi Kumar',
      area: '500 m²',
      land_use: 'Residential',
      authority: 'State Revenue Dept',
    },
    municipal_record: {
      id: 'M-101',
      owner: 'Ravi Kumar',
      area: '498 m²',
      tax_value: '₹ 41,500',
      authority: 'Municipal Corp',
    },
  },
  {
    pair_id: 'HARM-PAIR-02',
    cadastral_id: 'P102',
    municipal_id: 'M-102',
    building_ids: ['B-102'],
    status: 'NEEDS_REVIEW',
    confidence_score: 84.1,
    metrics: {
      spatial_iou: 92.7,
      centroid_distance_meters: 1.9,
      area_variance_pct: -1.0,
      name_similarity_pct: 71.3,
    },
    flags: [
      { type: 'SPELLING_VARIANCE', label: 'Owner Name Abbreviation', detail: 'Priya Sharma (Cadastral) vs P. Sharma (Municipal)' },
    ],
    cadastral_record: {
      id: 'P102',
      owner: 'Priya Sharma',
      area: '480 m²',
      land_use: 'Residential',
      authority: 'State Revenue Dept',
    },
    municipal_record: {
      id: 'M-102',
      owner: 'P. Sharma',
      area: '475 m²',
      tax_value: '₹ 38,200',
      authority: 'Municipal Corp',
    },
  },
  {
    pair_id: 'HARM-PAIR-03',
    cadastral_id: 'P103',
    municipal_id: 'M-103',
    building_ids: ['B-103'],
    status: 'CONFLICT',
    confidence_score: 61.8,
    metrics: {
      spatial_iou: 87.4,
      centroid_distance_meters: 2.4,
      area_variance_pct: -0.8,
      name_similarity_pct: 19.2,
    },
    flags: [
      { type: 'OWNERSHIP_DISPUTE', label: 'Critical Ownership Conflict', detail: 'Vikram Malhotra (Cadastral) vs Devendra Malhotra (Municipal)' },
    ],
    cadastral_record: {
      id: 'P103',
      owner: 'Vikram Malhotra',
      area: '620 m²',
      land_use: 'Mixed Use',
      authority: 'State Revenue Dept',
    },
    municipal_record: {
      id: 'M-103',
      owner: 'Devendra Malhotra',
      area: '615 m²',
      tax_value: '₹ 55,000',
      authority: 'Municipal Corp',
    },
  },
];
