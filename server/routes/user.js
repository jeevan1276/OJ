import express from 'express';
import { body } from 'express-validator';
import { getUserProfile, updateUserProfile } from '../controllers/userProfileController.js';
import { getUserStats } from '../controllers/userStatsController.js';
import { getUserSubmissions, getSolvedProblems } from '../controllers/userSubmissionsController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);

const updateProfileValidation = [
    body('fullName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('newPassword')
        .optional()
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
];

router.get('/profile', getUserProfile);
router.patch('/profile', updateProfileValidation, updateUserProfile);

router.get('/stats', getUserStats);
router.get('/submissions', getUserSubmissions);
router.get('/solved', getSolvedProblems);

export default router; 