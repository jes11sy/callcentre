import { Router } from 'express';
import { 
  getCronStatus, 
  triggerEmailCheck, 
  getCallRecording, 
  getCallRecordingInfo, 
  deleteCallRecording, 
  getRecordingsStats,
  cleanupDuplicateRecordings
} from '../controllers/recordingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Статус cron задач
router.get('/cron/status', getCronStatus);

// Ручной запуск проверки почты
router.post('/cron/check-email', triggerEmailCheck);

// Статистика записей
router.get('/stats', getRecordingsStats);

// Информация о записи звонка
router.get('/call/:callId/info', getCallRecordingInfo);

// Получить запись звонка (файл)
router.get('/call/:callId/download', getCallRecording);

// Удалить запись звонка
router.delete('/call/:callId', deleteCallRecording);

// Очистить дублированные записи
router.post('/cleanup-duplicates', cleanupDuplicateRecordings);

export default router;
