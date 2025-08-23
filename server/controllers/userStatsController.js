import Submission from '../models/Submission.js';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

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