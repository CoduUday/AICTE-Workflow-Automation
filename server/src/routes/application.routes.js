import { Router } from 'express';
import {
  getApplications,
  createApplication,
  getApplicationById,
  updateStage,
  getDocuments,
  addDocument,
} from '../controllers/application.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../config/workflow.js';

const router = Router();

// All application routes require authentication
router.use(authenticate);

// Collection routes
router.get('/', getApplications);
router.post('/', authorizeRoles(ROLES.INSTITUTION, ROLES.ADMIN), createApplication);

// Item routes
router.get('/:id', getApplicationById);

// Stage transition routes (supports both /stage and /status alias)
router.patch('/:id/stage', updateStage);
router.patch('/:id/status', updateStage);

// Document routes
router.get('/:id/documents', getDocuments);
router.post(
  '/:id/documents',
  authorizeRoles(ROLES.INSTITUTION, ROLES.SCRUTINY_OFFICER, ROLES.ADMIN),
  addDocument
);

export default router;
