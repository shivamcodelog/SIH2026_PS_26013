import { projectService } from '../services/projectService.js';
import { successResponse, errorResponse } from '../types/contracts.js';

export const postDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, reviewer, comment } = req.body;

    if (!decision) {
      return res.status(400).json(errorResponse('Decision is required. Must be ACCEPT, REJECT, or RESOLVE', 400));
    }

    const upperDecision = decision.toUpperCase();
    if (!['ACCEPT', 'REJECT', 'RESOLVE'].includes(upperDecision)) {
      return res.status(400).json(
        errorResponse(`Invalid decision '${decision}'. Must be ACCEPT, REJECT, or RESOLVE`, 400)
      );
    }

    const result = await projectService.recordReviewDecision(id, {
      decision: upperDecision,
      reviewer: reviewer || 'Officer',
      comment: comment || ''
    });

    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};
