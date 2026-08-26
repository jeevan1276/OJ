import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import HintUsage from '../models/HintUsage.js';
import mongoose from 'mongoose';
import { semanticCacheGenerate } from './semanticCache.js';

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
    // Cache key: use context as the semantic query (deduplicated by similarity)
    const { response } = await semanticCacheGenerate(context, async () => {
      const model = ai.models;
      const result = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: context,
      });
      return stripMarkdown(result.text);
    });
    return response;
  } catch (error) {
    return `Sorry, I couldn't generate a hint right now. Please try again later.`;
  }
}

/**
 * Check if user has already received hints for this problem
 * @param {string} userId - User ID
 * @param {string} problemId - Problem ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<number>} Number of hints already given (0, 1, or 2)
 */
export async function getHintCount(userId, problemId, tenantId) {
  const doc = await HintUsage.findOne({ userId, problemId, tenantId });
  let count = 0;
  if (doc) {
    if (doc.hint1) count++;
    if (doc.hint2) count++;
  }
  return count;
}

export async function getHintsForUser(userId, problemId, tenantId) {
  const doc = await HintUsage.findOne({ userId, problemId, tenantId });
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
 * @param {string} tenantId - Tenant ID
 * @param {number} hintNumber - Which hint was given
 */
export async function recordHintUsage(userId, problemId, tenantId, hintNumber, hintText) {
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(problemId) || !mongoose.Types.ObjectId.isValid(tenantId)) return;
  let doc = await HintUsage.findOne({ userId, problemId, tenantId });
  if (!doc) {
    doc = new HintUsage({ userId, problemId, tenantId });
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