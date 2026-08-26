import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection for BullMQ
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null // Required by BullMQ
});

/**
 * submissionQueue — holds code execution jobs.
 * Producers: submitSolution, runCode handlers in problem.js
 * Consumers: server/workers/submissionWorker.js
 */
export const submissionQueue = new Queue('submissions', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 500 }, // keep last 500 completed jobs for status polling
    removeOnFail: { count: 200 }
  }
});

export { redisConnection };
