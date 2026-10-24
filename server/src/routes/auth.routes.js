import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public login endpoint
router.post('/login', login);

// Protected current user profile endpoint
router.get('/me', authenticate, getCurrentUser);

export default router;
