import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import applicationRouter from './application.routes.js';

const apiRouter = Router();

// Mount sub-routers
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/applications', applicationRouter);

// Root /api info
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
    },
  });
});

export default apiRouter;
