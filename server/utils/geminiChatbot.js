import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Function to strip markdown formatting (bold, italics, headings, etc.)
function stripMarkdown(text) {
  // Remove **bold**, *italic*, __underline__, _italic_, etc.
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

// Platform knowledge base for the chatbot
const PLATFORM_KNOWLEDGE = `
You are a helpful AI assistant for an online coding judge platform called "Algo Judge". Here's what you know about the platform:

PLATFORM FEATURES:
- Users can solve coding problems in C, C++, and Java
- Problems have different difficulty levels (Easy, Medium, Hard)
- Users can submit code and get immediate feedback
- Code is automatically saved as users type
- Users can reset their code to the template
- There's a recent submissions feature to track progress
- Users have profiles with statistics and submission history
- The platform is designed for a smooth, modern, and user-friendly experience
- All submissions are auto-graded and feedback is instant
- The system is optimized for high concurrency and performance

EDITOR & AUTOCOMPLETE:
- The code editor is powered by Monaco Editor (the same editor used in VS Code)
- Monaco Editor provides syntax highlighting, code folding, and a modern coding experience
- The platform uses a custom Trie data structure for autosuggestions in C, C++, and Java
- Autosuggestions include language keywords, standard library functions, and user-defined identifiers
- The Trie learns as you code, making suggestions more personalized over time
- Autocomplete is fast, relevant, and tailored for competitive programming
- The editor supports keyboard shortcuts for reset, save, and more

EXTRA FEATURES:
- Users can view and expand recent submissions with syntax highlighting
- The platform provides visual feedback for unsaved changes and code resets
- There is a warning if you try to leave the page with unsaved code
- The system is extensible and can be expanded to support more languages and features
- The backend is built for security, scalability, and reliability

ABOUT THE DEVELOPER:
- Algo Judge is developed and maintained by Harshit Gupta.
- He's passionate about building scalable, user-friendly technology for programmers.
- You can connect with him here:
  LinkedIn: https://www.linkedin.com/in/harshit-27gupta/
  Instagram: https://www.instagram.com/harshitraj6133/
  GitHub: https://github.com/harshit27gupta
- Feel free to encourage users to connect or follow Harshit on these platforms.

RESPONSE GUIDELINES:
- Be friendly, encouraging, and helpful
-Limit response to 2-3 lines unless clarification is explicitly requested.
-Avoid restating the question unless it's required for clarity.
- Keep responses very concise and to the point do not give long responses and do not give any extra information
- If you don't know something specific about the platform, say so
- Focus on being educational and supportive
-Avoid over-explaining standard behavior. Only clarify platform-specific behavior.
- Don't provide complete solutions to coding problems, just guidance
-
- Do not use markdown, asterisks, or any special formatting like bold or italics. Write in plain text only.
`;

/**
 * Generate chatbot response based on user message
 * @param {string} userMessage - User's message/question
 * @param {string} context - Additional context (optional)
 * @returns {Promise<string>} Chatbot response
 */
export async function generateChatbotResponse(userMessage, context = '') {
  try {
    const prompt = `
${PLATFORM_KNOWLEDGE}

User Message: "${userMessage}"

${context ? `Additional Context: ${context}` : ''}

Please provide a helpful response to the user's question or request.
Be friendly, concise, and educational.
Do not use markdown, asterisks, or any special formatting like bold or italics. Write in plain text only.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return stripMarkdown(response.text);
    
  } catch (error) {
    return `I'm sorry, I'm having trouble responding right now. Please try again later or contact support.`;
  }
}

/**
 * Generate programming help response
 * @param {string} question - Programming question
 * @param {string} language - Programming language (optional)
 * @param {string} code - User's code (optional)
 * @returns {Promise<string>} Programming help response
 */
export async function generateProgrammingHelp(question, language = '', code = '') {
  try {
    const prompt = `
You are a helpful programming tutor for an online coding judge platform.

Programming Question: "${question}"

${language ? `Language: ${language}` : ''}

${code ? `User's Code:\n${code}` : ''}

Please provide helpful guidance on this programming question. 
- Explain concepts clearly and concisely
- If code is provided, suggest improvements or point out issues
- Don't provide complete solutions, just guidance and explanations
- Be encouraging and educational
- Focus on teaching the concept, not just fixing the code
- Do not use markdown, asterisks, or any special formatting like bold or italics. Write in plain text only.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return stripMarkdown(response.text);
    
  } catch (error) {
    return `I'm sorry, I'm having trouble providing programming help right now. Please try again later.`;
  }
} 