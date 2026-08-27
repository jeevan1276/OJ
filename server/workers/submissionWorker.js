/**
 * submissionWorker.js — BullMQ worker process for code execution jobs.
 *
 * Run separately: node server/workers/submissionWorker.js
 * The docker-compose.yml starts this automatically as a separate service.
 *
 * Job types (job.data.type):
 *   'submit'  — full submission against all test cases (submitSolution)
 *   'run'     — run against public test cases only (runCode)
 */
import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';

const COMPILER_URL = process.env.COMPILER_URL;
const COMPILER_HEADERS = process.env.COMPILER_API_KEY
  ? { 'x-api-key': process.env.COMPILER_API_KEY }
  : {};

// --- Redis Connection ---
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 })
  .then(() => console.log('[Worker] Connected to MongoDB'))
  .catch(err => { console.error('[Worker] MongoDB error', err); process.exit(1); });

// --- Helper: call compiler ---
async function callCompiler(language, code) {
  const res = await axios.post(COMPILER_URL, { language, code, input: '' }, {
    timeout: 15000,
    headers: COMPILER_HEADERS
  });
  return res.data;
}

// --- Helper: code wrapping (imported inline to keep worker self-contained) ---
import { enforceCppSignature, enforceJavaSignature, enforceCSignature } from '../utils/signatureUtils.js';
import { addJavaImports } from '../utils/compilerUtils.js';
import { wrapCppCode, wrapJavaCode, wrapCCode } from '../utils/codeWrappers.js';

function getLanguageHelpers(language, problem) {
  if (language === 'cpp') return {
    signature: problem.functionSignature?.get('cpp') || 'vector<int> solution(vector<int>& nums, int target)',
    name: problem.functionName || 'solution',
    wrap: wrapCppCode,
    enforce: (code, sig, name) => enforceCppSignature(code, sig, name)
  };
  if (language === 'c') return {
    signature: problem.functionSignature?.get('c') || 'int* solution(int* nums, int numsSize, int target, int* returnSize)',
    name: problem.functionName || 'solution',
    wrap: wrapCCode,
    enforce: (code, sig, name) => enforceCSignature(code, sig, name)
  };
  if (language === 'java') return {
    signature: problem.functionSignature?.get('java') || 'public int[] solution(int[] nums, int target)',
    name: problem.functionName || 'solution',
    wrap: wrapJavaCode,
    enforce: (code, sig, name) => {
      let fixed = enforceJavaSignature(code, sig, name);
      return addJavaImports(fixed);
    }
  };
  throw new Error(`Unsupported language: ${language}`);
}

function fixCode(code, language, helpers) {
  return helpers.enforce(code, helpers.signature, helpers.name);
}

