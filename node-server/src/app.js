import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[node-server] API Gateway running on port ${config.port}`);
  });
}

export default app;
