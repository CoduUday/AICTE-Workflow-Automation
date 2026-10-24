import { Router } from 'express';
import {
  getComplianceItems,
  getComplianceById,
  createComplianceItem,
  updateComplianceItem,
  submitEvidence,
  verifyEvidence,
} from '../controllers/compliance.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../config/workflow.js';

const router = Router();

router.use(authenticate);

router.get('/', getComplianceItems);
router.post(
  '/',
  authorizeRoles(ROLES.SCRUTINY_OFFICER, ROLES.COMMITTEE_OFFICER, ROLES.ADMIN),
  createComplianceItem
);

router.get('/:id', getComplianceById);
router.patch(
  '/:id',
  authorizeRoles(ROLES.INSTITUTION, ROLES.SCRUTINY_OFFICER, ROLES.ADMIN),
  updateComplianceItem
);

router.post(
  '/:id/evidence',
  authorizeRoles(ROLES.INSTITUTION, ROLES.ADMIN),
  submitEvidence
);

router.patch(
  '/:id/evidence/:evidenceId/verify',
  authorizeRoles(ROLES.SCRUTINY_OFFICER, ROLES.ADMIN),
  verifyEvidence
);

export default router;
