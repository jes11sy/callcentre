import { Router } from 'express';
import { statsController } from '../controllers/statsController';
import { authenticate } from '../middleware/auth';
import { statsValidation } from '../middleware/validation';
import { auditLoggers } from '../middleware/auditLogger';
import { cacheMiddlewareFor } from '../middleware/cache';

const router = Router();

// Получить статистику конкретного оператора (только для админов)
router.get('/operator/:operatorId', authenticate, cacheMiddlewareFor.operatorStats, statsValidation.getStats, auditLoggers.viewStats, statsController.getOperatorStats);

// Получить общую статистику (только для админов)
router.get('/overall', authenticate, cacheMiddlewareFor.overallStats, statsValidation.getStats, auditLoggers.viewStats, statsController.getOverallStats);

// Получить личную статистику оператора
router.get('/my', authenticate, cacheMiddlewareFor.myStats, statsValidation.getStats, auditLoggers.viewStats, statsController.getMyStats);

export default router;