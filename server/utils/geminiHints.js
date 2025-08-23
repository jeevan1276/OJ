import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import HintUsage from '../models/HintUsage.js';
import mongoose from 'mongoose';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Generate AI-powered hints for a coding problem
 * @param {Object} problemData - Problem information
 * @param {string} problemData.title - Problem title
 * @param {string} problemData.description - Problem description
 * @param {Array} problemData.constraints - Problem constraints
 * @param {Array} problemData.examples - Problem examples
 * @param {string} userCode - User's current code
 * @param {number} hintNumber - Which hint to generate (1 or 2)
 * @returns {Promise<string>} Generated hint
 */
export async function generateHint(problemData, userCode, hintNumber = 1) {
  try {
    const model = ai.models;
    const context = `
Problem: ${problemData.title}

Description: ${problemData.description}

Constraints: ${problemData.constraints?.join(', ') || 'None specified'}

Examples: ${problemData.examples?.map(ex => `${ex.input} -> ${ex.output}`).join('; ') || 'None provided'}

User's Current Code:
${userCode}

Instructions: Generate hint number ${hintNumber} for this problem. 
- Hint ${hintNumber === 1 ? '1 should be a gentle nudge about the approach or algorithm' : '2 should be more specific about implementation details'}
- Keep the hint concise (max 2-3 sentences)
- Don't give away the complete solution
- Focus on guiding the user's thinking
- If hint ${hintNumber} has already been given, provide a different perspective
- Be encouraging and helpful
`;
    const response = await model.generateContent({
      model: "gemini-2.5-flash",
      contents: context,
    });
    return stripMarkdown(response.text);
  } catch (error) {
    return `Sorry, I couldn't generate a hint right now. Please try again later.`;
  }
}

/**
 * Check if user has already received hints for this problem
 * @param {string} userId - User ID
 * @param {string} problemId - Problem ID
 * @returns {Promise<number>} Number of hints already given (0, 1, or 2)
 */
export async function getHintCount(userId, problemId) {
  const doc = await HintUsage.findOne({ userId, problemId });
  let count = 0;
  if (doc) {
    if (doc.hint1) count++;
    if (doc.hint2) count++;
  }
  return count;
}

export async function getHintsForUser(userId, problemId) {
  const doc = await HintUsage.findOne({ userId, problemId });
  const hints = [];
  if (doc) {
    if (doc.hint1) hints.push(doc.hint1);
    if (doc.hint2) hints.push(doc.hint2);
  }
  return hints;
}

/**
 * Record that a hint was given to a user
 * @param {string} userId - User ID
 * @param {string} problemId - Problem ID
 * @param {number} hintNumber - Which hint was given
 */
export async function recordHintUsage(userId, problemId, hintNumber, hintText) {
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(problemId)) return;
  let doc = await HintUsage.findOne({ userId, problemId });
  if (!doc) {
    doc = new HintUsage({ userId, problemId });
  }
  if (hintNumber === 1 && !doc.hint1) {
    doc.hint1 = hintText;
  } else if (hintNumber === 2 && !doc.hint2) {
    doc.hint2 = hintText;
  }
  await doc.save();
}

// Function to strip markdown formatting (bold, italics, headings, etc.)
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
    .replace(/\*(.*?)\*/g, '$1')       // *italic*
    .replace(/__(.*?)__/g, '$1')        // __underline__
    .replace(/_(.*?)_/g, '$1')          // _italic_
    .replace(/`([^`]+)`/g, '$1')        // `code`
    .replace(/^#+\s/gm, '')            // # headings
    .replace(/^-\s/gm, '')             // - lists
    .replace(/\n{2,}/g, '\n')         // collapse multiple newlines
    .replace(/\s+$/g, '')              // trailing whitespace
    .replace(/\*/g, '')                // stray asterisks
    .replace(/\n\s*\n/g, '\n');     // extra blank lines
} 