import { Router } from 'express';
import { postDecision } from '../controllers/reviewController.js';

const router = Router();

// Review decision submission
router.post('/reviews/:id/decision', postDecision);

export default router;
