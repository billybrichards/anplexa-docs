/**
 * Express Application Setup
 *
 * Configures middleware, routes, and error handling
 */

import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import type { Container } from './container.js';
import { createAuthRoutes } from './routes/auth/index.js';
import { createDocsRoutes } from './routes/docs/index.js';
import { createAdminRoutes } from './routes/admin/index.js';
import { createCrmRoutes } from './routes/crm/index.js';
import { createBirthChartRoutes } from './routes/birth-chart/index.js';
import { createGeocodeRoutes } from './routes/geocode/index.js';
import { createAstrologyRoutes } from './routes/astrology/index.js';
import { createMediaRoutes } from './routes/media/index.js';
import { createCompanionRoutes } from './routes/companion/index.js';
import { createChatRoutes } from './routes/chat/index.js';
import { createLogsRoutes } from './routes/logs/index.js';
import { createActivityLoggerMiddleware } from './middleware/activityLogger.js';

export function createApp(container: Container): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // Parse CORS_ORIGIN as comma-separated list to support multiple frontends
  // e.g. CORS_ORIGIN=https://prod.example.com,https://dev.example.com
  const corsOrigin = process.env.CORS_ORIGIN;
  const origin = !corsOrigin
    ? '*'
    : corsOrigin.includes(',')
      ? corsOrigin.split(',').map((o) => o.trim())
      : corsOrigin;

  app.use(cors({
    origin,
    credentials: true,
  }));

  // Logging
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Activity logging middleware (after body parsing, before routes)
  app.use(createActivityLoggerMiddleware(container));

  // Make container available to all routes
  app.locals.container = container;

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.0',
    });
  });

  // Mount route modules
  app.use('/api/auth', createAuthRoutes(container));
  app.use('/api/birth-chart', createBirthChartRoutes(container));
  app.use('/api/geocode', createGeocodeRoutes(container));
  app.use('/api/astrology', createAstrologyRoutes(container));
  app.use('/api/media', createMediaRoutes(container));
  app.use('/api/companion', createCompanionRoutes(container));
  app.use('/api/chat', createChatRoutes(container));
  app.use('/api/docs', createDocsRoutes(container));
  app.use('/api/logs', createLogsRoutes(container));
  app.use('/admin', createAdminRoutes(container));
  app.use('/crm', createCrmRoutes(container));

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found',
    });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    const statusCode = (err as any).statusCode || 500;
    const message = process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message;

    res.status(statusCode).json({
      error: err.name || 'Error',
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  });

  return app;
}
