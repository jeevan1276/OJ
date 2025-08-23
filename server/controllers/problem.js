import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { StatusCodes } from 'http-status-codes';
import ErrorResponse from '../utils/errorResponse.js';
import mongoose from 'mongoose';
import axios from 'axios';
import 'dotenv/config';
const COMPILER_URL =  process.env.COMPILER_URL;
export const createProblem = async (req, res) => {
    const { title, description, difficulty, categories, timeLimit, memoryLimit, publicTestCases, hiddenTestCases } = req.body;

    const existingProblem = await Problem.findOne({ title });
    if (existingProblem) {
        throw new ErrorResponse('Problem with this title already exists', StatusCodes.BAD_REQUEST);
    }

    if (!categories || categories.length === 0) {
        throw new ErrorResponse('At least one category is required', StatusCodes.BAD_REQUEST);
    }

    const problem = await Problem.create({
        title,
        description,
        difficulty,
        categories,
        timeLimit,
        memoryLimit,
        publicTestCases,
        hiddenTestCases,
        author: req.user.id
    });

    res.status(StatusCodes.CREATED).json({
        success: true,
        data: problem
    });
};

export const getAllProblems = async (req, res) => {
    try {
        const startTime = Date.now();
        
        const problems = await Problem.find({ isPublished: true })
            .populate('author', 'fullName');

        let problemsWithStatus = problems;
        
        if (req.user) {
            const problemIds = problems.map(p => p._id);
            
            const userSubmissions = await Submission.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(req.user.id),
                        problem: { $in: problemIds }
                    }
                },
                {
                    $group: {
                        _id: '$problem',
                        hasAccepted: {
                            $max: {
                                $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
                            }
                        },
                        hasAttempted: { $sum: 1 },
                        latestStatus: { $first: '$status' }
                    }
                }
            ]);

            const statusMap = {};
            userSubmissions.forEach(sub => {
                statusMap[sub._id.toString()] = {
                    hasAccepted: sub.hasAccepted === 1,
                    hasAttempted: sub.hasAttempted > 0,
                    latestStatus: sub.latestStatus
                };
            });

            problemsWithStatus = problems.map(problem => {
                const problemStatus = statusMap[problem._id.toString()];
                let userStatus = 'unsolved';
                
                if (problemStatus) {
                    if (problemStatus.hasAccepted) {
                        userStatus = 'solved';
                    } else if (problemStatus.hasAttempted) {
                        userStatus = 'attempted';
                    }
                }

                return {
                    ...problem.toObject(),
                    userStatus
                };
            });
        } else {
            problemsWithStatus = problems.map(problem => ({
                ...problem.toObject(),
                userStatus: 'unsolved'
            }));
        }

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        res.status(StatusCodes.OK).json({
            success: true,
            data: problemsWithStatus
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch problems'
        });
    }
};

export const getUserProblemStatus = async (req, res) => {
    try {
        const { problemId } = req.params;
        
        if (!req.user) {
            return res.status(StatusCodes.OK).json({
                success: true,
                data: { status: 'unsolved' }
            });
        }

        const statusResult = await Submission.getUserProblemStatus(req.user.id, problemId);
        
        let status = 'unsolved';
        if (statusResult.length > 0) {
            const result = statusResult[0];
            if (result.hasAccepted) {
                status = 'solved';
            } else if (result.hasAttempted) {
                status = 'attempted';
            }
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: { status }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch problem status'
        });
    }
};

export const getProblem = async (req, res) => {
    const { id } = req.params;

    const problem = await Problem.findById(id)
        .populate('author', 'fullName');

    if (!problem) {
        throw new ErrorResponse(`Problem with id ${id} not found`, StatusCodes.NOT_FOUND);
    }

    if (!problem.isPublished) {
        if (!req.user) {
            throw new ErrorResponse('You must be logged in to view this unpublished problem.', StatusCodes.UNAUTHORIZED);
        }
        
        if (problem.author._id.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new ErrorResponse('You do not have permission to view this problem.', StatusCodes.FORBIDDEN);
        }
    }

    res.status(StatusCodes.OK).json({
        success: true,
        data: problem
    });
};

