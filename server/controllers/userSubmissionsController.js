import Submission from '../models/Submission.js';
import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import { StatusCodes } from 'http-status-codes';

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