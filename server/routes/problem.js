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
    runCustomTestCase
} from '../controllers/problem.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { getRecentSubmissions } from '../controllers/submission.js';

const router = express.Router();

router.get('/', getAllProblems);
router.get('/stats', getProblemStats);
router.get('/:id', getProblem);

router.use(authenticateUser);

router.post('/:id/run', runCode);
router.post('/:id/custom-test', runCustomTestCase);
router.post('/:id/submit', submitSolution);
router.get('/:problemId/status', getUserProblemStatus);
router.get('/:id/recent-submissions', getRecentSubmissions);

router.post('/', authorizeRoles('admin', 'problem-setter'), createProblem);
router.patch('/:id', authorizeRoles('admin', 'problem-setter'), updateProblem);
router.delete('/:id', authorizeRoles('admin', 'problem-setter'), deleteProblem);
export default router; 