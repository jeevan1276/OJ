// Utility functions for persisting user code in localStorage

const STORAGE_PREFIX = 'algo_judge_code_';

/**
 * Generate a unique key for storing code for a specific problem and language
 * @param {string} userId - The user ID
 * @param {string} problemId - The problem ID
 * @param {string} language - The programming language
 * @returns {string} The storage key
 */
export const getStorageKey = (userId, problemId, language) => {
  return `${STORAGE_PREFIX}${userId}_${problemId}_${language}`;
};

/**
 * Save user code to localStorage
 * @param {string} userId - The user ID
 * @param {string} problemId - The problem ID
 * @param {string} language - The programming language
 * @param {string} code - The user's code
 */
export const saveCode = (userId, problemId, language, code) => {
  try {
    const key = getStorageKey(userId, problemId, language);
    localStorage.setItem(key, code);
  } catch (error) {
  }
};

/**
 * Load user code from localStorage
 * @param {string} userId - The user ID
 * @param {string} problemId - The problem ID
 * @param {string} language - The programming language
 * @returns {string|null} The saved code or null if not found
 */
export const loadCode = (userId, problemId, language) => {
  try {
    const key = getStorageKey(userId, problemId, language);
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

/**
 * Clear saved code for a specific problem and language
 * @param {string} userId - The user ID
 * @param {string} problemId - The problem ID
 * @param {string} language - The programming language
 */
export const clearCode = (userId, problemId, language) => {
  try {
    const key = getStorageKey(userId, problemId, language);
    localStorage.removeItem(key);
  } catch (error) {
  }
};

/**
 * Check if there's saved code for a specific problem and language
 * @param {string} userId - The user ID
 * @param {string} problemId - The problem ID
 * @param {string} language - The programming language
 * @returns {boolean} True if saved code exists
 */
export const hasSavedCode = (userId, problemId, language) => {
  try {
    const key = getStorageKey(userId, problemId, language);
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get all saved codes for a specific problem across all languages
 * @param {string} userId - The user ID
 * @param {string} problemId - The problem ID
 * @returns {Object} Object with language as key and code as value
 */
export const getAllSavedCodes = (userId, problemId) => {
  const savedCodes = {};
  try {
    const languages = ['java', 'cpp', 'c'];
    languages.forEach(language => {
      const code = loadCode(userId, problemId, language);
      if (code) {
        savedCodes[language] = code;
      }
    });
  } catch (error) {
  }
  return savedCodes;
};

export const clearAllUserCodes = (userId) => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${STORAGE_PREFIX}${userId}_`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
  }
}; 