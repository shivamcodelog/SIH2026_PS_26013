// ==============================================================================
// SIH26013 - PostgreSQL + PostGIS Connection Pool
// ==============================================================================

import pg from 'pg';
import { config } from './index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 5000,
  max: 20
});

pool.on('error', (err) => {
  console.error('[PostGIS Pool] Unexpected error on idle client:', err);
});

export const query = (text, params) => pool.query(text, params);

export default {
  pool,
  query
};
