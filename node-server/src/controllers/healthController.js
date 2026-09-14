import { query } from '../config/db.js';

/**
 * Health Controller for node-server
 * Returns service status, database connectivity, and PostGIS extension info
 */
export const getHealth = async (req, res) => {
  let dbStatus = { connected: false, error: null };
  try {
    const dbRes = await query('SELECT PostGIS_Version() as postgis, now() as server_time');
    dbStatus = {
      connected: true,
      postgis: dbRes.rows[0].postgis,
      serverTime: dbRes.rows[0].server_time
    };
  } catch (err) {
    dbStatus = {
      connected: false,
      error: err.message
    };
  }

  return res.status(200).json({
    success: true,
    service: 'node-server',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
};
