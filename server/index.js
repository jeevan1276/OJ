import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import errorHandler from './middleware/error.js';
import { deserializeUser } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import problemRoutes from './routes/problem.js';
import userRoutes from './routes/user.js';
import aiRoutes from './routes/ai.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import requestMetricsMiddleware from './middleware/metrics.js';
import { getMetrics, getHttpP95Latency, getCodeExecutionP95Latency } from './utils/metrics.js';
import logger from './utils/logger.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Add metrics tracking middleware
app.use(requestMetricsMiddleware);

app.use(deserializeUser);

app.use(apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const httpP95 = getHttpP95Latency();
  const executionP95 = getCodeExecutionP95Latency();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    metrics: {
      httpP95Latency: `${httpP95.toFixed(2)}ms`,
      executionP95Latency: `${executionP95.toFixed(2)}ms`
    }
  });
});

// Metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.end(metrics);
  } catch (err) {
    logger.error('Error generating metrics', { error: err.message });
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50,
  wtimeoutMS: 2500
})
    .then(() => {
      logger.info('Connected to MongoDB', {
        maxPoolSize: 50,
        wtimeoutMS: 2500
      });
    })
    .catch(err => {
      logger.error('MongoDB connection error', { error: err.message });
      process.exit(1);
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`, {
      nodeEnv: process.env.NODE_ENV,
      metricsUrl: `http://localhost:${PORT}/metrics`,
      healthUrl: `http://localhost:${PORT}/health`
    });
}); 