import express from 'express';
import { body } from 'express-validator';
import { 
  generateProblemHint, 
  getChatbotResponse, 
  getHintCountForProblem, 
  getUserHintsForProblem 
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all AI routes
router.use(protect);

/**
 * Generate AI hint for a coding problem
 * POST /api/v1/ai/hint
 */
router.post('/hint', [
  body('problemId').notEmpty().withMessage('Problem ID is required'),
  body('userCode').notEmpty().withMessage('User code is required'),
  body('hintNumber').optional().isInt({ min: 1, max: 2 }).withMessage('Hint number must be 1 or 2'),
  body('problemTitle').optional().isString(),
  body('problemDescription').optional().isString(),
  body('constraints').optional().isArray(),
  body('examples').optional().isArray()
], generateProblemHint);

/**
 * Get chatbot response
 * POST /api/v1/ai/chatbot
 */
router.post('/chatbot', [
  body('message').notEmpty().withMessage('Message is required'),
  body('context').optional().isString(),
  body('type').optional().isIn(['general', 'programming']).withMessage('Type must be general or programming'),
  body('language').optional().isString(),
  body('code').optional().isString()
], getChatbotResponse);

/**
 * Get hint count for a user and problem
 * GET /api/v1/ai/hint-count/:problemId
 */
router.get('/hint-count/:problemId', getHintCountForProblem);

/**
 * Get user hints for a problem
 * GET /api/v1/ai/hints/:problemId
 */
router.get('/hints/:problemId', getUserHintsForProblem);

export default router; 