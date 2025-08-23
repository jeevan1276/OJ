import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function testGeminiAPI() {
  try {
    
    // Simple test prompt
    const prompt = "Hello how are you?";
    
    // Generate content
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
  } catch (error) {
    if (error.message.includes('API_KEY')) {
    } else if (error.message.includes('quota')) {
    } else if (error.message.includes('network')) {
    }
  }
}

// Run the test
testGeminiAPI();