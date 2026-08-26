import User from '../models/User.js';
import Submission from '../models/Submission.js';
import mongoose from 'mongoose';
import ErrorResponse from '../utils/errorResponse.js';
import { StatusCodes } from 'http-status-codes';

/**
 * UserService — business logic for user profile, stats, and submissions.
 * Controllers delegate to this class for all DB interaction and domain logic.
 */
export class UserService {
  /**
   * Fetch user profile (excluding password).
   */
  static async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
    return user;
  }

  /**
   * Update user profile fields (name, email, password).
   */
  static async updateProfile(userId, { fullName, email, currentPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);

    if (fullName) user.fullName = fullName;

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) throw new ErrorResponse('Email already in use', StatusCodes.BAD_REQUEST);
      user.email = email;
    }

    if (newPassword) {
      if (!currentPassword) throw new ErrorResponse('Current password is required to change password', StatusCodes.BAD_REQUEST);
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) throw new ErrorResponse('Current password is incorrect', StatusCodes.BAD_REQUEST);
      user.password = newPassword;
    }

    await user.save();
    return User.findById(user._id).select('-password');
  }

  /**
   * Get paginated user submissions with aggregate statistics.
   */
  static async getSubmissions(userId, tenantId, { page = 1, limit = 10, status, language, startDate, endDate, sortBy = 'submittedAt', sortOrder = 'desc' }) {
    const filterQuery = { user: userId, tenantId };
    if (status && status !== 'all') filterQuery.status = status;
    if (language && language !== 'all') filterQuery.language = language;
    if (startDate || endDate) {
      filterQuery.submittedAt = {};
      if (startDate) filterQuery.submittedAt.$gte = new Date(startDate);
      if (endDate) filterQuery.submittedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sortObject = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [submissions, total, userStats] = await Promise.all([
      Submission.find(filterQuery).populate('problem', 'title difficulty categories rating').sort(sortObject).skip(skip).limit(Number(limit)),
      Submission.countDocuments(filterQuery),
      Submission.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), tenantId: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: '$problem', hasAccepted: { $max: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }, totalSubmissions: { $sum: 1 } } },
        { $group: { _id: null, totalProblems: { $sum: 1 }, solvedProblems: { $sum: { $cond: [{ $eq: ['$hasAccepted', 1] }, 1, 0] } }, totalSubmissions: { $sum: '$totalSubmissions' } } }
      ])
    ]);

    return {
      submissions,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) },
      statistics: userStats[0] || { totalProblems: 0, solvedProblems: 0, totalSubmissions: 0 }
    };
  }

  /**
   * Get aggregate stats (overall, by difficulty, by category) for a user.
   */
  static async getStats(userId, tenantId) {
    const matchStage = { user: new mongoose.Types.ObjectId(userId), tenantId: new mongoose.Types.ObjectId(tenantId) };

    const [userStats, difficultyStats, categoryStats] = await Promise.all([
      Submission.aggregate([
        { $match: matchStage },
        { $group: { _id: '$problem', hasAccepted: { $max: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }, totalSubmissions: { $sum: 1 } } },
        { $group: { _id: null, totalProblems: { $sum: 1 }, solvedProblems: { $sum: { $cond: [{ $eq: ['$hasAccepted', 1] }, 1, 0] } }, totalSubmissions: { $sum: '$totalSubmissions' } } }
      ]),
      Submission.aggregate([
        { $match: matchStage },
        { $lookup: { from: 'problems', localField: 'problem', foreignField: '_id', as: 'problemData' } },
        { $unwind: '$problemData' },
        { $group: { _id: { problem: '$problem', difficulty: '$problemData.difficulty' }, hasAccepted: { $max: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } } } },
        { $group: { _id: '$_id.difficulty', totalAttempted: { $sum: 1 }, solved: { $sum: '$hasAccepted' } } }
      ]),
      Submission.aggregate([
        { $match: matchStage },
        { $lookup: { from: 'problems', localField: 'problem', foreignField: '_id', as: 'problemData' } },
        { $unwind: '$problemData' },
        { $unwind: '$problemData.categories' },
        { $group: { _id: '$problemData.categories', totalAttempted: { $sum: 1 }, solved: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } } } }
      ])
    ]);

    return {
      overall: userStats[0] || { totalProblems: 0, solvedProblems: 0, totalSubmissions: 0 },
      difficultyStats,
      categoryStats
    };
  }

  /**
   * Get paginated list of problems the user has solved (accepted submissions).
   */
  static async getSolvedProblems(userId, tenantId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const matchStage = {
      user: new mongoose.Types.ObjectId(userId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
      status: 'accepted'
    };

    const [solvedProblems, totalResult] = await Promise.all([
      Submission.aggregate([
        { $match: matchStage },
        { $group: { _id: '$problem', firstSolvedAt: { $min: '$submittedAt' }, bestExecutionTime: { $min: '$executionTime' }, bestMemoryUsed: { $min: '$memoryUsed' } } },
        { $lookup: { from: 'problems', localField: '_id', foreignField: '_id', as: 'problemData' } },
        { $unwind: '$problemData' },
        { $sort: { firstSolvedAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) }
      ]),
      Submission.aggregate([
        { $match: matchStage },
        { $group: { _id: '$problem' } },
        { $count: 'total' }
      ])
    ]);

    return {
      solvedProblems,
      pagination: {
        total: totalResult[0]?.total || 0,
        page: Number(page),
        pages: Math.ceil((totalResult[0]?.total || 0) / limit),
        limit: Number(limit)
      }
    };
  }
}
