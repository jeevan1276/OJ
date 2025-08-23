import mongoose from 'mongoose';
import 'dotenv/config';
import Problem from '../models/Problem.js';
import User from '../models/User.js';

const testProblems = [
    {
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        difficulty: "Easy",
        rating: 1200,
        categories: ["Array", "Hash Table", "Two Pointers"],
        timeLimit: 2000,
        memoryLimit: 512,
        constraints: [
            "2 ≤ n ≤ 10^4",
            "-10^9 ≤ nums[i] ≤ 10^9",
            "-10^9 ≤ target ≤ 10^9"
        ],
        publicTestCases: [
            {
                input: "nums = [2,7,11,15], target = 9",
                output: "[0,1]",
                explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
                input: "nums = [3,2,4], target = 6",
                output: "[1,2]",
                explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
            }
        ],
        hiddenTestCases: [
            {
                input: "nums = [3,3], target = 6",
                output: "[0,1]"
            },
            {
                input: "nums = [1,2,3,4,5,6,7,8,9,10], target = 19",
                output: "[8,9]"
            },
            {
                input: "nums = [0,4,3,0], target = 0",
                output: "[0,3]"
            },
            {
                input: "nums = [2,5,5,11], target = 10",
                output: "[1,2]"
            },
            {
                input: "nums = [1000000000, -1000000000], target = 0",
                output: "[0,1]"
            },
            {
                input: "nums = [2,7,11,15,1,8], target = 9",
                output: "[0,1]"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
            java: `public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
            c: `#include <stdlib.h>\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n    *returnSize = 0;\n    return NULL;\n}`
        },
        functionSignature: {
            cpp: "vector<int> twoSum(vector<int>& nums, int target)",
            java: "public int[] twoSum(int[] nums, int target)",
            c: "int* twoSum(int* nums, int numsSize, int target, int* returnSize)"
        },
        functionName: "twoSum",
        customTestCaseInputTemplate: "nums=[2,7,11,15], target=9"
    },
    {
        title: "Valid Palindrome",
        description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string s, return true if it is a palindrome, or false otherwise.",
        difficulty: "Easy",
        rating: 1300,
        categories: ["String", "Two Pointers"],
        timeLimit: 2000,
        memoryLimit: 512,
        constraints: [
            "1 ≤ s.length ≤ 2 * 10^5",
            "s consists only of printable ASCII characters"
        ],
        publicTestCases: [
            {
                input: 's = "A man a plan a canal Panama"',
                output: "true",
                explanation: "After removing non-alphanumeric characters: 'amanaplanacanalpanama' which reads the same forward and backward."
            },
            {
                input: 's = "race a car"',
                output: "false",
                explanation: "After removing non-alphanumeric characters: 'raceacar' which does not read the same forward and backward."
            }
        ],
        hiddenTestCases: [
            {
                input: 's = " "',
                output: "true"
            },
            {
                input: 's = "racecar"',
                output: "true"
            },
            {
                input: 's = "Was it a car or a cat I saw"',
                output: "true"
            },
            {
                input: 's = "hello"',
                output: "false"
            },
            {
                input: 's = "12321"',
                output: "true"
            },
            {
                input: 's = "0P"',
                output: "false"
            },
            {
                input: 's = "A1b2C3c2b1a"',
                output: "true"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        \n    }\n};`,
            java: `public class Solution {\n    public boolean isPalindrome(String s) {\n        \n    }\n}`,
            c: `#include <stdbool.h>\n#include <string.h>\nbool isPalindrome(char* s) {\n    \n}`
        },
        functionSignature: {
            cpp: "bool isPalindrome(string s)",
            java: "public boolean isPalindrome(String s)",
            c: "bool isPalindrome(char* s)"
        },
        functionName: "isPalindrome",
        customTestCaseInputTemplate: 's="A man a plan a canal Panama"'
    },
    {
        title: "Longest Substring Without Repeating Characters",
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        difficulty: "Hard",
        rating: 1900,
        categories: ["String", "Sliding Window", "Hash Table"],
        timeLimit: 3000,
        memoryLimit: 1024,
        constraints: [
            "1 ≤ s.length ≤ 5 * 10^4",
            "s consists of English letters, digits, symbols and spaces."
        ],
        publicTestCases: [
            {
                input: 's = "abcabcbb"',
                output: "3",
                explanation: "The answer is 'abc', with the length of 3."
            },
            {
                input: 's = "bbbbb"',
                output: "1",
                explanation: "The answer is 'b', with the length of 1."
            }
        ],
        hiddenTestCases: [
            {
                input: 's = "pwwkew"',
                output: "3"
            },
            {
                input: 's = "dvdf"',
                output: "3"
            },
            {
                input: 's = "abba"',
                output: "2"
            },
            {
                input: 's = "a"',
                output: "1"
            },
            {
                input: 's = "abcabcbb"',
                output: "3"
            },
            {
                input: 's = "bbtablud"',
                output: "6"
            },
            {
                input: 's = "tmmzuxt"',
                output: "5"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};`,
            java: `public class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}`,
            c: `#include <string.h>\nint lengthOfLongestSubstring(char* s) {\n    \n}`
        },
        functionSignature: {
            cpp: "int lengthOfLongestSubstring(string s)",
            java: "public int lengthOfLongestSubstring(String s)",
            c: "int lengthOfLongestSubstring(char* s)"
        },
        functionName: "lengthOfLongestSubstring",
        customTestCaseInputTemplate: 's="abcabcbb"'
    },
    {
        title: "Container With Most Water",
        description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines, which, together with the x-axis forms a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
        difficulty: "Medium",
        rating: 1700,
        categories: ["Array", "Two Pointers", "Greedy"],
        timeLimit: 2000,
        memoryLimit: 512,
        constraints: [
            "n == height.length",
            "2 ≤ n ≤ 10^5",
            "0 ≤ height[i] ≤ 10^4"
        ],
        publicTestCases: [
            {
                input: "height = [1,8,6,2,5,4,8,3,7]",
                output: "49",
                explanation: "The maximum area is obtained by choosing height[1] = 8 and height[8] = 7, giving us 8 * (8-1) = 49."
            },
            {
                input: "height = [1,1]",
                output: "1",
                explanation: "The maximum area is 1 * 1 = 1."
            }
        ],
        hiddenTestCases: [
            {
                input: "height = [4,3,2,1,4]",
                output: "16"
            },
            {
                input: "height = [1,2,1]",
                output: "2"
            },
            {
                input: "height = [2,3,4,5,18,17,6]",
                output: "17"
            },
            {
                input: "height = [1,8,6,2,5,4,8,3,7]",
                output: "49"
            },
            {
                input: "height = [10,9,8,7,6,5,4,3,2,1]",
                output: "25"
            },
            {
                input: "height = [1,2,3,4,5,6,7,8,9,10]",
                output: "25"
            },
            {
                input: "height = [5,5,5,5,5]",
                output: "20"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};`,
            java: `public class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}`,
            c: `int maxArea(int* height, int heightSize) {\n    \n}`
        },
        functionSignature: {
            cpp: "int maxArea(vector<int>& height)",
            java: "public int maxArea(int[] height)",
            c: "int maxArea(int* height, int heightSize)"
        },
        functionName: "maxArea",
        customTestCaseInputTemplate: "height=[1,8,6,2,5,4,8,3,7]"
    },
    {
        title: "3Sum",
        description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
        difficulty: "Medium",
        rating: 1800,
        categories: ["Array", "Two Pointers", "Sorting"],
        timeLimit: 3000,
        memoryLimit: 1024,
        constraints: [
            "3 ≤ nums.length ≤ 3000",
            "-10^5 ≤ nums[i] ≤ 10^5"
        ],
        publicTestCases: [
            {
                input: "nums = [-1,0,1,2,-1,-4]",
                output: "[[-1,-1,2],[-1,0,1]]",
                explanation: "The triplets that sum to zero are [-1,-1,2] and [-1,0,1]."
            },
            {
                input: "nums = [0,1,1]",
                output: "[]",
                explanation: "The only possible triplet does not sum up to 0."
            }
        ],
        hiddenTestCases: [
            {
                input: "nums = [0,0,0]",
                output: "[[0,0,0]]"
            },
            {
                input: "nums = [-2,0,1,1,2]",
                output: "[[-2,0,2],[-2,1,1]]"
            },
            {
                input: "nums = [-1,0,1,2,-1,-4]",
                output: "[[-1,-1,2],[-1,0,1]]"
            },
            {
                input: "nums = [1,2,-2,-1]",
                output: "[]"
            },
            {
                input: "nums = [3,0,-2,-1,1,2]",
                output: "[[-2,-1,3],[-2,0,2],[-1,0,1]]"
            },
            {
                input: "nums = [-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]",
                output: "[[-4,-2,6],[-4,0,4],[-4,1,3],[-4,2,2],[-2,-2,4],[-2,0,2]]"
            },
            {
                input: "nums = [0,0,0,0]",
                output: "[[0,0,0]]"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};`,
            java: `import java.util.*;\npublic class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}`,
            c: `#include <stdlib.h>\nint** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    \n}`
        },
        functionSignature: {
            cpp: "vector<vector<int>> threeSum(vector<int>& nums)",
            java: "public List<List<Integer>> threeSum(int[] nums)",
            c: "int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes)"
        },
        functionName: "threeSum",
        customTestCaseInputTemplate: "nums=[-1,0,1,2,-1,-4]"
    },
    {
        title: "Reverse Integer",
        description: "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.",
        difficulty: "Medium",
        rating: 1400,
        categories: ["Math"],
        timeLimit: 2000,
        memoryLimit: 512,
        constraints: [
            "-2^31 ≤ x ≤ 2^31 - 1"
        ],
        publicTestCases: [
            {
                input: "x = 123",
                output: "321",
                explanation: "123 reversed is 321."
            },
            {
                input: "x = -123",
                output: "-321",
                explanation: "-123 reversed is -321."
            }
        ],
        hiddenTestCases: [
            {
                input: "x = 120",
                output: "21"
            },
            {
                input: "x = 0",
                output: "0"
            },
            {
                input: "x = 1534236469",
                output: "0"
            },
            {
                input: "x = -2147483648",
                output: "0"
            },
            {
                input: "x = 1000",
                output: "1"
            },
            {
                input: "x = 1000000003",
                output: "0"
            },
            {
                input: "x = 1463847412",
                output: "2147483641"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `class Solution {\npublic:\n    int reverse(int x) {\n        \n    }\n};`,
            java: `public class Solution {\n    public int reverse(int x) {\n        \n    }\n}`,
            c: `int reverse(int x) {\n    \n}`
        },
        functionSignature: {
            cpp: "int reverse(int x)",
            java: "public int reverse(int x)",
            c: "int reverse(int x)"
        },
        functionName: "reverse",
        customTestCaseInputTemplate: "x=123"
    },
    {
        title: "String to Integer (atoi)",
        description: "Implement the myAtoi(string s) function, which converts a string to a 32-bit signed integer (similar to C/C++'s atoi function). The algorithm for myAtoi(string s) is as follows: 1. Read in and ignore any leading whitespace. 2. Check if the next character (if not already at the end of the string) is '-' or '+'. Read this character in if it is either. This determines if the final result is negative or positive respectively. 3. Read in next the characters until the next non-digit character or the end of the input is reached. The rest of the string is ignored. 4. Convert these digits into an integer (i.e. '123' -> 123, '0032' -> 32). If no digits were read, then the integer is 0. Change the sign as necessary (from step 2). 5. If the integer is out of the 32-bit signed integer range [-2^31, 2^31 - 1], then clamp the integer so that it remains in the range. Specifically, integers less than -2^31 should be clamped to -2^31, and integers greater than 2^31 - 1 should be clamped to 2^31 - 1. 6. Return the integer as the final result.",
        difficulty: "Medium",
        rating: 1600,
        categories: ["String", "Math"],
        timeLimit: 2000,
        memoryLimit: 512,
        constraints: [
            "0 ≤ s.length ≤ 200",
            "s consists of English letters (lower-case and upper-case), digits (0-9), ' ', '+', '-', and '.'."
        ],
        publicTestCases: [
            {
                input: 's = "42"',
                output: "42",
                explanation: "The underlined characters are what is read in, the caret is the current reader position."
            },
            {
                input: 's = "   -42"',
                output: "-42",
                explanation: "Leading whitespace is ignored and '-' is read, so the result is negative."
            }
        ],
        hiddenTestCases: [
            {
                input: 's = "4193 with words"',
                output: "4193"
            },
            {
                input: 's = "words and 987"',
                output: "0"
            },
            {
                input: 's = "-91283472332"',
                output: "-2147483648"
            },
            {
                input: 's = "3.14159"',
                output: "3"
            },
            {
                input: 's = "+1"',
                output: "1"
            },
            {
                input: 's = "   +0 123"',
                output: "0"
            },
            {
                input: 's = "21474836460"',
                output: "2147483647"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int myAtoi(string s) {\n        \n    }\n};`,
            java: `public class Solution {\n    public int myAtoi(String s) {\n        \n    }\n}`,
            c: `#include <string.h>\nint myAtoi(char* s) {\n    \n}`
        },
        functionSignature: {
            cpp: "int myAtoi(string s)",
            java: "public int myAtoi(String s)",
            c: "int myAtoi(char* s)"
        },
        functionName: "myAtoi",
        customTestCaseInputTemplate: 's="42"'
    },
    {
        title: "Roman to Integer",
        description: "Roman numerals are represented by seven different symbols: I, V, X, L, C, D and M. Symbol Value I 1 V 5 X 10 L 50 C 100 D 500 M 1000 For example, 2 is written as II in Roman numeral, just two one's added together. 12 is written as XII, which is simply X + II. The number 27 is written as XXVII, which is XX + V + II. Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not IIII. Instead, the number four is written as IV. Because the one is before the five we subtract it making four. The same principle applies to the number nine, which is written as IX. There are six instances where subtraction is used: I can be placed before V (5) and X (10) to make 4 and 9. X can be placed before L (50) and C (100) to make 40 and 90. C can be placed before D (500) and M (1000) to make 400 and 900. Given a roman numeral, convert it to an integer.",
        difficulty: "Easy",
        rating: 1100,
        categories: ["String", "Math", "Hash Table"],
        timeLimit: 2000,
        memoryLimit: 512,
        constraints: [
            "1 ≤ s.length ≤ 15",
            "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M')",
            "It is guaranteed that s is a valid roman numeral in the range [1, 3999]"
        ],
        publicTestCases: [
            {
                input: 's = "III"',
                output: "3",
                explanation: "III = 3."
            },
            {
                input: 's = "LVIII"',
                output: "58",
                explanation: "L = 50, V = 5, III = 3."
            }
        ],
        hiddenTestCases: [
            {
                input: 's = "MCMXCIV"',
                output: "1994"
            },
            {
                input: 's = "IV"',
                output: "4"
            },
            {
                input: 's = "IX"',
                output: "9"
            },
            {
                input: 's = "XL"',
                output: "40"
            },
            {
                input: 's = "XC"',
                output: "90"
            },
            {
                input: 's = "CD"',
                output: "400"
            },
            {
                input: 's = "CM"',
                output: "900"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int romanToInt(string s) {\n        \n    }\n};`,
            java: `public class Solution {\n    public int romanToInt(String s) {\n        \n    }\n}`,
            c: `#include <string.h>\nint romanToInt(char* s) {\n    \n}`
        },
        functionSignature: {
            cpp: "int romanToInt(string s)",
            java: "public int romanToInt(String s)",
            c: "int romanToInt(char* s)"
        },
        functionName: "romanToInt",
        customTestCaseInputTemplate: 's="III"'
    },
    {
        title: "Longest Common Prefix",
        description: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string ''.",
        difficulty: "Easy",
        rating: 1200,
        categories: ["String"],
        timeLimit: 2000,
        memoryLimit: 512,
        constraints: [
            "1 ≤ strs.length ≤ 200",
            "0 ≤ strs[i].length ≤ 200",
            "strs[i] consists of only lowercase English letters"
        ],
        publicTestCases: [
            {
                input: 'strs = ["flower","flow","flight"]',
                output: "'fl'",
                explanation: "The longest common prefix is 'fl'."
            },
            {
                input: 'strs = ["dog","racecar","car"]',
                output: "''",
                explanation: "There is no common prefix among the input strings."
            }
        ],
        hiddenTestCases: [
            {
                input: 'strs = ["interspecies","interstellar","interstate"]',
                output: "'inters'"
            },
            {
                input: 'strs = ["throne","throne"]',
                output: "'throne'"
            },
            {
                input: 'strs = [""]',
                output: "''"
            },
            {
                input: 'strs = ["a"]',
                output: "'a'"
            },
            {
                input: 'strs = ["aa","a"]',
                output: "'a'"
            },
            {
                input: 'strs = ["aaa","aa","aaa"]',
                output: "'aa'"
            },
            {
                input: 'strs = ["ab","a"]',
                output: "'a'"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n        \n    }\n};`,
            java: `public class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        \n    }\n}`,
            c: `#include <stdlib.h>\n#include <string.h>\nchar* longestCommonPrefix(char** strs, int strsSize) {\n    \n}`
        },
        functionSignature: {
            cpp: "string longestCommonPrefix(vector<string>& strs)",
            java: "public String longestCommonPrefix(String[] strs)",
            c: "char* longestCommonPrefix(char** strs, int strsSize)"
        },
        functionName: "longestCommonPrefix",
        customTestCaseInputTemplate: 'strs=["flower","flow","flight"]'
    },
    {
        title: "Valid Parentheses",
        description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order. Every close bracket has a corresponding open bracket of the same type.",
        difficulty: "Easy",
        rating: 1300,
        categories: ["String", "Stack"],
        timeLimit: 2000,
        memoryLimit: 512,
        constraints: [
            "1 ≤ s.length ≤ 10^4",
            "s consists of parentheses only '()[]{}'"
        ],
        publicTestCases: [
            {
                input: 's = "()"',
                output: "true",
                explanation: "Simple valid parentheses."
            },
            {
                input: 's = "()[]{}"',
                output: "true",
                explanation: "All brackets are properly closed."
            }
        ],
        hiddenTestCases: [
            {
                input: 's = "(]"',
                output: "false"
            },
            {
                input: 's = "([)]"',
                output: "false"
            },
            {
                input: 's = "{[]}"',
                output: "true"
            },
            {
                input: 's = "((("',
                output: "false"
            },
            {
                input: 's = ")))"',
                output: "false"
            },
            {
                input: 's = "([{}])"',
                output: "true"
            },
            {
                input: 's = "(([]){})"',
                output: "true"
            }
        ],
        isPublished: true,
        starterCode: {
            cpp: `#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};`,
            java: `import java.util.*;\npublic class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}`,
            c: `#include <stdbool.h>\n#include <string.h>\nbool isValid(char* s) {\n    \n}`
        },
        functionSignature: {
            cpp: "bool isValid(string s)",
            java: "public boolean isValid(String s)",
            c: "bool isValid(char* s)"
        },
        functionName: "isValid",
        customTestCaseInputTemplate: 's="()"'
    }
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);

        // Create an admin user if it doesn't exist
        const adminUser = await User.findOne({ email: 'admin@example.com' });
        let adminId;

        if (!adminUser) {
            const newAdmin = await User.create({
                fullName: 'Admin User',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin'
            });
            adminId = newAdmin._id;
        } else {
            adminId = adminUser._id;
        }

        // Delete existing problems
        await Problem.deleteMany({});

        // Add admin ID to all problems
        const problemsWithAuthor = testProblems.map(problem => ({
            ...problem,
            author: adminId
        }));

        // Insert new problems
        await Problem.insertMany(problemsWithAuthor);

        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
};

seedDatabase(); 