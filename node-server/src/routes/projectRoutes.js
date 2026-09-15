import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  addDataset,
  getDatasets,
  processProject,
  getResults,
  getConflicts,
  getMap,
  exportGeoJSON,
  exportCSV,
  explainConflict,
  suggestMapping
} from '../controllers/projectController.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Projects CRUD & status
router.post('/projects', createProject);
router.get('/projects', getProjects);
router.get('/projects/:id', getProjectById);

// Datasets management
router.post('/projects/:id/datasets', upload.single('file'), addDataset);
router.get('/projects/:id/datasets', getDatasets);

// Harmonization pipeline
router.post('/projects/:id/process', processProject);

// Results & GIS Map exports
router.get('/projects/:id/results', getResults);
router.get('/projects/:id/conflicts', getConflicts);
router.get('/projects/:id/map', getMap);

// Data Export
router.get('/projects/:id/export/geojson', exportGeoJSON);
router.get('/projects/:id/export/csv', exportCSV);

// AI Assistance
router.post('/ai/explain-conflict', explainConflict);
router.post('/ai/suggest-mapping', suggestMapping);

export default router;
