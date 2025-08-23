import { generateHint, getHintCount, recordHintUsage, getHintsForUser } from '../utils/geminiHints.js';
import { generateChatbotResponse, generateProgrammingHelp } from '../utils/geminiChatbot.js';
import { validationResult } from 'express-validator';

/**
 * Generate AI hint for a coding problem
 * POST /api/v1/ai/hint
 */
export const generateProblemHint = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request data',
        errors: errors.array() 
      });
    }

    const { problemId, userCode, hintNumber } = req.body;
    const userId = req.user.id; // From auth middleware

    // Get current hints
    const currentHints = await getHintsForUser(userId, problemId);
    const currentHintCount = currentHints.length;
    if (currentHintCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'You have already received the maximum number of hints for this problem.',
        data: { hints: currentHints, hintNumber: 2, hintsRemaining: 0 }
      });
    }

    // Determine which hint to generate
    const nextHintNumber = currentHintCount + 1;
    const requestedHintNumber = hintNumber || nextHintNumber;

    if (requestedHintNumber > 2) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 2 hints allowed per problem.',
        data: { hints: currentHints, hintNumber: 2, hintsRemaining: 0 }
      });
    }

    // Get problem data from database (you'll need to implement this)
    // For now, we'll use placeholder data
    const problemData = {
      title: req.body.problemTitle || 'Coding Problem',
      description: req.body.problemDescription || 'Solve this coding problem',
      constraints: req.body.constraints || [],
      examples: req.body.examples || []
    };

    // Only generate a new hint if not already present
    let hint;
    if (currentHints.length >= requestedHintNumber) {
      hint = currentHints[requestedHintNumber - 1];
    } else {
      hint = await generateHint(problemData, userCode, requestedHintNumber);
      await recordHintUsage(userId, problemId, requestedHintNumber, hint);
    }

    // Get updated hints and count
    const updatedHints = await getHintsForUser(userId, problemId);
    const updatedHintCount = updatedHints.length;

    res.json({
      success: true,
      message: 'Hint generated successfully',
      data: {
        hint,
        hintNumber: requestedHintNumber,
        hints: updatedHints,
        hintsRemaining: 2 - updatedHintCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate hint. Please try again.'
    });
  }
};

/**
 * Get chatbot response
 * POST /api/v1/ai/chatbot
 */
export const getChatbotResponse = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request data',
        errors: errors.array() 
      });
    }

    const { message, context, type = 'general' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    let response;

    if (type === 'programming') {
      // Handle programming-specific questions
      const { language, code } = req.body;
      response = await generateProgrammingHelp(message, language, code);
    } else {
      // Handle general platform questions
      response = await generateChatbotResponse(message, context);
    }

    res.json({
      success: true,
      message: 'Response generated successfully',
      data: {
        response,
        type
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get response. Please try again.'
    });
  }
};

/**
 * Get hint count for a user and problem
 * GET /api/v1/ai/hint-count/:problemId
 */
export const getHintCountForProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.id;

    const hintCount = await getHintCount(userId, problemId);

    res.json({
      success: true,
      data: {
        hintCount,
        hintsRemaining: 2 - hintCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get hint count.'
    });
  }
};

/**
 * Get all user hints for a problem
 * GET /api/v1/ai/hints/:problemId
 */
export const getUserHintsForProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.id;
    const hints = await getHintsForUser(userId, problemId);
    res.json({
      success: true,
      data: { hints }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch hints.' });
  }
}; 