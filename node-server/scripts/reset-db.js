import { pool } from '../src/config/db.js';

/**
 * Hard Reset Script for Demo Reliability (Mission 17)
 * This drops all data from the database cleanly to ensure a predictable 
 * blank state for presentation mode.
 */
async function resetDatabase() {
  console.log('--- DB HARD RESET INITIATED ---');
  try {
    // We only need to truncate projects CASCADE, which drops all datasets, matched_records, and conflicts
    await pool.query(`TRUNCATE TABLE projects CASCADE;`);
    console.log('✅ Success: All tables truncated.');
    
    // Also reset sequences for clean IDs starting at 1
    const sequences = ['projects_id_seq'];
    for (const seq of sequences) {
      try {
        await pool.query(`ALTER SEQUENCE ${seq} RESTART WITH 1;`);
        console.log(`✅ Success: Reset sequence ${seq}.`);
      } catch (err) {
        // sequences might not exist or be named differently, safe to ignore
      }
    }
  } catch (err) {
    console.error('❌ Error resetting DB:', err);
  } finally {
    await pool.end();
    console.log('--- DB RESET COMPLETE ---');
  }
}

resetDatabase();