export const updateProblem = async (req, res) => {
    const { id } = req.params;
    const { 
        title, 
        description, 
        difficulty, 
        categories, 
        timeLimit, 
        memoryLimit, 
        publicTestCases, 
        hiddenTestCases, 
        isPublished 
    } = req.body;

    const problem = await Problem.findById(id);

    if (!problem) {
        throw new ErrorResponse(`Problem with id ${id} not found`, StatusCodes.NOT_FOUND);
    }

    if (problem.author.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new ErrorResponse('You do not have permission to update this problem.', StatusCodes.FORBIDDEN);
    }

    if (title && title !== problem.title) {
        const existingProblem = await Problem.findOne({ title });
        if (existingProblem) {
            throw new ErrorResponse('Problem with this title already exists', StatusCodes.BAD_REQUEST);
        }
    }

    if (categories && categories.length === 0) {
        throw new ErrorResponse('At least one category is required', StatusCodes.BAD_REQUEST);
    }

    const updatedProblem = await Problem.findByIdAndUpdate(
        id,
        {
            title,
            description,
            difficulty,
            categories,
            timeLimit,
            memoryLimit,
            publicTestCases,
            hiddenTestCases,
            isPublished
        },
        { new: true, runValidators: true }
    ).populate('author', 'fullName');

    res.status(StatusCodes.OK).json({
        success: true,
        data: updatedProblem
    });
};

export const deleteProblem = async (req, res) => {
    const { id } = req.params;

    const problem = await Problem.findById(id);

    if (!problem) {
        throw new ErrorResponse(`Problem with id ${id} not found`, StatusCodes.NOT_FOUND);
    }

    if (problem.author.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new ErrorResponse('You do not have permission to delete this problem.', StatusCodes.FORBIDDEN);
    }

    await problem.deleteOne();

    res.status(StatusCodes.OK).json({
        success: true,
        data: {}
    });
};

function enforceCppSignature(userCode, requiredSignature, requiredName) {
  const functionRegex = /(\w+(?:<[^>]+>)?[\s\*&]+\w+)\s*\([^)]*\)\s*\{/;
  const match = userCode.match(functionRegex);
  
  if (match) {      
    return userCode.replace(functionRegex, `${requiredSignature} {`);
  }
  
  return userCode;
}

function enforceJavaSignature(userCode, requiredSignature, requiredName) {
  let modifiedCode = userCode;
  
  modifiedCode = modifiedCode.replace(/public\s+class\s+[A-Za-z0-9_]+/, 'public class Solution');
  modifiedCode = modifiedCode.replace(/class\s+[A-Za-z0-9_]+/, 'class Solution');
  
  const methodRegex = /public\s+\w+(?:<[^>]+>)?\s+\w+\s*\([^)]*\)\s*\{/;
  const match = modifiedCode.match(methodRegex);
  
  if (match) {
    return modifiedCode.replace(methodRegex, `${requiredSignature} {`);
  }
  
  return modifiedCode;
}

function enforceCSignature(userCode, requiredSignature, requiredName) {
  const functionRegex = /\w+\s+\w+\s*\([^)]*\)\s*\{/;
  const match = userCode.match(functionRegex);
  
  if (match) {
    return userCode.replace(functionRegex, `${requiredSignature} {`);
  }
  
  return userCode;
}

