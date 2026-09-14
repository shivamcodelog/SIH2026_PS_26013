import path from 'path';
import dotenv from 'dotenv';

// Load .env from current directory or parent directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: process.env.PORT || process.env.NODE_PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/sih26013_landrecords',
  geoEngineUrl: process.env.GEO_ENGINE_URL || 'http://localhost:8000',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
