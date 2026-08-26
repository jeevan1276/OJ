import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import mongoose from 'mongoose';
import ErrorResponse from '../utils/errorResponse.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ProblemService — business logic for problem management.
 * Controllers delegate to this class; they only handle HTTP parsing and response formatting.
 */
export class ProblemService {
  /**
   * Create a new problem for a given tenant.
   */
  static async create({ title, description, difficulty, categories, timeLimit, memoryLimit, publicTestCases, hiddenTestCases, authorId, tenantId }) {
    const existing = await Problem.findOne({ title, tenantId });
    if (existing) {
      throw new ErrorResponse('Problem with this title already exists', StatusCodes.BAD_REQUEST);
    }
    if (!categories || categories.length === 0) {
      throw new ErrorResponse('At least one category is required', StatusCodes.BAD_REQUEST);
    }
    return Problem.create({ title, description, difficulty, categories, timeLimit, memoryLimit, publicTestCases, hiddenTestCases, author: authorId, tenantId });
  }

  /**
   * List all published problems for a tenant, optionally annotating with user submission status.
   */
  static async listPublished({ tenantId, userId }) {
    const problems = await Problem.find({ isPublished: true, tenantId }).populate('author', 'fullName');

    if (!userId) {
      return problems.map(p => ({ ...p.toObject(), userStatus: 'unsolved' }));
    }

    const problemIds = problems.map(p => p._id);
    const userSubmissions = await Submission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          tenantId: new mongoose.Types.ObjectId(tenantId),
          problem: { $in: problemIds }
        }
      },
      {
        $group: {
          _id: '$problem',
          hasAccepted: { $max: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          hasAttempted: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {};
    userSubmissions.forEach(sub => {
      statusMap[sub._id.toString()] = {
        hasAccepted: sub.hasAccepted === 1,
        hasAttempted: sub.hasAttempted > 0
      };
    });

    return problems.map(problem => {
      const ps = statusMap[problem._id.toString()];
      let userStatus = 'unsolved';
      if (ps?.hasAccepted) userStatus = 'solved';
      else if (ps?.hasAttempted) userStatus = 'attempted';
      return { ...problem.toObject(), userStatus };
    });
  }

  /**
   * Get a single problem, enforcing tenant isolation and publication rules.
   */
  static async getById({ problemId, tenantId, userId, userRole }) {
    const problem = await Problem.findById(problemId).populate('author', 'fullName');
    if (!problem) throw new ErrorResponse(`Problem with id ${problemId} not found`, StatusCodes.NOT_FOUND);
    if (problem.tenantId.toString() !== tenantId.toString()) {
      throw new ErrorResponse('You do not have access to this problem.', StatusCodes.FORBIDDEN);
    }
    if (!problem.isPublished) {
      if (!userId) throw new ErrorResponse('You must be logged in to view this unpublished problem.', StatusCodes.UNAUTHORIZED);
      if (problem.author._id.toString() !== userId && userRole !== 'admin') {
        throw new ErrorResponse('You do not have permission to view this problem.', StatusCodes.FORBIDDEN);
      }
    }
    return problem;
  }

  /**
   * Update a problem, respecting ownership rules (problem-setter can only edit their own).
   */
  static async update({ problemId, tenantId, userId, userRole, updates }) {
    const problem = await Problem.findById(problemId);
    if (!problem) throw new ErrorResponse(`Problem with id ${problemId} not found`, StatusCodes.NOT_FOUND);
    if (problem.tenantId.toString() !== tenantId.toString()) {
      throw new ErrorResponse('You do not have access to this problem.', StatusCodes.FORBIDDEN);
    }

    const isAdmin = userRole === 'admin';
    const isOwner = problem.author.toString() === userId;
    if (!isAdmin && !isOwner) {
      throw new ErrorResponse('You do not have permission to update this problem.', StatusCodes.FORBIDDEN);
    }

    const { title, categories } = updates;
    if (title && title !== problem.title) {
      const existing = await Problem.findOne({ title, tenantId });
      if (existing) throw new ErrorResponse('Problem with this title already exists', StatusCodes.BAD_REQUEST);
    }
    if (categories && categories.length === 0) {
      throw new ErrorResponse('At least one category is required', StatusCodes.BAD_REQUEST);
    }

    return Problem.findByIdAndUpdate(problemId, updates, { new: true, runValidators: true }).populate('author', 'fullName');
  }

  /**
   * Delete a problem, respecting ownership rules.
   */
  static async delete({ problemId, tenantId, userId, userRole }) {
    const problem = await Problem.findById(problemId);
    if (!problem) throw new ErrorResponse(`Problem with id ${problemId} not found`, StatusCodes.NOT_FOUND);
    if (problem.tenantId.toString() !== tenantId.toString()) {
      throw new ErrorResponse('You do not have access to this problem.', StatusCodes.FORBIDDEN);
    }

    const isAdmin = userRole === 'admin';
    const isOwner = problem.author.toString() === userId;
    if (!isAdmin && !isOwner) {
      throw new ErrorResponse('You do not have permission to delete this problem.', StatusCodes.FORBIDDEN);
    }

    await problem.deleteOne();
  }

  /**
   * Get per-user submission status for a specific problem.
   */
  static async getUserStatus({ problemId, userId, tenantId }) {
    if (!userId) return 'unsolved';

    const statusResult = await Submission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          problem: new mongoose.Types.ObjectId(problemId),
          tenantId: new mongoose.Types.ObjectId(tenantId)
        }
      },
      {
        $group: {
          _id: null,
          hasAccepted: { $max: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          hasAttempted: { $sum: 1 }
        }
      }
    ]);

    if (!statusResult.length) return 'unsolved';
    const r = statusResult[0];
    if (r.hasAccepted) return 'solved';
    if (r.hasAttempted) return 'attempted';
    return 'unsolved';
  }

  /**
   * Get aggregate stats grouped by difficulty and category.
   */
  static async getStats({ tenantId }) {
    const matchStage = tenantId ? { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } } : null;
    const difficultyPipeline = [
      ...(matchStage ? [matchStage] : []),
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgAcceptanceRate: {
            $avg: {
              $cond: [
                { $eq: ['$totalSubmissions', 0] },
                0,
                { $multiply: [{ $divide: ['$successfulSubmissions', '$totalSubmissions'] }, 100] }
              ]
            }
          }
        }
      }
    ];
    const categoryPipeline = [
      ...(matchStage ? [matchStage] : []),
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } }
    ];

    const [difficultyStats, categoryStats] = await Promise.all([
      Problem.aggregate(difficultyPipeline),
      Problem.aggregate(categoryPipeline)
    ]);
    return { difficultyStats, categoryStats };
  }
}