function wrapCppCode(userCode, testInput, functionName, functionSignature) {
  // Extract return type from function signature
  const returnTypeMatch = functionSignature.match(/^\w+(?:<[^>]+>)?\s+/);
  const resultType = returnTypeMatch ? returnTypeMatch[0].trim() : 'int';

  // Parse input parameters
  let inputLines = [];
  let params = [];
  
  // Handle different input formats
  const matches = [...testInput.matchAll(/(\w+)\s*=\s*(\[[^\]]*\]|"[^"]*"|\S+)/g)];
  
  for (const match of matches) {
    const varName = match[1];
    let value = match[2].trim();
    params.push(varName);
    
    if (value.startsWith('[')) {
      // Array input
      const arr = value.replace(/[\[\]\s]/g, '').split(',').filter(Boolean);
      if (arr.length > 0 && arr[0].includes('"')) {
        // String array
        const stringArr = value.match(/"([^"]*)"/g) || [];
        inputLines.push(`vector<string> ${varName} = {${stringArr.join(',')}};`);
      } else {
        // Integer array
        inputLines.push(`vector<int> ${varName} = {${arr.join(',')}};`);
      }
    } else if (value.startsWith('"')) {
      // String input
      inputLines.push(`string ${varName} = ${value};`);
    } else {
      // Numeric or boolean input
      if (value === 'true' || value === 'false') {
        inputLines.push(`bool ${varName} = ${value};`);
      } else {
        inputLines.push(`int ${varName} = ${value};`);
      }
    }
  }

  // Generate appropriate print statement based on return type
  let printResult = '';
  if (resultType === 'vector<int>') {
    printResult = `cout << "[";\n    for (size_t i = 0; i < result.size(); ++i) {\n        cout << result[i];\n        if (i + 1 < result.size()) cout << ",";\n    }\n    cout << "]" << endl;`;
  } else if (resultType === 'vector<vector<int>>') {
    printResult = `cout << "[";\n    for (size_t i = 0; i < result.size(); ++i) {\n        cout << "[";\n        for (size_t j = 0; j < result[i].size(); ++j) {\n            cout << result[i][j];\n            if (j + 1 < result[i].size()) cout << ",";\n        }\n        cout << "]";\n        if (i + 1 < result.size()) cout << ",";\n    }\n    cout << "]" << endl;`;
  } else if (resultType === 'string') {
    printResult = `cout << "\\"" << result << "\\"" << endl;`;
  } else if (resultType === 'bool') {
    printResult = `cout << (result ? "true" : "false") << endl;`;
  } else {
    printResult = `cout << result << endl;`;
  }

  // Always instantiate Solution and call as solution.functionName(params)
  const functionCall = `Solution solution;\nauto result = solution.${functionName}(${params.join(', ')});`;
  
  return `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\n${userCode}\n\nint main() {\n    ${inputLines.join('\n    ')}\n    ${functionCall}\n    ${printResult}\n    return 0;\n}`;
}

function cleanCompilerError(stderr, language, originalUserCode = '') {
  if (!stderr) return { message: '', lines: [] };
  let USER_CODE_LINE_OFFSET = 3;
  let regex;
  
  if (language === 'java') {
    regex = /(?:.*[\\/])?([A-Za-z0-9_]+)\.java:(\d+):\s*(error|warning):\s*(.*)/;
    
    let offset = 0;
    
    if (originalUserCode.includes('public class ')) {
      offset = 0;
    } else {
      offset = 2;
    }
    
    if (originalUserCode.includes('HashMap') || 
        originalUserCode.includes('Map<') ||
        originalUserCode.includes('ArrayList') || 
        originalUserCode.includes('List<') ||
        originalUserCode.includes('Arrays.') ||
        originalUserCode.includes('Collections.') ||
        originalUserCode.includes('PriorityQueue') ||
        originalUserCode.includes('HashSet') || 
        originalUserCode.includes('Set<') ||
        originalUserCode.includes('LinkedList') ||
        originalUserCode.includes('Queue<') ||
        originalUserCode.includes('Stack')) {
      const hasUtilImport = originalUserCode.includes('import java.util.*;') || 
                           originalUserCode.includes('import java.util.*');
      if (!hasUtilImport) {
        offset += 1;
      }
    }
    
    USER_CODE_LINE_OFFSET = offset;
  } else {
    regex = /(?:.*[\\/])?([A-Za-z0-9_\.]+):(\d+):(?:\d+:)?\s*(error|warning):\s*(.*)/;
  }
  
  const lines = stderr.split('\n');
  let formatted = [];
  let errorLines = [];
  for (let line of lines) {
    const match = line.match(regex);
    if (match) {
      let userLine = Math.max(1, parseInt(match[2], 10) - USER_CODE_LINE_OFFSET);
      let message = language === 'java'
        ? match[4].trim()
        : match[4].replace(/\s*\[[^\]]*\]$/, '').trim();
      formatted.push(`Line ${userLine}: error: ${message}`);
      errorLines.push(userLine);
    }
  }
  return {
    message: formatted.length ? formatted.join('\n') : stderr.trim(),
    lines: errorLines
  };
}

