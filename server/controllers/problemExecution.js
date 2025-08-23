import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { StatusCodes } from 'http-status-codes';
import ErrorResponse from '../utils/errorResponse.js';
import axios from 'axios';
import { wrapCppCode, wrapJavaCode, wrapCCode } from '../utils/codeWrappers.js';
import { enforceCppSignature, enforceJavaSignature, enforceCSignature } from '../utils/signatureUtils.js';
import { cleanCompilerError, addJavaImports } from '../utils/compilerUtils.js';
const COMPILER_URL =  process.env.VITE_COMPILER_URL ;
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
        const wrappedCode = wrapCodeFn(userCodeFixed, testCase.input, requiredName);
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
        const compileCheckWrapped = wrapCodeFn(compileCheckCode, compileCheckInput, requiredName);
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
            const wrappedCode = wrapCodeFn(userCodeFixed, testCase.input, requiredName);
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
            ...(status !== 'accepted' ? { errorMessage: errorMessage || 'Execution failed' } : {})
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