import { StatusCodes } from 'http-status-codes';
import { UserService } from '../services/UserService.js';

/**
 * GET /api/v1/user/profile
 * Returns the authenticated user's profile (no password).
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await UserService.getProfile(req.user.id);
    res.status(StatusCodes.OK).json({ success: true, data: user });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to fetch user profile' });
  }
};

/**
 * PATCH /api/v1/user/profile
 * Updates name, email, and/or password for the authenticated user.
 */
export const updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await UserService.updateProfile(req.user.id, req.body);
    res.status(StatusCodes.OK).json({ success: true, message: 'Profile updated successfully', data: updatedUser });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};

/**
 * GET /api/v1/user/submissions
 * Returns paginated submission history + aggregate stats for the authenticated user.
 */
export const getUserSubmissions = async (req, res) => {
  try {
    const result = await UserService.getSubmissions(req.user.id, req.tenantId, req.query);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to fetch submissions' });
  }
};

/**
 * GET /api/v1/user/stats
 * Returns overall, difficulty-level, and category-level stats for the authenticated user.
 */
export const getUserStats = async (req, res) => {
  try {
    const stats = await UserService.getStats(req.user.id, req.tenantId);
    res.status(StatusCodes.OK).json({ success: true, data: stats });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to fetch statistics' });
  }
};

/**
 * GET /api/v1/user/solved
 * Returns a paginated list of problems the user has solved.
 */
export const getSolvedProblems = async (req, res) => {
  try {
    const result = await UserService.getSolvedProblems(req.user.id, req.tenantId, req.query);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to fetch solved problems' });
  }
};