export const runCode = async (req, res) => {
  const { id } = req.params;
  const { code, language } = req.body;

  if (!code || !language) {
      throw new ErrorResponse('Code and language are required', StatusCodes.BAD_REQUEST);
  }

  const problem = await Problem.findById(id);

  if (!problem) {
      throw new ErrorResponse(`Problem with id ${id} not found`, StatusCodes.NOT_FOUND);
  }

  const supportedLanguages = ['cpp', 'c', 'java'];
  if (!supportedLanguages.includes(language)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Only C, C++, and Java are supported.'
      });
  }

  let requiredSignature, requiredName, wrapCodeFn;
  if (language === 'cpp') {
    requiredSignature = problem.functionSignature?.get('cpp') || 'vector<int> solution(vector<int>& nums, int target)';
    requiredName = problem.functionName || 'solution';
    wrapCodeFn = wrapCppCode;
  } else if (language === 'c') {
    requiredSignature = problem.functionSignature?.get('c') || 'int* solution(int* nums, int numsSize, int target, int* returnSize)';
    requiredName = problem.functionName || 'solution';
    wrapCodeFn = wrapCCode;
  } else if (language === 'java') {
    requiredSignature = problem.functionSignature?.get('java') || 'public int[] solution(int[] nums, int target)';
    requiredName = problem.functionName || 'solution';
    wrapCodeFn = wrapJavaCode;
      }
  const results = [];
  for (let i = 0; i < problem.publicTestCases.length; i++) {
      const testCase = problem.publicTestCases[i];
      let userCodeFixed = code;
      if (language === 'cpp') userCodeFixed = enforceCppSignature(code, requiredSignature, requiredName);
      if (language === 'java') {
        userCodeFixed = enforceJavaSignature(code, requiredSignature, requiredName);
        userCodeFixed = addJavaImports(userCodeFixed);
      }
      if (language === 'c') userCodeFixed = enforceCSignature(code, requiredSignature, requiredName);
      const wrappedCode = wrapCodeFn(userCodeFixed, testCase.input, requiredName, requiredSignature);
      try {
          const compileRes = await axios.post(COMPILER_URL, {
              language,
              code: wrappedCode,
              input: ''
          }, { timeout: 10000 });
          const errorObj = cleanCompilerError(compileRes.data.stderr || '', language, code);
          let output = (compileRes.data.stdout || '').trim();
          if (output.endsWith(',')) output = output.slice(0, -1);
          const expected = testCase.output.trim();
          results.push({
              id: i,
              input: testCase.input,
              expected,
              output,
              status: output === expected ? 'passed' : 'failed',
              stderr: errorObj.message,
              errorLines: errorObj.lines,
              execTime: compileRes.data.execTime || null
          });
      } catch (err) {
          let errorMessage = '';
          if (err.response?.data?.stderr) {
              errorMessage = typeof err.response.data.stderr === 'string' 
                  ? err.response.data.stderr 
                  : JSON.stringify(err.response.data.stderr);
          } else if (err.message) {
              errorMessage = err.message;
          } else {
              errorMessage = 'Unknown compilation error';
          }
          const errorObj = cleanCompilerError(errorMessage, language, code);
          results.push({
              id: i,
              input: testCase.input,
              expected: testCase.output.trim(),
              output: '',
              status: 'error',
              stderr: errorObj.message,
              errorLines: errorObj.lines,
              execTime: null
          });
      }
  }
  res.status(StatusCodes.OK).json({
      success: true,
      data: results
  });
};


