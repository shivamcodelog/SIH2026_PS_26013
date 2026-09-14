import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || process.env.NODE_PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sih26013_landrecords',
  geoEngineUrl: process.env.GEO_ENGINE_URL || 'http://localhost:8000',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
