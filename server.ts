import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { config } from './backend/src/config/index.ts';
import { initSocketServer } from './backend/src/services/socketService.ts';
import authRoutes from './backend/src/routes/authRoutes.ts';
import notificationRoutes from './backend/src/routes/notificationRoutes.ts';
import vehicleRoutes from './backend/src/routes/vehicleRoutes.ts';
import bookingRoutes from './backend/src/routes/bookingRoutes.ts';
import billingRoutes from './backend/src/routes/billingRoutes.ts';
import feedbackRoutes from './backend/src/routes/feedbackRoutes.ts';
import adminRoutes from './backend/src/routes/adminRoutes.ts';
import mechanicRoutes from './backend/src/routes/mechanicRoutes.ts';
import customerRoutes from './backend/src/routes/customerRoutes.ts';
import marketplaceRoutes from './backend/src/routes/marketplaceRoutes.ts';
import serviceRoutes from './backend/src/routes/serviceRoutes.ts';
import serviceCenterRoutes from './backend/src/routes/serviceCenterRoutes.ts';
import { notFoundHandler, globalErrorHandler } from './backend/src/middlewares/errorHandler.ts';
import { serviceReminderService } from './backend/src/services/serviceReminderService.ts';

async function startServer() {
  try {
    serviceReminderService.startScheduler(30);
  } catch (err) {
    console.error('Failed to initialize service reminder scheduler:', err);
  }

  const app = express();
  app.set('trust proxy', 1);
  const PORT = config.port;

  const httpServer = http.createServer(app);

  initSocketServer(httpServer);

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin) || origin.includes('.run.app') || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  app.use(cors(corsOptions));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );
  app.use(morgan('dev'));
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/mechanic', mechanicRoutes);
  app.use('/api/customer', customerRoutes);
  app.use('/api/marketplace', marketplaceRoutes);
  app.use('/api/service', serviceRoutes);
  app.use('/api/service-centers', serviceCenterRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api', billingRoutes);
  app.use('/api', feedbackRoutes);


  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use('/api/*', notFoundHandler);
  app.use(globalErrorHandler);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FleetOps Pro Backend + Socket.IO running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
