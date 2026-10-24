import { Router } from 'express';
import healthRouter from './health.routes.js';

const apiRouter = Router();

// Mount sub-routers
apiRouter.use('/health', healthRouter);

// Root /api info
apiRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AICTE Workflow Automation API is active',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
    },
  });
});

export default apiRouter;
