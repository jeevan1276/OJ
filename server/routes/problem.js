import express from 'express';
import {
    createProblem,
    getAllProblems,
    getProblem,
    updateProblem,
    deleteProblem,
    submitSolution,
    getProblemStats,
    getUserProblemStatus,
    runCode,
    runCustomTestCase,
    submitSolutionAsync,
    runCodeAsync,
    getJobStatus
} from '../controllers/problem.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { getRecentSubmissions } from '../controllers/submission.js';

const router = express.Router();

router.get('/', getAllProblems);
router.get('/stats', getProblemStats);
router.get('/:id', getProblem);

router.use(authenticateUser);

// Synchronous execution endpoints (existing behaviour)
router.post('/:id/run', runCode);
router.post('/:id/custom-test', runCustomTestCase);
router.post('/:id/submit', submitSolution);

// Async queue-based execution endpoints (BullMQ — Task 5)
router.post('/:id/run-async', runCodeAsync);
router.post('/:id/submit-async', submitSolutionAsync);

// Job status polling (for async results)
router.get('/jobs/:jobId/status', getJobStatus);

router.get('/:problemId/status', getUserProblemStatus);
router.get('/:id/recent-submissions', getRecentSubmissions);

router.post('/', authorizeRoles('admin', 'problem-setter'), createProblem);
router.patch('/:id', authorizeRoles('admin', 'problem-setter'), updateProblem);
router.delete('/:id', authorizeRoles('admin', 'problem-setter'), deleteProblem);

export default router;