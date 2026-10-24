import { Router } from 'express';
import {
  getAlerts,
  acknowledgeAlert,
  markAllAsRead,
} from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAlerts);
router.patch('/read-all', markAllAsRead);

// Supports both /acknowledge and /read alias
router.patch('/:id/acknowledge', acknowledgeAlert);
router.patch('/:id/read', acknowledgeAlert);

export default router;
