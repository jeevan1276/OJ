import { generateHint } from './utils/geminiHints.js';
import { generateChatbotResponse, generateProgrammingHelp } from './utils/geminiChatbot.js';

async function testAIFeatures() {
  // Test 1: Hint Generation
  try {
    const problemData = {
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      constraints: ["2 <= nums.length <= 104", "-109 <= nums[i] <= 109", "-109 <= target <= 109"],
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
      ]
    };

    const userCode = `
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // TODO: Implement solution
    return NULL;
}
`;

    const hint = await generateHint(problemData, userCode, 1);

  } catch (error) {
  }

  // Test 2: Chatbot Response
  try {
    const response = await generateChatbotResponse("How do I submit my code?");

  } catch (error) {
  }

  // Test 3: Programming Help
  try {
    const helpResponse = await generateProgrammingHelp(
      "What's wrong with my code?",
      "C++",
      `
#include <iostream>
using namespace std;

int main() {
    int x = 5;
    cout << x;
    return 0;
}
`
    );

  } catch (error) {
  }
}

// Run the test
testAIFeatures(); 