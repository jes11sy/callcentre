import { Router } from 'express';
import { login, logout, refreshToken, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authValidation } from '../middleware/validation';
import { auditLoggers, logFailedAuth } from '../middleware/auditLogger';

const router = Router();

// Public routes
router.post('/login', logFailedAuth, authValidation.login, auditLoggers.login, login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticate, auditLoggers.logout, logout);
router.get('/profile', authenticate, getProfile);

export default router;
