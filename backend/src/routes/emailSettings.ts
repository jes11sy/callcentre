import { Router } from 'express';
import { 
  getEmailSettings, 
  updateEmailSettings, 
  testEmailConnection, 
  getEmailMonitoringStats, 
  triggerEmailCheck 
} from '../controllers/emailSettingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Получить настройки почты
router.get('/settings', getEmailSettings);

// Обновить настройки почты
router.put('/settings', updateEmailSettings);

// Тестировать подключение к почте
router.post('/test-connection', testEmailConnection);

// Получить статистику мониторинга
router.get('/stats', getEmailMonitoringStats);

// Ручной запуск проверки почты
router.post('/check-email', triggerEmailCheck);

export default router;
