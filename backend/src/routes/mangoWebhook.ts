import { Router } from 'express';
import { mangoWebhookController } from '../controllers/mangoWebhookController';

const router = Router();

/**
 * @route POST /api/webhooks/mango
 * @desc Webhook endpoint для получения событий от Mango ATC
 * @access Public (только для Mango ATC)
 * @body {object} webhookData - Данные webhook от Mango ATC
 */
router.post('/', mangoWebhookController.handleWebhook);

/**
 * @route GET /api/webhooks/mango/settings
 * @desc Получить настройки Mango ATC
 * @access Private (Admin)
 */
router.get('/settings', mangoWebhookController.getMangoSettings);

/**
 * @route POST /api/webhooks/mango/events/summary
 * @desc Получить сводку событий (для Mango Office)
 * @access Public (только для Mango ATC)
 */
router.post('/events/summary', mangoWebhookController.getEventsSummary);

/**
 * @route GET /api/webhooks/mango/status
 * @desc Проверка статуса webhook (для Mango Office)
 * @access Public (только для Mango ATC)
 */
router.get('/status', mangoWebhookController.getWebhookStatus);

/**
 * @route POST /api/webhooks/mango/events/recording
 * @desc Обработка записей звонков (для Mango Office)
 * @access Public (только для Mango ATC)
 */
router.post('/events/recording', mangoWebhookController.handleRecording);

/**
 * @route POST /api/webhooks/mango/events/call
 * @desc Обработка событий звонков (альтернативный endpoint для Mango Office)
 * @access Public (только для Mango ATC)
 */
router.post('/events/call', mangoWebhookController.handleWebhook);

export default router;
