# Code Persistence in Problem Code Editor

> **Note:** This document merges the original and updated documentation for code persistence in the problem editor.

## Problem Faced

When users typed code in the code editor for a problem and then refreshed the page or navigated away and back, their code was lost and reset to the default template or starter code. This was frustrating, especially if the user accidentally refreshed or switched problems, as all their work would be lost.

Additionally, the initial approach to code persistence using `localStorage` for each problem and language combination had some issues:

- **Blank Editor Issue:** If a user visited a problem/language for the first time, or if the saved code in `localStorage` was an empty string, the editor would show up blank instead of displaying the starter code or template. This led to confusion and a poor user experience.
- **Overwriting Starter Code:** The logic always loaded from `localStorage` if any value was present, even if it was empty or not relevant, causing the starter code to be skipped.
- **Affecting Other Problems:** The issue could propagate to other problems if the same logic was used, making it hard for users to recover the intended starter code.

## Why It Happened

- The code editor's state was only kept in React state (`useState`).
- On refresh or navigation, the state was reset, and the editor loaded the default or starter code for the problem/language.
- There was no persistence mechanism to save the user's code between sessions or navigation.
- The initial localStorage logic did not properly distinguish between empty and non-empty saved code, leading to blank editors and starter code being skipped.

## Solution Implemented

### 1. Improved Local Storage Persistence
- We used `localStorage` to persist the user's code for each problem and language combination, with a key like `problem_code_{problemId}_{language}`.
- On loading a problem (or changing language), the editor first checks for saved code in `localStorage`.
  - Only use the code from `localStorage` if it is non-empty. If there is no saved code or it is empty, fall back to the starter code or default template.
  - This ensures that the editor is never blank unless the user explicitly deletes all code.

### 2. Handling Edge Cases
- If the user intentionally clears the editor (empty string), this is also saved and respected on reload.
- If the user resets the code to the template, the saved code is cleared from `localStorage`.
- The persistence logic is robust to switching between problems and languages.

### 3. Refactored Persistence Utilities
- Moved code persistence logic to a utility file (`utils/codePersistence.js`) for better maintainability and reusability.
- Provided helper functions: `saveCode`, `loadCode`, `clearCode`, and `hasSavedCode`.

### 4. User Experience Enhancements
- Added a reset button (with Ctrl+R shortcut) to allow users to quickly revert their code to the original template/starter code for the current problem and language.
- When resetting, the saved code in `localStorage` is cleared.
- Added an indicator for unsaved changes, so users know if their code has diverged from the template.
- Added a warning before leaving the page with unsaved changes.
- Automatically refresh recent submissions after a successful submission.

## Final Approach (Summary)
- On every code change, save the code to `localStorage` (unless it matches the template, in which case clear it).
- On loading a problem/language, check for saved code first (only if non-empty), then fall back to the template.
- Use utility functions for saving, loading, and clearing code for maintainability.
- The code editor now reliably restores the last code the user wrote for each problem and language, and the starter code is always shown for new problems/languages or when the user resets their code.
- The user experience is improved with clear feedback, reset functionality, and unsaved changes warnings.

---

This approach ensures that users never lose their work due to accidental refreshes or navigation, and provides a much better coding experience in the online judge platform. 

**This README documents the debugging and solution process for code persistence in the problem editor.** 