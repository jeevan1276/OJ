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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log response time
  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
  });
  
  next();
});

app.use(deserializeUser);

app.use(apiLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {console.log('Connected to MongoDB')})
    .catch(err => {console.log(err) });
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 