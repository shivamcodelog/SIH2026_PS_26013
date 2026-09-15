import { config } from '../config/index.js';

/**
 * Service to communicate with Python FastAPI Geospatial Engine
 * Conforms to PROJECT_CONTEXT §5 (Traffic direction: React -> Node -> FastAPI only)
 */
export class GeoEngineService {
  constructor(baseUrl = config.geoEngineUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Health check for FastAPI engine
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) {
        return {
          connected: false,
          error: `FastAPI responded with HTTP ${response.status}`
        };
      }
      const data = await response.json();
      return {
        connected: true,
        status: data.status || 'online',
        database: data.database || null
      };
    } catch (err) {
      return {
        connected: false,
        error: err.message
      };
    }
  }

  /**
   * Ingest and validate a GeoJSON dataset via FastAPI /ingest
   */
  async ingestDataset(fileBuffer, filename = 'dataset.geojson') {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/geo+json' });
    formData.append('file', blob, filename);

      let response;
      try {
        response = await fetch(`${this.baseUrl}/ingest`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000)
        });
      } catch (err) {
        const error = new Error('FastAPI Engine Unavailable');
        error.status = 503;
        throw error;
      }

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { detail: errorText };
      }
      throw new Error(`GeoEngine Ingest Failed (${response.status}): ${errorJson.detail || errorText}`);
    }

    return await response.json();
  }

  /**
   * Unify cadastral and municipal datasets via FastAPI /unify
   */
  async unifyDatasets(cadastralBuffer, municipalBuffer, options = {}) {
    const formData = new FormData();
    const cadBlob = new Blob([cadastralBuffer], { type: 'application/geo+json' });
    const munBlob = new Blob([municipalBuffer], { type: 'application/geo+json' });

    formData.append('cadastral', cadBlob, 'cadastral.geojson');
    formData.append('municipal', munBlob, 'municipal.geojson');

    const queryParams = new URLSearchParams();
    if (options.threshold !== undefined) queryParams.set('threshold', options.threshold);
    if (options.spatial_weight !== undefined) queryParams.set('spatial_weight', options.spatial_weight);
    if (options.area_weight !== undefined) queryParams.set('area_weight', options.area_weight);
    if (options.attribute_weight !== undefined) queryParams.set('attribute_weight', options.attribute_weight);

    const url = `${this.baseUrl}/unify${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000)
      });
    } catch (err) {
      const error = new Error('FastAPI Engine Unavailable');
      error.status = 503;
      throw error;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { detail: errorText };
      }
      throw new Error(`GeoEngine Unify Failed (${response.status}): ${errorJson.detail || errorText}`);
    }

    return await response.json();
  }
}

export const geoEngineService = new GeoEngineService();
export default geoEngineService;
