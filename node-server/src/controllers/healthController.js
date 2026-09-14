import { query } from '../config/db.js';
import { geoEngineService } from '../services/geoEngineService.js';
import { successResponse } from '../types/contracts.js';

/**
 * Health Controller for node-server
 * Returns service status, database connectivity, and FastAPI engine health
 */
export const getHealth = async (req, res, next) => {
  let dbStatus = { connected: false, error: null };
  try {
    const dbRes = await query('SELECT PostGIS_Version() as postgis, now() as server_time');
    dbStatus = {
      connected: true,
      postgis: dbRes.rows[0].postgis,
      serverTime: dbRes.rows[0].server_time
    };
  } catch (err) {
    try {
      const fallbackRes = await query('SELECT version() as pg_version, now() as server_time');
      dbStatus = {
        connected: true,
        version: fallbackRes.rows[0].pg_version,
        serverTime: fallbackRes.rows[0].server_time,
        postgis: 'Not available'
      };
    } catch (fallbackErr) {
      dbStatus = {
        connected: false,
        error: fallbackErr.message
      };
    }
  }

  const geoEngineStatus = await geoEngineService.checkHealth();

  return res.status(200).json(
    successResponse({
      service: 'node-server',
      database: dbStatus,
      geoEngine: geoEngineStatus
    })
  );
};
