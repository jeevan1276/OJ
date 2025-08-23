import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, googleLogin, forgotPassword, resetPassword } from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const registerValidation = [
    body('fullName').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
];

const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Please include a valid email')
];

const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.post('/google', authLimiter, googleLogin);
router.post('/forgotpassword', authLimiter, forgotPasswordValidation, forgotPassword);
router.put('/resetpassword/:resettoken', authLimiter, resetPasswordValidation, resetPassword);

export default router; 