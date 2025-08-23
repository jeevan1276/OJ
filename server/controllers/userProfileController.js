import User from '../models/User.js';
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