/**
 * Deterministic Synthetic Geospatial Benchmark Data for SIH26013
 * Represents an urban block with Cadastral boundaries, Municipal property polygons,
 * and Drone building footprints illustrating harmonization cases.
 */

// Center: New Delhi Urban Block (Lat: 28.6280, Lng: 77.2180)
export const MAP_CENTER = [28.6280, 77.2180];
export const DEFAULT_ZOOM = 16;

export const CADASTRAL_DATASET = {
  type: "FeatureCollection",
  id: "cadastral-layer",
  name: "Cadastral Land Registry",
  source: "State Revenue Department",
  crs: "EPSG:4326",
  color: "#3b82f6", // Technical Blue
  features: [
    {
      type: "Feature",
      id: "CAD-2026-001",
      properties: {
        parcel_id: "CAD-2026-001",
        owner_name: "Ravi Kumar",
        recorded_area: 1250,
        land_use: "Commercial",
        deed_date: "2018-04-12",
        status: "ACTIVE"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2155, 28.6290],
          [77.2175, 28.6290],
          [77.2175, 28.6275],
          [77.2155, 28.6275],
          [77.2155, 28.6290]
        ]]
      }
    },
    {
      type: "Feature",
      id: "CAD-2026-002",
      properties: {
        parcel_id: "CAD-2026-002",
        owner_name: "Anita Sharma",
        recorded_area: 980,
        land_use: "Residential",
        deed_date: "2019-11-03",
        status: "ACTIVE"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2178, 28.6290],
          [77.2198, 28.6290],
          [77.2198, 28.6275],
          [77.2178, 28.6275],
          [77.2178, 28.6290]
        ]]
      }
    },
    {
      type: "Feature",
      id: "CAD-2026-003",
      properties: {
        parcel_id: "CAD-2026-003",
        owner_name: "Vikram Malhotra",
        recorded_area: 1420,
        land_use: "Mixed Use",
        deed_date: "2021-06-19",
        status: "DISPUTED"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2155, 28.6272],
          [77.2175, 28.6272],
          [77.2175, 28.6256],
          [77.2155, 28.6256],
          [77.2155, 28.6272]
        ]]
      }
    },
    {
      type: "Feature",
      id: "CAD-2026-004",
      properties: {
        parcel_id: "CAD-2026-004",
        owner_name: "Delhi Urban Infrastructure Ltd",
        recorded_area: 1850,
        land_use: "Public Utility",
        deed_date: "2015-01-20",
        status: "ACTIVE"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2178, 28.6272],
          [77.2202, 28.6272],
          [77.2202, 28.6256],
          [77.2178, 28.6256],
          [77.2178, 28.6272]
        ]]
      }
    }
  ]
};

export const MUNICIPAL_DATASET = {
  type: "FeatureCollection",
  id: "municipal-layer",
  name: "Municipal Property Tax Registry",
  source: "Municipal Corporation Assessment",
  crs: "EPSG:32643 (reprojected)",
  color: "#f59e0b", // Amber
  features: [
    {
      type: "Feature",
      id: "MUN-TX-1042",
      properties: {
        property_id: "MUN-TX-1042",
        holder_name: "Ravi K.", // Name abbreviation discrepancy
        plot_area: 1195, // Discrepancy: -55m²
        annual_tax: "₹ 48,200",
        assessment_year: 2024
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2156, 28.6289],
          [77.2174, 28.6289],
          [77.2174, 28.6276],
          [77.2156, 28.6276],
          [77.2156, 28.6289]
        ]]
      }
    },
    {
      type: "Feature",
      id: "MUN-TX-1043",
      properties: {
        property_id: "MUN-TX-1043",
        holder_name: "Anita Sharma", // High confidence match
        plot_area: 978,
        annual_tax: "₹ 34,500",
        assessment_year: 2024
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2178, 28.6290],
          [77.2198, 28.6290],
          [77.2198, 28.6275],
          [77.2178, 28.6275],
          [77.2178, 28.6290]
        ]]
      }
    },
    {
      type: "Feature",
      id: "MUN-TX-1044",
      properties: {
        property_id: "MUN-TX-1044",
        holder_name: "Devendra Malhotra", // Contradictory ownership!
        plot_area: 1410,
        annual_tax: "₹ 62,000",
        assessment_year: 2024
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2155, 28.6271],
          [77.2173, 28.6271],
          [77.2173, 28.6257],
          [77.2155, 28.6257],
          [77.2155, 28.6271]
        ]]
      }
    }
  ]
};

