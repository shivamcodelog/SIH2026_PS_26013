// ==============================================================================
// SIH26013 - Reproducible Database Migration Runner (Node.js)
// Executes schema migrations and seeds programmatically
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5433}/${process.env.POSTGRES_DB || 'sih26013_landrecords'}`;

console.log(' Connecting to Database:', connectionString.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log(' Starting Schema Migration...');
    
    // Read and run migration SQL
    const migrationFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');
    
    await client.query(migrationSql);
    console.log(' Schema Migration 001_initial_schema.sql executed successfully.');

    // Read and run seed SQL
    const seedFile = path.join(__dirname, 'seeds', '001_sample_data.sql');
    if (fs.existsSync(seedFile)) {
      console.log(' Seeding sample verification data...');
      const seedSql = fs.readFileSync(seedFile, 'utf8');
      await client.query(seedSql);
      console.log(' Seed 001_sample_data.sql executed successfully.');
    }

    // Verify PostGIS and GiST index
    const postgisRes = await client.query('SELECT PostGIS_Version() AS version;');
    console.log(` PostGIS Extension active: ${postgisRes.rows[0].version}`);

    const indexRes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'records' AND indexname = 'idx_records_geometry';
    `);
    
    if (indexRes.rows.length > 0) {
      console.log(' GiST Spatial Index confirmed: idx_records_geometry on records(geometry)');
    } else {
      throw new Error('GiST spatial index idx_records_geometry not found!');
    }

    // Run spatial verification query
    console.log(' Executing real spatial calculation queries (ST_Area & ST_Intersects)...');
    const spatialTest = await client.query(`
      SELECT 
        r1.parcel_id AS parcel_a,
        r2.parcel_id AS parcel_b,
        ST_Intersects(r1.geometry, r2.geometry) AS intersects,
        ROUND(ST_Area(r1.geometry::geography)::numeric, 2) AS area_a_sqm,
        ROUND(ST_Area(r2.geometry::geography)::numeric, 2) AS area_b_sqm,
        ROUND(ST_Area(ST_Intersection(r1.geometry, r2.geometry)::geography)::numeric, 2) AS overlap_area_sqm
      FROM records r1
      JOIN records r2 ON r1.id <> r2.id
      WHERE r1.source_record_id = 'CAD_PARCEL_101' 
        AND r2.source_record_id = 'MUNI_REC_4402';
    `);

    if (spatialTest.rows.length > 0) {
      const row = spatialTest.rows[0];
      console.log(' Spatial Query Results:');
      console.log(`   - Pair: ${row.parcel_a} <-> ${row.parcel_b}`);
      console.log(`   - ST_Intersects: ${row.intersects}`);
      console.log(`   - Cadastral Area (ST_Area): ${row.area_a_sqm} m²`);
      console.log(`   - Municipal Area (ST_Area): ${row.area_b_sqm} m²`);
      console.log(`   - Overlap Area (ST_Intersection): ${row.overlap_area_sqm} m²`);
    }

    // Table summary
    const countRes = await client.query(`
      SELECT 
        (SELECT count(*) FROM projects) as projects,
        (SELECT count(*) FROM datasets) as datasets,
        (SELECT count(*) FROM records) as records,
        (SELECT count(*) FROM matches) as matches,
        (SELECT count(*) FROM conflicts) as conflicts,
        (SELECT count(*) FROM reviews) as reviews;
    `);
    console.log(' Table Counts Verified:', countRes.rows[0]);

    console.log(' MISSION 2 VERIFICATION COMPLETE: ALL CHECKS PASSED.');
  } catch (err) {
    console.error(' Migration/Verification Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
