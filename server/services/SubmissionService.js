import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * SubmissionService — business logic for querying submissions.
 * Execution logic remains in the problem controller since it is tightly coupled
 * to the compiler microservice interaction.
 */
export class SubmissionService {
  /**
   * Get the most recent submissions for a specific problem (visible to authenticated users).
   */
  static async getRecentForProblem({ problemId, tenantId, limit = 10 }) {
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      throw new ErrorResponse('Invalid problem ID', StatusCodes.BAD_REQUEST);
    }

    const submissions = await Submission.find({
      problem: problemId,
      tenantId
    })
      .sort({ submittedAt: -1 })
      .limit(Number(limit))
      .populate('user', 'fullName')
      .select('user language status executionTime memoryUsed testCasesPassed totalTestCases submittedAt');

    return submissions;
  }

  /**
   * Create a submission record.
   */
  static async create(data) {
    return Submission.create(data);
  }
}
