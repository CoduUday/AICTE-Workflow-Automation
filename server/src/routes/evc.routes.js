import { Router } from 'express';
import {
  getVisits,
  scheduleVisit,
  rescheduleVisit,
  submitReport,
} from '../controllers/evc.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../config/workflow.js';

const router = Router();

router.use(authenticate);

router.get('/', getVisits);

// Schedule visit (supports both / and /schedule alias)
router.post('/', authorizeRoles(ROLES.EVC_COORDINATOR, ROLES.ADMIN), scheduleVisit);
router.post('/schedule', authorizeRoles(ROLES.EVC_COORDINATOR, ROLES.ADMIN), scheduleVisit);

// Reschedule visit
router.patch('/:id', authorizeRoles(ROLES.EVC_COORDINATOR, ROLES.ADMIN), rescheduleVisit);

// Submit inspection report
router.post('/:id/report', authorizeRoles(ROLES.EVC_COORDINATOR, ROLES.ADMIN), submitReport);

export default router;
