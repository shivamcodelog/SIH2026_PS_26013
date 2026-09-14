import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import projectRoutes from './projectRoutes.js';
import reviewRoutes from './reviewRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/', projectRoutes);
router.use('/', reviewRoutes);

export default router;
