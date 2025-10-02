import express from 'express';
import { avitoWebhookController } from '../controllers/avitoWebhookController';

const router = express.Router();

/**
 * @route POST /api/webhooks/avito
 * @desc Receive webhook notifications from Avito Messenger
 * @access Public (called by Avito API)
 * @body AvitoWebhookEvent
 */
router.post('/avito', avitoWebhookController.handleWebhook);

/**
 * @route GET /api/webhooks/avito/test
 * @desc Test webhook endpoint
 * @access Public
 */
router.get('/avito/test', avitoWebhookController.testWebhook);

export default router;

