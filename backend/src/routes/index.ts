import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import authRoutes from './auth';
import adminRoutes from './admin';
import operatorRoutes from './operator';
import employeeRoutes from './employee';
import avitoRoutes from './avito';
import phoneRoutes from './phone';
import statsRoutes from './stats';
import callRoutes from './calls';
import orderRoutes from './orders';
import avitoMessengerRoutes from './avitoMessenger';
import profileRoutes from './profile';
import mangoWebhookRoutes from './mangoWebhook';
import avitoWebhookRoutes from './avitoWebhook';
import recordingRoutes from './recordings';
import emailSettingsRoutes from './emailSettings';
import healthRoutes from './health';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/webhooks/mango', mangoWebhookRoutes); // Webhook от Mango ATC (без аутентификации)
router.use('/webhooks', avitoWebhookRoutes); // Webhook от Avito Messenger (без аутентификации)
router.use('/health', healthRoutes); // Health check endpoints (без аутентификации)

// Protected routes (require authentication)
router.use('/admin', authenticate, adminRoutes);
router.use('/operator', authenticate, operatorRoutes);
router.use('/employees', authenticate, employeeRoutes);
router.use('/avito', authenticate, avitoRoutes);
router.use('/phones', authenticate, phoneRoutes);
router.use('/stats', authenticate, statsRoutes);
router.use('/calls', authenticate, callRoutes);
router.use('/orders', authenticate, orderRoutes);
router.use('/avito-messenger', authenticate, avitoMessengerRoutes);
router.use('/profile', authenticate, profileRoutes);
router.use('/recordings', recordingRoutes);
router.use('/email-settings', authenticate, emailSettingsRoutes);

// Legacy health check endpoint (для совместимости)
router.get('/health-legacy', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      message: 'Call Centre CRM API is running!',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'Call Centre CRM API',
    version: '1.0.0',
    description: 'API для системы управления колл-центром',
    endpoints: {
      health: '/api/health',
      info: '/api/info'
    }
  });
});

export default router;