export const submitSolution = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, language } = req.body;

        const problem = await Problem.findById(id);

        if (!problem) {
            throw new ErrorResponse(`Problem with id ${id} not found`, StatusCodes.NOT_FOUND);
        }

        const supportedLanguages = ['cpp', 'c', 'java'];
        if (!supportedLanguages.includes(language)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Only C, C++, and Java are supported for submissions.'
            });
        }

        const allTestCases = [...problem.publicTestCases, ...problem.hiddenTestCases];
        const totalTestCases = allTestCases.length;
        
        if (totalTestCases === 0) {
            throw new ErrorResponse('No test cases found for this problem', StatusCodes.BAD_REQUEST);
        }

        let requiredSignature, requiredName, wrapCodeFn;
        if (language === 'cpp') {
            requiredSignature = problem.functionSignature?.get('cpp') || 'vector<int> solution(vector<int>& nums, int target)';
            requiredName = problem.functionName || 'solution';
            wrapCodeFn = wrapCppCode;
        } else if (language === 'c') {
            requiredSignature = problem.functionSignature?.get('c') || 'int* solution(int* nums, int numsSize, int target, int* returnSize)';
            requiredName = problem.functionName || 'solution';
            wrapCodeFn = wrapCCode;
        } else if (language === 'java') {
            requiredSignature = problem.functionSignature?.get('java') || 'public int[] solution(int[] nums, int target)';
            requiredName = problem.functionName || 'solution';
            wrapCodeFn = wrapJavaCode;
        }

        const results = [];
        let totalExecutionTime = 0;
        let totalMemoryUsed = 0;
        let testCasesPassed = 0;
        let status = 'accepted';
        let errorMessage = '';

        let compileCheckInput = '';
        if (allTestCases.length > 0) {
            compileCheckInput = allTestCases[0].input || '';
        }
        let compileCheckCode = code;
        if (language === 'cpp') compileCheckCode = enforceCppSignature(code, requiredSignature, requiredName);
        if (language === 'java') {
            compileCheckCode = enforceJavaSignature(code, requiredSignature, requiredName);
            compileCheckCode = addJavaImports(compileCheckCode);
        }
        if (language === 'c') compileCheckCode = enforceCSignature(code, requiredSignature, requiredName);
        const compileCheckWrapped = wrapCodeFn(compileCheckCode, compileCheckInput, requiredName, requiredSignature);
        try {
            const compileRes = await axios.post(COMPILER_URL, {
                language,
                code: compileCheckWrapped,
                input: ''
            }, { timeout: 10000 });
            if (compileRes.data.stderr && compileRes.data.stderr.trim() !== '') {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Compilation Error',
                    status: 'compilation_error',
                    error: compileRes.data.stderr
                });
            }
        } catch (err) {
            let errorMessage = '';
            if (err.response?.data?.stderr) {
                errorMessage = typeof err.response.data.stderr === 'string' 
                    ? err.response.data.stderr 
                    : JSON.stringify(err.response.data.stderr);
            } else if (err.message) {
                errorMessage = err.message;
            } else {
                errorMessage = 'Unknown compilation error';
            }
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Compilation Error',
                status: 'compilation_error',
                error: errorMessage
            });
        }

        for (let i = 0; i < allTestCases.length; i++) {
            const testCase = allTestCases[i];
            
            let userCodeFixed = code;
            if (language === 'cpp') userCodeFixed = enforceCppSignature(code, requiredSignature, requiredName);
            if (language === 'java') {
                userCodeFixed = enforceJavaSignature(code, requiredSignature, requiredName);
                userCodeFixed = addJavaImports(userCodeFixed);
            }
            if (language === 'c') userCodeFixed = enforceCSignature(code, requiredSignature, requiredName);
            
            const wrappedCode = wrapCodeFn(userCodeFixed, testCase.input, requiredName, requiredSignature);
            
            try {
                const compileRes = await axios.post(COMPILER_URL, {
                    language,
                    code: wrappedCode,
                    input: ''
                }, { timeout: 10000 });
                const execTime = compileRes.data.execTime || 0;
                totalExecutionTime += execTime;
                
                const errorObj = cleanCompilerError(compileRes.data.stderr || '', language, code);
                let output = (compileRes.data.stdout || '').trim();
                if (output.endsWith(',')) output = output.slice(0, -1);
                const expected = testCase.output.trim();
                
                const testResult = {
                    id: i,
                    input: testCase.input,
                    expected,
                    output,
                    status: output === expected ? 'passed' : 'failed',
                    stderr: errorObj.message,
                    errorLines: errorObj.lines,
                    execTime
                };
                
                results.push(testResult);
                
                if (compileRes.data.stderr && compileRes.data.stderr.trim() !== '') {
                    status = 'runtime_error';
                    errorMessage = compileRes.data.stderr;
                    await Submission.create({
                        user: req.user.id,
                        problem: id,
                        code,
                        language,
                        status,
                        executionTime: totalExecutionTime,
                        memoryUsed: totalMemoryUsed,
                        testCasesPassed,
                        totalTestCases,
                        errorMessage: errorMessage || 'Runtime Error'
                    });
                    return res.status(StatusCodes.OK).json({
                        success: false,
                        message: 'Runtime Error',
                        status: 'runtime_error',
                        error: errorMessage,
                        testCasesPassed,
                        totalTestCases
                    });
                }
                
                if (testResult.status === 'passed') {
                    testCasesPassed++;
                } else {
                    status = 'wrong_answer';
                    await Submission.create({
                        user: req.user.id,
                        problem: id,
                        code,
                        language,
                        status,
                        executionTime: totalExecutionTime,
                        memoryUsed: totalMemoryUsed,
                        testCasesPassed,
                        totalTestCases,
                        errorMessage: errorMessage || 'Wrong Answer'
                    });
                    return res.status(StatusCodes.OK).json({
                        success: false,
                        message: 'Wrong Answer',
                        status: 'wrong_answer',
                        data: {
                            failedCase: {
                                index: i + 1,
                                input: testCase.input,
                                expected: expected,
                                output: output
                            },
                            testCasesPassed,
                            totalTestCases
                        }
                    });
                }

                if (execTime > problem.timeLimit) {
                    status = 'time_limit_exceeded';
                    break;
                }
                
                const memoryUsed = Math.floor(Math.random() * 50) + 10;
                totalMemoryUsed = Math.max(totalMemoryUsed, memoryUsed);
                
            } catch (error) {
                status = 'runtime_error';
                errorMessage = error.message || 'Execution failed';
                await Submission.create({
                    user: req.user.id,
                    problem: id,
                    code,
                    language,
                    status,
                    executionTime: totalExecutionTime,
                    memoryUsed: totalMemoryUsed,
                    testCasesPassed,
                    totalTestCases,
                    errorMessage: errorMessage || 'Execution failed'
                });
                break;
            }
        }

        const submission = await Submission.create({
            user: req.user.id,
            problem: id,
            code,
            language,
            status,
            executionTime: totalExecutionTime,
            memoryUsed: totalMemoryUsed,
            testCasesPassed,
            totalTestCases,
            errorMessage: errorMessage || 'Execution failed'
        });

        problem.totalSubmissions += 1;
        if (status === 'accepted') {
            problem.successfulSubmissions += 1;
        }
        await problem.save();

        if (status === 'runtime_error') {
            return res.status(StatusCodes.OK).json({
                success: false,
                message: 'Runtime Error',
                status: 'runtime_error',
                error: errorMessage,
                testCasesPassed,
                totalTestCases
            });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Solution submitted successfully',
            data: {
                submissionId: submission._id,
                status,
                executionTime: totalExecutionTime,
                memoryUsed: totalMemoryUsed,
                testCasesPassed,
                totalTestCases,
                successRate: Math.round((testCasesPassed / totalTestCases) * 100),
                errorMessage: errorMessage || undefined
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to submit solution'
        });
    }
};
export const getProblemStats = async (req, res) => {
    const stats = await Problem.aggregate([
        {
            $group: {
                _id: '$difficulty',
                count: { $sum: 1 },
                avgRating: { $avg: '$rating' },
                avgAcceptanceRate: {
                    $avg: {
                        $cond: [
                            { $eq: ['$totalSubmissions', 0] },
                            0,
                            { $multiply: [{ $divide: ['$successfulSubmissions', '$totalSubmissions'] }, 100] }
                        ]
                    }
                }
            }
        }
    ]);

    const categoryStats = await Problem.aggregate([
        { $unwind: '$categories' },
        {
            $group: {
                _id: '$categories',
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(StatusCodes.OK).json({
        success: true,
        data: {
            difficultyStats: stats,
            categoryStats
        }
    });
};

function wrapJavaCode(userCode, testInput, functionName, functionSignature) {
  // Extract return type from function signature (handles arrays and generics)
  const returnTypeMatch = functionSignature.match(/public\s+([^\s]+(\s*<[^>]+>)?(\[\])*)\s+\w+\s*\(/);
  const resultType = returnTypeMatch ? returnTypeMatch[1].trim() : 'int';

  // Parse input parameters
  let inputLines = [];
  let params = [];
  
  // Handle different input formats
  const matches = [...testInput.matchAll(/(\w+)\s*=\s*(\[[^\]]*\]|"[^"]*"|\S+)/g)];
  
  for (const match of matches) {
    const varName = match[1];
    let value = match[2].trim();
    params.push(varName);
    
    if (value.startsWith('[')) {
      // Array input
      const arr = value.replace(/[\[\]\s]/g, '').split(',').filter(Boolean);
      if (arr.length > 0 && arr[0].includes('"')) {
        // String array
        const stringArr = value.match(/"([^"]*)"/g) || [];
        inputLines.push(`String[] ${varName} = {${stringArr.join(',')}};`);
      } else {
        // Integer array
        inputLines.push(`int[] ${varName} = {${arr.join(',')}};`);
      }
    } else if (value.startsWith('"')) {
      // String input
      inputLines.push(`String ${varName} = ${value};`);
    } else {
      // Numeric or boolean input
      if (value === 'true' || value === 'false') {
        inputLines.push(`boolean ${varName} = ${value};`);
      } else {
        inputLines.push(`int ${varName} = ${value};`);
      }
    }
  }

  // Generate appropriate print statement based on return type
  let printResult = '';
  if (resultType === 'int[]') {
    printResult = `System.out.print("[");\n        for (int i = 0; i < result.length; i++) {\n            System.out.print(result[i]);\n            if (i + 1 < result.length) System.out.print(",");\n        }\n        System.out.println("]");`;
  } else if (resultType === 'List<List<Integer>>') {
    printResult = `System.out.println(result);`;
  } else if (resultType === 'String') {
    printResult = `System.out.println(result);`;
  } else if (resultType === 'boolean') {
    printResult = `System.out.println(result);`;
  } else if (resultType === 'int') {
    printResult = `System.out.println(result);`;
  } else {
    printResult = `System.out.println(result);`;
  }

  const mainMethod = `\n    public static void main(String[] args) {\n        ${inputLines.join('\n        ')}\n        Solution solution = new Solution();\n        ${resultType} result = solution.${functionName}(${params.join(', ')});\n        ${printResult}\n    }`;

  // Insert main and helpers into user code
  const hasClass = userCode.includes('public class ') || userCode.includes('class ');
  if (hasClass) {
    let modifiedCode = userCode.replace(/public\s+class\s+[A-Za-z0-9_]+/, 'public class Solution');
    modifiedCode = modifiedCode.replace(/class\s+[A-Za-z0-9_]+/, 'class Solution');
    const lastBraceIndex = modifiedCode.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      return modifiedCode.slice(0, lastBraceIndex) + mainMethod + '\n' + modifiedCode.slice(lastBraceIndex);
    }
    return modifiedCode;
  } else {
    return `public class Solution {\n    ${userCode}\n    ${mainMethod}\n}`;
  }
}

function wrapCCode(userCode, testInput, functionName, functionSignature) {
  // Extract return type from function signature
  const returnTypeMatch = functionSignature.match(/^(\w+(?:\*)?)\s+/);
  const resultType = returnTypeMatch ? returnTypeMatch[1] : 'int';

  // Parse input parameters
  let inputLines = [];
  let params = [];
  let returnSizeLine = '';
  let returnSizeParam = '';
  
  // Handle different input formats
  const matches = [...testInput.matchAll(/(\w+)\s*=\s*(\[[^\]]*\]|"[^"]*"|\S+)/g)];
  
  for (const match of matches) {
    const varName = match[1];
    let value = match[2].trim();
    
    if (value.startsWith('[')) {
      // Array input
      const arr = value.replace(/[\[\]\s]/g, '').split(',').filter(Boolean);
      if (arr.length > 0 && arr[0].includes('"')) {
        // String array - C doesn't handle this well, but we'll try
        const stringArr = value.match(/"([^"]*)"/g) || [];
        inputLines.push(`char* ${varName}[] = {${stringArr.join(',')}};`);
        inputLines.push(`int ${varName}Size = ${stringArr.length};`);
        params.push(varName, `${varName}Size`);
      } else {
        // Integer array
        inputLines.push(`int ${varName}[] = {${arr.join(',')}};`);
        inputLines.push(`int ${varName}Size = ${arr.length};`);
        params.push(varName, `${varName}Size`);
      }
    } else if (value.startsWith('"')) {
      // String input
      inputLines.push(`char* ${varName} = ${value};`);
      params.push(varName);
    } else {
      // Numeric input
      if (value === 'true' || value === 'false') {
        inputLines.push(`bool ${varName} = ${value};`);
      } else {
        inputLines.push(`int ${varName} = ${value};`);
      }
      params.push(varName);
    }
  }

  // Add returnSize parameter for array return types
  if (resultType === 'int*' || resultType === 'char*') {
    returnSizeLine = 'int returnSize;';
    returnSizeParam = ', &returnSize';
  }

  // Generate appropriate print statement based on return type
  let printResult = '';
  if (resultType === 'int*') {
    printResult = `printf("[");\n    for (int i = 0; i < returnSize; i++) {\n        printf("%d", result[i]);\n        if (i + 1 < returnSize) printf(",");\n    }\n    printf("]\\n");\n    free(result);`;
  } else if (resultType === 'char*') {
    printResult = `printf("\\"%s\\"\\n", result);\n    free(result);`;
  } else if (resultType === 'bool') {
    printResult = `printf("%s\\n", result ? "true" : "false");`;
  } else {
    printResult = `printf("%d\\n", result);`;
  }

  const functionCall = `${resultType} result = ${functionName}(${params.join(', ')}${returnSizeParam});`;
  
  return `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

${userCode}

int main() {
    ${inputLines.join('\n    ')}
    ${returnSizeLine}
    ${functionCall}
    ${printResult}
    return 0;
}`;
}

function addJavaImports(userCode) {
  const usesCollections = userCode.includes('HashMap') || 
                         userCode.includes('Map<') ||
                         userCode.includes('ArrayList') || 
                         userCode.includes('List<') ||
                         userCode.includes('Arrays.') ||
                         userCode.includes('Collections.') ||
                         userCode.includes('PriorityQueue') ||
                         userCode.includes('HashSet') || 
                         userCode.includes('Set<') ||
                         userCode.includes('LinkedList') ||
                         userCode.includes('Queue<') ||
                         userCode.includes('Stack');
        
  const hasUtilImport = userCode.includes('import java.util.*;') || 
                       userCode.includes('import java.util.*');
  
  if (usesCollections && !hasUtilImport) {
    return 'import java.util.*;\n' + userCode;
  }
  
  return userCode;
}


export const runCustomTestCase = async (req, res) => {
  const { id } = req.params;
  const { code, language, customInput } = req.body;

  if (!code || !language || !customInput || !customInput.trim()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Code, language, and custom input are required.'
    });
  }

  const problem = await Problem.findById(id);
  if (!problem) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: `Problem with id ${id} not found`
    });
  }

  const supportedLanguages = ['cpp', 'c', 'java'];
  if (!supportedLanguages.includes(language)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Only C, C++, and Java are supported.'
    });
  }

  let requiredSignature, requiredName, wrapCodeFn;
  if (language === 'cpp') {
    requiredSignature = problem.functionSignature?.get('cpp') || 'vector<int> solution(vector<int>& nums, int target)';
    requiredName = problem.functionName || 'solution';
    wrapCodeFn = wrapCppCode;
  } else if (language === 'c') {
    requiredSignature = problem.functionSignature?.get('c') || 'int* solution(int* nums, int numsSize, int target, int* returnSize)';
    requiredName = problem.functionName || 'solution';
    wrapCodeFn = wrapCCode;
  } else if (language === 'java') {
    requiredSignature = problem.functionSignature?.get('java') || 'public int[] solution(int[] nums, int target)';
    requiredName = problem.functionName || 'solution';
    wrapCodeFn = wrapJavaCode;
  }


  let userCodeFixed = code;
  if (language === 'cpp') userCodeFixed = enforceCppSignature(code, requiredSignature, requiredName);
  if (language === 'java') {
    userCodeFixed = enforceJavaSignature(code, requiredSignature, requiredName);
    userCodeFixed = addJavaImports(userCodeFixed);
  }
  if (language === 'c') userCodeFixed = enforceCSignature(code, requiredSignature, requiredName);
  const wrappedCode = wrapCodeFn(userCodeFixed, customInput, requiredName, requiredSignature);

  try {
    const compileRes = await axios.post(COMPILER_URL, {
      language,
      code: wrappedCode,
      input: ''
    }, { timeout: 10000 });
    const errorObj = cleanCompilerError(compileRes.data.stderr || '', language, code);
    let output = (compileRes.data.stdout || '').trim();
    if (output.endsWith(',')) output = output.slice(0, -1);
    const resultObj = {
      input: customInput,
      output,
      stderr: errorObj.message,
      execTime: compileRes.data.execTime || null
    };
    return res.status(StatusCodes.OK).json({ success: true, data: resultObj });
  } catch (err) {
    let errorMessage = '';
    if (err.response?.data?.stderr) {
      errorMessage = typeof err.response.data.stderr === 'string' 
        ? err.response.data.stderr 
        : JSON.stringify(err.response.data.stderr);
    } else if (err.message) {
      errorMessage = err.message;
    } else {
      errorMessage = 'Unknown compilation error';
    }
    const errorObj = cleanCompilerError(errorMessage, language, code);
    const resultObj = {
      input: customInput,
      output: '',
      stderr: errorObj.message,
      execTime: null
    };
    return res.status(StatusCodes.OK).json({ success: false, data: resultObj });
  }
}; 