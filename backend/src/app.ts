import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import apiRouter from './routes';
import { standardRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './utils/errors';

export const app = express();

// Security Headers
app.use(helmet());

// Cookie Parser for secure HTTP-only cookies
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-CSRF-Token'],
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
app.use(standardRateLimiter);

// Root route
app.get('/', (_req, res) => {
  res.json({
    service: 'WayRivo AI 2.0 API',
    version: '2.0.0',
    documentation: '/api/v1/health',
    status: 'ACTIVE',
  });
});

// Mount Versioned API and Direct API for backward compatibility
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// 404 Handler
app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Central Error Handler
app.use(errorHandler);
