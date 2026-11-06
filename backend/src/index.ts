import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Auto-detect test execution mode
if (process.argv.some((a) => a.includes('test') || a.includes('.test.'))) {
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
}

import { config } from './config/index.js';
import { getDatabase } from './database/index.js';
import { runSeed } from './seed/index.js';

// Routers
import { authRouter } from './routers/auth.router.js';
import { destinationsRouter } from './routers/destinations.router.js';
import { guidesRouter } from './routers/guides.router.js';
import { homestaysRouter } from './routers/homestays.router.js';
import { experiencesRouter } from './routers/experiences.router.js';
import { bookingsRouter } from './routers/bookings.router.js';
import { paymentsRouter } from './routers/payments.router.js';
import { reviewsRouter } from './routers/reviews.router.js';
import { communityRouter } from './routers/community.router.js';
import { itinerariesRouter } from './routers/itineraries.router.js';
import { notificationsRouter } from './routers/notifications.router.js';
import { adminRouter } from './routers/admin.router.js';

export const app = express();

// Initialize database schema
getDatabase();

// Ensure upload folders exist
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    service: 'LOCALORA Tourism API',
    region: 'Karnataka (Pan-India Architecture)',
    timestamp: new Date().toISOString(),
    paymentMode: config.paymentMode,
  });
});

// Mount modular API routers
app.use('/api/auth', authRouter);
app.use('/api/destinations', destinationsRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/homestays', homestaysRouter);
app.use('/api/experiences', experiencesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/community', communityRouter);
app.use('/api/itineraries', itinerariesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Auto-seed if database is freshly initialized or requested
if (process.env.NODE_ENV !== 'test' && !process.env.TEST_MODE) {
  if (process.env.AUTO_SEED === 'true' || process.env.NODE_ENV === 'development') {
    runSeed(false).catch((e) => console.warn('Auto-seed notice:', e.message));
  }
}

// Start HTTP server only if not in test suite
if (process.env.NODE_ENV !== 'test' && !process.env.TEST_MODE) {
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log('\x1b[32m%s\x1b[0m', `=======================================================`);
    console.log('\x1b[32m%s\x1b[0m', `  LOCALORA Backend API listening on port ${config.port}`);
    console.log('\x1b[36m%s\x1b[0m', `  Health Endpoint: http://localhost:${config.port}/api/health`);
    console.log('\x1b[32m%s\x1b[0m', `=======================================================`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\x1b[31mPort ${config.port} is already in use. Please terminate the conflicting process or choose another port.\x1b[0m`);
    } else {
      console.error('Server error:', err);
    }
  });
}
