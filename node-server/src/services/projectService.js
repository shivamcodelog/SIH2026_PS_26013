import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../config/db.js';
import { geoEngineService } from './geoEngineService.js';
import {
  DATASET_TYPES,
  DATASET_STATUS,
  MATCH_STATUS,
  createDashboardMetrics
} from '../types/contracts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLE_DATA_DIR = path.resolve(__dirname, '../../../sample-data');
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class ProjectService {
  /**
   * Create a new project container
   */
  async createProject({ name, description = '' }) {
    if (!name || !name.trim()) {
      throw new Error('Project name is required');
    }

    const res = await query(
      `INSERT INTO projects (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at, updated_at`,
      [name.trim(), description ? description.trim() : null]
    );

    return res.rows[0];
  }

  /**
   * List all projects with summary stats
   */
  async getProjects() {
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT d.id)::int as datasets_count,
        COUNT(DISTINCT m.id)::int as matches_count,
        COUNT(DISTINCT c.id)::int as conflicts_count,
        COALESCE(SUM(CASE WHEN m.status = 'AUTO_VERIFIED' THEN 1 ELSE 0 END), 0)::int as auto_verified_count,
        COALESCE(SUM(CASE WHEN m.status = 'REQUIRES_REVIEW' THEN 1 ELSE 0 END), 0)::int as requires_review_count
      FROM projects p
      LEFT JOIN datasets d ON d.project_id = p.id
      LEFT JOIN matches m ON m.project_id = p.id
      LEFT JOIN conflicts c ON c.match_id = m.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    const res = await query(sql);
    return res.rows;
  }

  /**
   * Get a single project with its datasets and dashboard metrics
   */
  async getProjectById(id) {
    const projectRes = await query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectRes.rows.length === 0) {
      return null;
    }
    const project = projectRes.rows[0];

    const datasets = await this.getDatasets(id);
    const metrics = await this.getProjectMetrics(id);

    return {
      ...project,
      datasets,
      metrics
    };
  }

  /**
   * Add a dataset to a project
   */
  async addDataset(projectId, { name, sourceType, fileBuffer, fileName, fileFormat = 'GeoJSON', crs = 'EPSG:4326', recordCount = 0 }) {
    const upperType = (sourceType || '').toUpperCase();
    if (!['CADASTRAL', 'MUNICIPAL', 'DRONE'].includes(upperType)) {
      throw new Error(`Invalid source_type '${sourceType}'. Must be CADASTRAL, MUNICIPAL, or DRONE`);
    }

    // Verify project exists
    const proj = await query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (proj.rows.length === 0) {
      throw new Error(`Project '${projectId}' not found`);
    }

    let savedFileName = fileName;
    if (fileBuffer) {
      savedFileName = `${projectId}_${upperType.toLowerCase()}_${Date.now()}_${fileName || 'data.geojson'}`;
      const destPath = path.join(UPLOADS_DIR, savedFileName);
      fs.writeFileSync(destPath, fileBuffer);
    }

    const res = await query(
      `INSERT INTO datasets (project_id, name, source_type, file_name, file_format, crs, record_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        projectId,
        name || `${upperType} Dataset`,
        upperType,
        savedFileName,
        fileFormat,
        crs,
        recordCount,
        fileBuffer ? DATASET_STATUS.UPLOADED : DATASET_STATUS.UPLOADED
      ]
    );

    return res.rows[0];
  }

  /**
   * Get all datasets for a project
   */
  async getDatasets(projectId) {
    const res = await query(
      `SELECT * FROM datasets WHERE project_id = $1 ORDER BY uploaded_at ASC`,
      [projectId]
    );
    return res.rows;
  }

  /**
   * Process project harmonization pipeline
   * Flow: HTTP -> Node -> FastAPI -> Database -> Node Response
   */
  async processProject(projectId, options = {}) {
    const projectRes = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      throw new Error(`Project '${projectId}' not found`);
    }

    // Find cadastral and municipal datasets
    const datasets = await this.getDatasets(projectId);
    let cadastralDataset = datasets.find(d => d.source_type === 'CADASTRAL');
    let municipalDataset = datasets.find(d => d.source_type === 'MUNICIPAL');

    let cadBuffer;
    let munBuffer;

    // Load file buffer for cadastral
    if (cadastralDataset && cadastralDataset.file_name && fs.existsSync(path.join(UPLOADS_DIR, cadastralDataset.file_name))) {
      cadBuffer = fs.readFileSync(path.join(UPLOADS_DIR, cadastralDataset.file_name));
    } else {
      // Fall back to synthetic sample data
      const sampleCadPath = path.join(SAMPLE_DATA_DIR, 'cadastral.geojson');
      if (!fs.existsSync(sampleCadPath)) {
        throw new Error('No cadastral dataset found for project and sample data is missing');
      }
      cadBuffer = fs.readFileSync(sampleCadPath);
      if (!cadastralDataset) {
        cadastralDataset = await this.addDataset(projectId, {
          name: 'Synthetic Cadastral Survey (Mission 3)',
          sourceType: 'CADASTRAL',
          fileName: 'cadastral.geojson',
          fileFormat: 'GeoJSON',
          crs: 'EPSG:32643'
        });
      }
    }

    // Load file buffer for municipal
    if (municipalDataset && municipalDataset.file_name && fs.existsSync(path.join(UPLOADS_DIR, municipalDataset.file_name))) {
      munBuffer = fs.readFileSync(path.join(UPLOADS_DIR, municipalDataset.file_name));
    } else {
      // Fall back to synthetic sample data
      const sampleMunPath = path.join(SAMPLE_DATA_DIR, 'municipal.geojson');
      if (!fs.existsSync(sampleMunPath)) {
        throw new Error('No municipal dataset found for project and sample data is missing');
      }
      munBuffer = fs.readFileSync(sampleMunPath);
      if (!municipalDataset) {
        municipalDataset = await this.addDataset(projectId, {
          name: 'Synthetic Municipal Tax Records (Mission 3)',
          sourceType: 'MUNICIPAL',
          fileName: 'municipal.geojson',
          fileFormat: 'GeoJSON',
          crs: 'EPSG:32643'
        });
      }
    }

    // Call FastAPI engine /unify
    const unifyResult = await geoEngineService.unifyDatasets(cadBuffer, munBuffer, options);
    if (!unifyResult || !unifyResult.success) {
      throw new Error('FastAPI Unification Engine returned an unsuccessful response');
    }

    // Parse source GeoJSONs to extract geometries for DB persistence
    const cadGeoJson = JSON.parse(cadBuffer.toString('utf-8'));
    const munGeoJson = JSON.parse(munBuffer.toString('utf-8'));

    const cadFeatureMap = new Map();
    for (const feat of (cadGeoJson.features || [])) {
      const pid = feat.properties?.parcel_id || feat.properties?.id;
      if (pid) cadFeatureMap.set(String(pid), feat);
    }

    const munFeatureMap = new Map();
    for (const feat of (munGeoJson.features || [])) {
      const pid = feat.properties?.property_id || feat.properties?.parcel_id || feat.properties?.id;
      if (pid) munFeatureMap.set(String(pid), feat);
    }

    // Begin database persistence in transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clean existing matches and records for clean re-processing
      await client.query('DELETE FROM matches WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM records WHERE dataset_id = ANY($1)', [[cadastralDataset.id, municipalDataset.id]]);

      // Persist cadastral records
      const cadRecordMap = new Map(); // parcel_id -> record UUID
      for (const feat of (cadGeoJson.features || [])) {
        const p = feat.properties || {};
        const pid = String(p.parcel_id || p.id || 'P_UNKNOWN');
        const owner = p.owner_name || p.holder_name || p.landholder || null;
        const area = p.area || p.plot_area || null;
        const geomStr = JSON.stringify(feat.geometry || {});

        const recRes = await client.query(
          `INSERT INTO records (dataset_id, source_record_id, parcel_id, owner_name, area, geometry, normalized_attributes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [cadastralDataset.id, pid, pid, owner, area, geomStr, JSON.stringify(p)]
        );
        cadRecordMap.set(pid, recRes.rows[0].id);
      }

      // Persist municipal records
      const munRecordMap = new Map(); // property_id -> record UUID
      for (const feat of (munGeoJson.features || [])) {
        const p = feat.properties || {};
        const pid = String(p.property_id || p.parcel_id || p.id || 'M_UNKNOWN');
        const owner = p.owner_name || p.holder_name || null;
        const area = p.area || p.plot_area || null;
        const geomStr = JSON.stringify(feat.geometry || {});

        const recRes = await client.query(
          `INSERT INTO records (dataset_id, source_record_id, parcel_id, owner_name, area, geometry, normalized_attributes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [municipalDataset.id, pid, pid, owner, area, geomStr, JSON.stringify(p)]
        );
        munRecordMap.set(pid, recRes.rows[0].id);
      }

      // Persist matches and conflicts from unifyResult
      for (const record of unifyResult.records) {
        const recordAId = cadRecordMap.get(record.source_record_a);
        const recordBId = record.source_record_b ? munRecordMap.get(record.source_record_b) : null;

        if (!recordAId) continue;

        const matchRes = await client.query(
          `INSERT INTO matches (
            project_id, source_record_a, source_record_b,
            spatial_score, area_score, attribute_score, confidence, status
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            projectId,
            recordAId,
            recordBId || null,
            record.spatial_score || 0.0,
            record.area_score || 0.0,
            record.attribute_score || 0.0,
            record.confidence,
            record.status
          ]
        );
        const matchId = matchRes.rows[0].id;

        // Persist conflicts if any
        if (record.conflict_details && record.conflict_details.length > 0) {
          for (const conf of record.conflict_details) {
            await client.query(
              `INSERT INTO conflicts (match_id, type, severity, description, resolved)
               VALUES ($1, $2, $3, $4, $5)`,
              [matchId, conf.type, conf.severity, conf.description, false]
            );
          }
        }
      }

      // Update dataset statuses
      await client.query(
        `UPDATE datasets SET status = 'NORMALIZED', record_count = $1 WHERE id = $2`,
        [cadRecordMap.size, cadastralDataset.id]
      );
      await client.query(
        `UPDATE datasets SET status = 'NORMALIZED', record_count = $1 WHERE id = $2`,
        [munRecordMap.size, municipalDataset.id]
      );

      // Update project timestamp
      await client.query(`UPDATE projects SET updated_at = now() WHERE id = $1`, [projectId]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const metrics = await this.getProjectMetrics(projectId);

    return {
      success: true,
      projectId,
      metrics,
      records: unifyResult.records
    };
  }

  /**
   * Calculates dashboard summary metrics (§16)
   */
  async getProjectMetrics(projectId) {
    const sql = `
      SELECT 
        (SELECT count(*)::int FROM datasets WHERE project_id = $1) as datasets_count,
        (SELECT count(*)::int FROM records r JOIN datasets d ON r.dataset_id = d.id WHERE d.project_id = $1) as records_processed,
        (SELECT count(*)::int FROM matches WHERE project_id = $1) as matched_count,
        (SELECT count(*)::int FROM conflicts c JOIN matches m ON c.match_id = m.id WHERE m.project_id = $1) as conflicts_count,
        (SELECT count(*)::int FROM matches WHERE project_id = $1 AND status = 'REQUIRES_REVIEW') as requires_review_count,
        (SELECT count(*)::int FROM matches WHERE project_id = $1 AND status = 'AUTO_VERIFIED') as auto_verified_count,
        (SELECT count(*)::int FROM matches WHERE project_id = $1 AND status = 'HUMAN_VERIFIED') as human_verified_count,
        (SELECT count(*)::int FROM matches WHERE project_id = $1 AND status = 'REJECTED') as rejected_count
    `;
    const res = await query(sql, [projectId]);
    const r = res.rows[0];

    return createDashboardMetrics({
      datasetsCount: r.datasets_count,
      recordsProcessed: r.records_processed,
      matchedCount: r.matched_count,
      conflictsCount: r.conflicts_count,
      requiresReviewCount: r.requires_review_count,
      autoVerifiedCount: r.auto_verified_count,
      humanVerifiedCount: r.human_verified_count,
      rejectedCount: r.rejected_count
    });
  }

  /**
   * Get harmonized results table (§15)
   */
  async getProjectResults(projectId, filters = {}) {
    let sql = `
      SELECT 
        m.id as match_id,
        ra.parcel_id,
        COALESCE(ra.owner_name, rb.owner_name) as owner_name,
        rb.owner_name as owner_name_b,
        COALESCE(ra.area, rb.area) as area,
        rb.area as area_b,
        ra.normalized_attributes->>'building_id' as building_id,
        m.confidence,
        m.status,
        m.spatial_score,
        m.area_score,
        m.attribute_score,
        ra.source_record_id as source_record_a,
        rb.source_record_id as source_record_b,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'type', c.type,
              'severity', c.severity,
              'description', c.description,
              'resolved', c.resolved
            )
          ) FILTER (WHERE c.id IS NOT NULL), '[]'
        ) as conflicts
      FROM matches m
      JOIN records ra ON m.source_record_a = ra.id
      LEFT JOIN records rb ON m.source_record_b = rb.id
      LEFT JOIN conflicts c ON c.match_id = m.id
      WHERE m.project_id = $1
    `;

    const params = [projectId];
    let paramIndex = 2;

    if (filters.status) {
      sql += ` AND m.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.search) {
      sql += ` AND (ra.parcel_id ILIKE $${paramIndex} OR ra.owner_name ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += `
      GROUP BY m.id, ra.id, rb.id
      ORDER BY m.confidence ASC, ra.parcel_id ASC
    `;

    const res = await query(sql, params);
    const metrics = await this.getProjectMetrics(projectId);

    return {
      metrics,
      records: res.rows
    };
  }

  /**
   * Get conflicts list (§12, §17)
   */
  async getProjectConflicts(projectId, filters = {}) {
    let sql = `
      SELECT 
        c.id,
        c.match_id,
        ra.parcel_id,
        c.type,
        c.severity,
        c.description,
        c.resolved,
        c.created_at,
        m.confidence,
        m.status as match_status,
        ra.owner_name as owner_name_a,
        rb.owner_name as owner_name_b,
        ra.area as area_a,
        rb.area as area_b
      FROM conflicts c
      JOIN matches m ON c.match_id = m.id
      JOIN records ra ON m.source_record_a = ra.id
      LEFT JOIN records rb ON m.source_record_b = rb.id
      WHERE m.project_id = $1
    `;

    const params = [projectId];
    let paramIndex = 2;

    if (filters.resolved !== undefined) {
      sql += ` AND c.resolved = $${paramIndex}`;
      params.push(filters.resolved === 'true' || filters.resolved === true);
      paramIndex++;
    }

    if (filters.severity) {
      sql += ` AND c.severity = $${paramIndex}`;
      params.push(filters.severity.toUpperCase());
      paramIndex++;
    }

    sql += ` ORDER BY CASE c.severity WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, c.created_at ASC`;

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Get GeoJSON FeatureCollection for Leaflet interactive map (§14)
   */
  async getProjectMap(projectId) {
    // Fetch matches with full conflict details (type + severity + description)
    const sql = `
      SELECT
        m.id as match_id,
        ra.parcel_id,
        COALESCE(ra.owner_name, rb.owner_name) as owner_name,
        COALESCE(ra.area, rb.area) as area,
        ra.normalized_attributes->>'building_id' as building_id,
        m.confidence,
        m.status,
        ra.source_record_id as source_record_a,
        rb.source_record_id as source_record_b,
        ra.geometry as geometry_str,
        rb.geometry as geometry_str_b,
        rb.owner_name as owner_name_b,
        rb.area as area_b,
        COALESCE(
          json_agg(
            json_build_object(
              'type', c.type,
              'severity', c.severity,
              'description', c.description
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) as conflicts
      FROM matches m
      JOIN records ra ON m.source_record_a = ra.id
      LEFT JOIN records rb ON m.source_record_b = rb.id
      LEFT JOIN conflicts c ON c.match_id = m.id
      WHERE m.project_id = $1
      GROUP BY m.id, ra.id, rb.id
    `;

    const res = await query(sql, [projectId]);

    // Return each original dataset as its own GeoJSON canvas as well as the
    // harmonized matches below. This lets the frontend inspect one source at
    // a time without reconstructing drone footprints from unified parcels.
    const sourceRes = await query(`
      SELECT
        r.id as source_record_id,
        r.parcel_id,
        r.owner_name,
        r.area,
        r.geometry,
        r.normalized_attributes,
        d.source_type
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id
      WHERE d.project_id = $1
      ORDER BY r.id
    `, [projectId]);

    const sourceCollections = {
      cadastral: { type: 'FeatureCollection', features: [] },
      municipal: { type: 'FeatureCollection', features: [] },
      drone: { type: 'FeatureCollection', features: [] },
    };

    sourceRes.rows.forEach((row) => {
      const source = String(row.source_type || '').toLowerCase();
      if (!sourceCollections[source]) return;

      let geometry = row.geometry;
      try {
        geometry = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
      } catch {
        geometry = null;
      }
      if (!geometry) return;

      const attributes = row.normalized_attributes || {};
      sourceCollections[source].features.push({
        type: 'Feature',
        id: row.source_record_id,
        geometry,
        properties: {
          source_record_id: row.source_record_id,
          parcel_id: row.parcel_id,
          owner_name: row.owner_name,
          area: row.area,
          building_id: attributes.building_id || attributes.id,
          height_meters: attributes.height_meters || attributes.height,
          floors: attributes.floors,
          footprint_area: attributes.footprint_area || row.area,
        },
      });
    });

    const features = res.rows.map(row => {
      let geom = null;
      let geomB = null;
      try {
        geom = typeof row.geometry_str === 'string' ? JSON.parse(row.geometry_str) : row.geometry_str;
        geomB = typeof row.geometry_str_b === 'string' ? JSON.parse(row.geometry_str_b) : row.geometry_str_b;
      } catch {
        geom = null;
        geomB = null;
      }

      // Build a readable sources array from actual record IDs
      const sources = [];
      if (row.source_record_a) sources.push(row.source_record_a);
      if (row.source_record_b) sources.push(row.source_record_b);

      return {
        type: 'Feature',
        id: row.match_id,
        geometry: geom,
        properties: {
          match_id: row.match_id,
          parcel_id: row.parcel_id,
          owner_name: row.owner_name,
          area: row.area,
          building_id: row.building_id,
          confidence: Number(row.confidence),
          status: row.status,
          sources,
          conflicts: row.conflicts || [],
          source_record_a: row.source_record_a,
          source_record_b: row.source_record_b,
          owner_name_b: row.owner_name_b,
          area_b: row.area_b,
          source_geometry_b: geomB
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features,
      ...sourceCollections,
    };
  }

  /**
   * Record a human review decision (§13, §18)
   */
  async recordReviewDecision(matchId, { decision, reviewer = 'Officer', comment = '' }) {
    const upperDecision = (decision || '').toUpperCase();
    if (!['ACCEPT', 'REJECT', 'RESOLVE'].includes(upperDecision)) {
      throw new Error(`Invalid review decision '${decision}'. Must be ACCEPT, REJECT, or RESOLVE`);
    }

    const matchRes = await query('SELECT * FROM matches WHERE id = $1', [matchId]);
    if (matchRes.rows.length === 0) {
      throw new Error(`Match record '${matchId}' not found`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record in reviews table
      const reviewRes = await client.query(
        `INSERT INTO reviews (match_id, reviewer, decision, comment)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [matchId, reviewer, upperDecision, comment || null]
      );

      // Update match status based on decision
      const newStatus = upperDecision === 'REJECT' ? MATCH_STATUS.REJECTED : MATCH_STATUS.HUMAN_VERIFIED;
      await client.query(
        `UPDATE matches SET status = $1, updated_at = now() WHERE id = $2`,
        [newStatus, matchId]
      );

      // Mark associated conflicts as resolved
      await client.query(
        `UPDATE conflicts SET resolved = true WHERE match_id = $1`,
        [matchId]
      );

      await client.query('COMMIT');

      return {
        review: reviewRes.rows[0],
        matchStatus: newStatus
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const projectService = new ProjectService();
export default projectService;