export const DRONE_BUILDING_DATASET = {
  type: "FeatureCollection",
  id: "drone-layer",
  name: "Drone Survey Footprints",
  source: "UAV Photogrammetry (GSD 5cm)",
  crs: "EPSG:4326",
  color: "#06b6d4", // Cyan
  features: [
    {
      type: "Feature",
      id: "BLD-DRONE-801",
      properties: {
        building_id: "BLD-DRONE-801",
        footprint_area: 620,
        height_meters: 14.2,
        floors: 4,
        survey_date: "2026-08-10"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2160, 28.6286],
          [77.2170, 28.6286],
          [77.2170, 28.6279],
          [77.2160, 28.6279],
          [77.2160, 28.6286]
        ]]
      }
    },
    {
      type: "Feature",
      id: "BLD-DRONE-802",
      properties: {
        building_id: "BLD-DRONE-802",
        footprint_area: 480,
        height_meters: 9.8,
        floors: 2,
        survey_date: "2026-08-10"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2182, 28.6286],
          [77.2194, 28.6286],
          [77.2194, 28.6278],
          [77.2182, 28.6278],
          [77.2182, 28.6286]
        ]]
      }
    },
    {
      type: "Feature",
      id: "BLD-DRONE-803",
      properties: {
        building_id: "BLD-DRONE-803",
        footprint_area: 740,
        height_meters: 18.5,
        floors: 5,
        survey_date: "2026-08-10"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2158, 28.6268],
          [77.2171, 28.6268],
          [77.2171, 28.6260],
          [77.2158, 28.6260],
          [77.2158, 28.6268]
        ]]
      }
    }
  ]
};

// Benchmark Harmonization Pairs & Conflict Signals for Inspector
export const HARMONIZATION_PAIRS = [
  {
    pair_id: "HARM-PAIR-01",
    cadastral_id: "CAD-2026-001",
    municipal_id: "MUN-TX-1042",
    building_ids: ["BLD-DRONE-801"],
    status: "NEEDS_REVIEW",
    confidence_score: 88.4,
    metrics: {
      spatial_iou: 91.2,
      centroid_distance_meters: 1.45,
      area_variance_pct: -4.4,
      name_similarity_pct: 86.5
    },
    flags: [
      { type: "SPELLING_VARIANCE", label: "Owner Name Variation", detail: "Ravi Kumar (Cadastral) vs Ravi K. (Municipal)" },
      { type: "AREA_DELTA", label: "Area Variance", detail: "Δ 55 m² (1,250 m² vs 1,195 m²)" }
    ],
    cadastral_record: {
      id: "CAD-2026-001",
      owner: "Ravi Kumar",
      area: "1,250 m²",
      land_use: "Commercial",
      authority: "State Revenue Dept"
    },
    municipal_record: {
      id: "MUN-TX-1042",
      owner: "Ravi K.",
      area: "1,195 m²",
      tax_value: "₹ 48,200",
      authority: "Municipal Corp"
    }
  },
  {
    pair_id: "HARM-PAIR-02",
    cadastral_id: "CAD-2026-002",
    municipal_id: "MUN-TX-1043",
    building_ids: ["BLD-DRONE-802"],
    status: "AUTO_MATCHED",
    confidence_score: 98.7,
    metrics: {
      spatial_iou: 99.1,
      centroid_distance_meters: 0.18,
      area_variance_pct: -0.2,
      name_similarity_pct: 100.0
    },
    flags: [],
    cadastral_record: {
      id: "CAD-2026-002",
      owner: "Anita Sharma",
      area: "980 m²",
      land_use: "Residential",
      authority: "State Revenue Dept"
    },
    municipal_record: {
      id: "MUN-TX-1043",
      owner: "Anita Sharma",
      area: "978 m²",
      tax_value: "₹ 34,500",
      authority: "Municipal Corp"
    }
  },
  {
    pair_id: "HARM-PAIR-03",
    cadastral_id: "CAD-2026-003",
    municipal_id: "MUN-TX-1044",
    building_ids: ["BLD-DRONE-803"],
    status: "CONFLICT",
    confidence_score: 64.2,
    metrics: {
      spatial_iou: 89.6,
      centroid_distance_meters: 2.10,
      area_variance_pct: -0.7,
      name_similarity_pct: 22.0
    },
    flags: [
      { type: "OWNERSHIP_DISPUTE", label: "Critical Ownership Conflict", detail: "Vikram Malhotra vs Devendra Malhotra" }
    ],
    cadastral_record: {
      id: "CAD-2026-003",
      owner: "Vikram Malhotra",
      area: "1,420 m²",
      land_use: "Mixed Use",
      authority: "State Revenue Dept"
    },
    municipal_record: {
      id: "MUN-TX-1044",
      owner: "Devendra Malhotra",
      area: "1,410 m²",
      tax_value: "₹ 62,000",
      authority: "Municipal Corp"
    }
  }
];
