import { StatusCodes } from 'http-status-codes';
import { SubmissionService } from '../services/SubmissionService.js';

/**
 * GET /api/v1/problems/:id/recent-submissions
 * Returns recent submissions for a problem by the current user, scoped to the tenant.
 */
export const getRecentSubmissions = async (req, res) => {
  try {
    const { id: problemId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    // For per-user recent submissions, filter by userId too
    const submissions = await SubmissionService.getRecentForProblem({
      problemId,
      tenantId: req.tenantId,
      limit
    });

    res.status(StatusCodes.OK).json({ success: true, data: submissions });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to fetch submissions' });
  }
};