// --- Worker Processor ---
const worker = new Worker('submissions', async (job) => {
  const { type, problemId, code, language, userId, tenantId } = job.data;

  const problem = await Problem.findById(problemId);
  if (!problem) throw new Error(`Problem ${problemId} not found`);

  if (problem.tenantId.toString() !== tenantId.toString()) {
    throw new Error(`Problem ${problemId} does not belong to tenant ${tenantId}`);
  }

  const helpers = getLanguageHelpers(language, problem);

  if (type === 'run') {
    // Run against public test cases — return results array
    const results = [];
    for (let i = 0; i < problem.publicTestCases.length; i++) {
      const tc = problem.publicTestCases[i];
      const fixed = fixCode(code, language, helpers);
      const wrapped = helpers.wrap(fixed, tc.input, helpers.name, helpers.signature);
      try {
        const compileRes = await callCompiler(language, wrapped);
        let output = (compileRes.stdout || '').trim();
        if (output.endsWith(',')) output = output.slice(0, -1);
        const expected = tc.output.trim();
        results.push({
          id: i,
          input: tc.input,
          expected,
          output,
          status: output === expected ? 'passed' : 'failed',
          stderr: compileRes.stderr || '',
          execTime: compileRes.execTime || null
        });
      } catch (err) {
        results.push({
          id: i,
          input: tc.input,
          expected: tc.output.trim(),
          output: '',
          status: 'error',
          stderr: err.message || 'Execution error',
          execTime: null
        });
      }
    }
    return { type: 'run', results };
  }

  if (type === 'submit') {
    const allTestCases = [...problem.publicTestCases, ...problem.hiddenTestCases];
    const totalTestCases = allTestCases.length;
    if (totalTestCases === 0) throw new Error('No test cases found');

    let totalExecutionTime = 0;
    let totalMemoryUsed = 0;
    let testCasesPassed = 0;
    let status = 'accepted';
    let errorMessage = '';
    let failedCase = null;

    // Compile check with first test case
    const firstFixed = fixCode(code, language, helpers);
    const firstWrapped = helpers.wrap(firstFixed, allTestCases[0]?.input || '', helpers.name, helpers.signature);
    try {
      const compileCheck = await callCompiler(language, firstWrapped);
      if (compileCheck.stderr && compileCheck.stderr.trim() !== '') {
        const submission = await Submission.create({
          user: userId, problem: problemId, tenantId, code, language,
          status: 'compilation_error', executionTime: 0, memoryUsed: 0,
          testCasesPassed: 0, totalTestCases, errorMessage: compileCheck.stderr
        });
        return { type: 'submit', status: 'compilation_error', submissionId: submission._id, error: compileCheck.stderr, testCasesPassed: 0, totalTestCases };
      }
    } catch (err) {
      const submission = await Submission.create({
        user: userId, problem: problemId, tenantId, code, language,
        status: 'compilation_error', executionTime: 0, memoryUsed: 0,
        testCasesPassed: 0, totalTestCases, errorMessage: err.message
      });
      return { type: 'submit', status: 'compilation_error', submissionId: submission._id, error: err.message, testCasesPassed: 0, totalTestCases };
    }

    // Run all test cases
    for (let i = 0; i < allTestCases.length; i++) {
      const tc = allTestCases[i];
      const fixed = fixCode(code, language, helpers);
      const wrapped = helpers.wrap(fixed, tc.input, helpers.name, helpers.signature);
      try {
        const compileRes = await callCompiler(language, wrapped);
        const execTime = compileRes.execTime || 0;
        totalExecutionTime += execTime;

        const memUsed = compileRes.memoryUsed || 0;
        totalMemoryUsed = Math.max(totalMemoryUsed, memUsed);

        let output = (compileRes.stdout || '').trim();
        if (output.endsWith(',')) output = output.slice(0, -1);
        const expected = tc.output.trim();

        if (compileRes.stderr && compileRes.stderr.trim() !== '') {
          status = 'runtime_error';
          errorMessage = compileRes.stderr;
          break;
        }

        if (output === expected) {
          testCasesPassed++;
        } else {
          status = 'wrong_answer';
          failedCase = { index: i + 1, input: tc.input, expected, output };
          break;
        }

        if (execTime > problem.timeLimit) {
          status = 'time_limit_exceeded';
          break;
        }
      } catch (err) {
        status = 'runtime_error';
        errorMessage = err.message || 'Execution failed';
        break;
      }
    }

    // Store submission
    const submission = await Submission.create({
      user: userId, problem: problemId, tenantId, code, language,
      status, executionTime: totalExecutionTime, memoryUsed: totalMemoryUsed,
      testCasesPassed, totalTestCases,
      errorMessage: status !== 'accepted' ? (errorMessage || status) : undefined
    });

    // Update problem stats
    problem.totalSubmissions += 1;
    if (status === 'accepted') problem.successfulSubmissions += 1;
    await problem.save();

    return {
      type: 'submit',
      submissionId: submission._id,
      status,
      executionTime: totalExecutionTime,
      memoryUsed: totalMemoryUsed,
      testCasesPassed,
      totalTestCases,
      failedCase: failedCase || undefined,
      errorMessage: errorMessage || undefined
    };
  }

  throw new Error(`Unknown job type: ${type}`);
}, {
  connection: redisConnection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5')
});

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} (${job.data.type}) completed`));
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));
worker.on('error', err => console.error('[Worker] Error:', err));

console.log('[Worker] Submission worker started');
