import multer from 'multer';
import path from 'path';

// Memory storage keeps file buffers accessible for direct forwarding to FastAPI
const storage = multer.memoryStorage();

// File filter validates allowed spatial formats
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.geojson', '.json', '.shp', '.zip'];

  if (allowedExts.includes(ext) || file.mimetype === 'application/geo+json' || file.mimetype === 'application/json') {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type '${ext}'. Allowed formats: .geojson, .json, .shp, .zip`), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit
  },
  fileFilter
});
