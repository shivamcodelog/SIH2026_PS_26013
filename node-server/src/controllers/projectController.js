import { projectService } from '../services/projectService.js';
import { aiService } from '../services/aiService.js';
import { successResponse, errorResponse } from '../types/contracts.js';

export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json(errorResponse('Project name is required', 400));
    }
    const project = await projectService.createProject({ name, description });
    return res.status(201).json(successResponse({ project }));
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects();
    return res.status(200).json(successResponse({ projects }));
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);
    if (!project) {
      return res.status(404).json(errorResponse(`Project '${id}' not found`, 404));
    }
    return res.status(200).json(successResponse({ project }));
  } catch (err) {
    next(err);
  }
};

export const addDataset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sourceType, fileFormat, crs, geojson } = req.body;

    let fileBuffer = req.file ? req.file.buffer : null;
    let fileName = req.file ? req.file.originalname : (req.body.fileName || null);

    // If GeoJSON was passed in JSON body
    if (!fileBuffer && geojson) {
      fileBuffer = Buffer.from(typeof geojson === 'string' ? geojson : JSON.stringify(geojson));
      fileName = fileName || `${sourceType || 'dataset'}.geojson`;
    }

    const dataset = await projectService.addDataset(id, {
      name,
      sourceType: sourceType || (req.body.source_type),
      fileBuffer,
      fileName,
      fileFormat: fileFormat || 'GeoJSON',
      crs: crs || 'EPSG:4326'
    });

    return res.status(201).json(successResponse({ dataset }));
  } catch (err) {
    next(err);
  }
};

export const getDatasets = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datasets = await projectService.getDatasets(id);
    return res.status(200).json(successResponse({ datasets }));
  } catch (err) {
    next(err);
  }
};

export const processProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const options = {
      threshold: req.body.threshold !== undefined ? parseFloat(req.body.threshold) : undefined,
      spatial_weight: req.body.spatial_weight !== undefined ? parseFloat(req.body.spatial_weight) : undefined,
      area_weight: req.body.area_weight !== undefined ? parseFloat(req.body.area_weight) : undefined,
      attribute_weight: req.body.attribute_weight !== undefined ? parseFloat(req.body.attribute_weight) : undefined
    };

    const result = await projectService.processProject(id, options);
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

export const getResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filters = {
      status: req.query.status,
      search: req.query.search
    };
    const result = await projectService.getProjectResults(id, filters);
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

export const getConflicts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filters = {
      resolved: req.query.resolved,
      severity: req.query.severity
    };
    const conflicts = await projectService.getProjectConflicts(id, filters);
    return res.status(200).json(successResponse({ conflicts }));
  } catch (err) {
    next(err);
  }
};

export const getMap = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mapData = await projectService.getProjectMap(id);
    return res.status(200).json(successResponse({ map: mapData }));
  } catch (err) {
    next(err);
  }
};

export const exportGeoJSON = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mapData = await projectService.getProjectMap(id);
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="project_${id}_unified.geojson"`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(mapData));
  } catch (err) {
    next(err);
  }
};

export const exportCSV = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await projectService.getProjectResults(id, {});
    
    if (!result.records || result.records.length === 0) {
      return res.status(404).json(errorResponse('No records found to export', 404));
    }

    // Define CSV header
    const headers = [
      'Match ID', 'Parcel ID', 'Owner Name', 'Area (sqm)', 'Building ID', 
      'Confidence (%)', 'Status', 'Conflicts Count', 'Spatial Score', 
      'Area Score', 'Attribute Score'
    ];

    // Map records to CSV rows
    const rows = result.records.map(r => {
      return [
        r.id,
        r.parcel_id || '',
        `"${(r.owner_name || '').replace(/"/g, '""')}"`,
        r.area || '',
        r.building_id || '',
        r.confidence || '',
        r.status || '',
        r.conflicts ? r.conflicts.length : 0,
        r.spatial_score || '',
        r.area_score || '',
        r.attribute_score || ''
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Disposition', `attachment; filename="project_${id}_results.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

export const explainConflict = async (req, res, next) => {
  try {
    const recordData = req.body.recordData; 
    
    if (!recordData) {
      return res.status(400).json(errorResponse('recordData is required', 400));
    }

    const explanation = await aiService.explainConflict(recordData);
    return res.status(200).json(successResponse(explanation));
  } catch (err) {
    next(err);
  }
};

export const suggestMapping = async (req, res, next) => {
  try {
    const { headers } = req.body;
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json(errorResponse('headers array is required', 400));
    }

    const suggestions = await aiService.suggestSchemaMapping(headers);
    return res.status(200).json(successResponse(suggestions));
  } catch (err) {
    next(err);
  }
};
