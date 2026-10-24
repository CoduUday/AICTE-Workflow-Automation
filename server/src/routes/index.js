import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import applicationRouter from './application.routes.js';
import complianceRouter from './compliance.routes.js';
import alertRouter from './alert.routes.js';
import evcRouter from './evc.routes.js';
import dashboardRouter from './dashboard.routes.js';

const apiRouter = Router();

// Mount all API sub-routers
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/applications', applicationRouter);
apiRouter.use('/compliance', complianceRouter);
apiRouter.use('/alerts', alertRouter);
apiRouter.use('/evc', evcRouter);
apiRouter.use('/dashboard', dashboardRouter);

// Root /api information
apiRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AICTE Workflow Automation API is active',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        login: '/api/auth/login',
        me: '/api/auth/me',
      },
      applications: '/api/applications',
      compliance: '/api/compliance',
      alerts: '/api/alerts',
      evc: '/api/evc',
      dashboard: '/api/dashboard/summary',
    },
  });
});

export default apiRouter;
