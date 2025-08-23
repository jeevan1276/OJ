import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import ErrorResponse from '../utils/errorResponse.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch user profile'
        });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { fullName, email, currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
        }

        if (fullName) {
            user.fullName = fullName;
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new ErrorResponse('Email already in use', StatusCodes.BAD_REQUEST);
            }
            user.email = email;
        }

        if (newPassword) {
            if (!currentPassword) {
                throw new ErrorResponse('Current password is required to change password', StatusCodes.BAD_REQUEST);
            }

            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                throw new ErrorResponse('Current password is incorrect', StatusCodes.BAD_REQUEST);
            }

            user.password = newPassword;
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update profile'
        });
    }
};

export const getUserSubmissions = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            language, 
            startDate, 
            endDate,
            sortBy = 'submittedAt',
            sortOrder = 'desc'
        } = req.query;

        const filterQuery = { user: req.user.id };
        
        if (status && status !== 'all') {
            filterQuery.status = status;
        }
        
        if (language && language !== 'all') {
            filterQuery.language = language;
        }
        
        if (startDate || endDate) {
            filterQuery.submittedAt = {};
            if (startDate) {
                filterQuery.submittedAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filterQuery.submittedAt.$lte = new Date(endDate);
            }
        }

        const skip = (page - 1) * limit;

        const sortObject = {};
        sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const submissions = await Submission.find(filterQuery)
            .populate('problem', 'title difficulty categories rating')
            .sort(sortObject)
            .skip(skip)
            .limit(Number(limit));

        const total = await Submission.countDocuments(filterQuery);

        const userStats = await Submission.getUserStats(req.user.id);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                submissions,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / limit),
                    limit: Number(limit)
                },
                statistics: userStats[0] || {
                    totalProblems: 0,
                    solvedProblems: 0,
                    totalSubmissions: 0
                }
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch submissions'
        });
    }
};

export const getUserStats = async (req, res) => {
    try {
        const userStats = await Submission.getUserStats(req.user.id);
        
        const difficultyStats = await Submission.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(req.user.id) }
            },
            {
                $lookup: {
                    from: 'problems',
                    localField: 'problem',
                    foreignField: '_id',
                    as: 'problemData'
                }
            },
            { $unwind: '$problemData' },
            {
                $group: {
                    _id: { problem: '$problem', difficulty: '$problemData.difficulty' },
                    hasAccepted: { $max: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
                }
            },
            {
                $group: {
                    _id: '$_id.difficulty',
                    totalAttempted: { $sum: 1 },
                    solved: { $sum: '$hasAccepted' }
                }
            }
        ]);

        const categoryStats = await Submission.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(req.user.id) }
            },
            {
                $lookup: {
                    from: 'problems',
                    localField: 'problem',
                    foreignField: '_id',
                    as: 'problemData'
                }
            },
            {
                $unwind: '$problemData'
            },
            {
                $unwind: '$problemData.categories'
            },
            {
                $group: {
                    _id: '$problemData.categories',
                    totalAttempted: { $sum: 1 },
                    solved: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                overall: userStats[0] || {
                    totalProblems: 0,
                    solvedProblems: 0,
                    totalSubmissions: 0
                },
                difficultyStats,
                categoryStats
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};

export const getSolvedProblems = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const solvedProblems = await Submission.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    status: 'accepted'
                }
            },
            {
                $group: {
                    _id: '$problem',
                    firstSolvedAt: { $min: '$submittedAt' },
                    bestExecutionTime: { $min: '$executionTime' },
                    bestMemoryUsed: { $min: '$memoryUsed' }
                }
            },
            {
                $lookup: {
                    from: 'problems',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'problemData'
                }
            },
            {
                $unwind: '$problemData'
            },
            {
                $sort: { firstSolvedAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: Number(limit)
            }
        ]);
            
        const total = await Submission.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    status: 'accepted'
                }
            },
            {
                $group: {
                    _id: '$problem'
                }
            },
            {
                $count: 'total'
            }
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                solvedProblems,
                pagination: {
                    total: total[0]?.total || 0,
                    page: Number(page),
                    pages: Math.ceil((total[0]?.total || 0) / limit),
                    limit: Number(limit)
                }
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch solved problems'
        });
    }
}; 