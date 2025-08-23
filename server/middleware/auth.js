import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const deserializeUser = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
            if (!req.user) {
                req.authError = { type: 'UserNotFound' };
            }
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                req.authError = { type: 'TokenExpiredError' };
            } else {
                req.authError = { type: 'InvalidToken' };
            }
        }
    }
    next();
};

export const protect = (req, res, next) => {
    if (req.user) {
        return next();
    }

    if (req.authError?.type === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Your session has expired. Please log in again .'
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Please log in to use this feature.'
    });
};

export const authenticateUser = protect;

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Your user role (${req.user.role}) is not authorized to perform this action.`
            });
        }
        next();
    };
};

export const authorizeRoles = authorize; 