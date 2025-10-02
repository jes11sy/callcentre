import { Router } from 'express';
import { avitoMessengerController } from '../controllers/avitoMessengerController';

const router = Router();

/**
 * @route GET /api/avito-messenger/accounts
 * @desc Получить список аккаунтов Авито для операторов
 * @access Private (Admin, Operator)
 */
router.get('/accounts', avitoMessengerController.getAccounts);

/**
 * @route GET /api/avito-messenger/test-connection
 * @desc Тестирование подключения к API Авито для указанного аккаунта
 * @access Private (Admin, Operator)
 * @query {string} avitoAccountName - Имя аккаунта Авито
 */
// router.get('/test-connection', avitoMessengerController.testConnection);

/**
 * @route GET /api/avito-messenger/debug/:accountName
 * @desc Отладочная информация для аккаунта Авито
 * @access Private (Admin, Operator)
 * @param {string} accountName - Имя аккаунта Авито
 */
// router.get('/debug/:accountName', avitoMessengerController.debugAccount);

/**
 * @route POST /api/avito-messenger/update-userid/:accountName
 * @desc Обновить userId для аккаунта Авито
 * @access Private (Admin, Operator)
 * @param {string} accountName - Имя аккаунта Авито
 */
// router.post('/update-userid/:accountName', avitoMessengerController.updateUserId);

/**
 * @route GET /api/avito-messenger/chats
 * @desc Получить список чатов из Авито
 * @access Private (Admin, Operator)
 * @query {string} avitoAccountName - Имя аккаунта Авито
 * @query {number} limit - Количество чатов для запроса (по умолчанию 50)
 * @query {number} offset - Сдвиг чатов для запроса (по умолчанию 0)
 * @query {boolean} unread_only - Только непрочитанные чаты (по умолчанию false)
 * @query {string} chat_types - Типы чатов: u2i,u2u (по умолчанию u2i)
 */
router.get('/chats', avitoMessengerController.getChats);

/**
 * @route GET /api/avito-messenger/chats/:chatId
 * @desc Получить информацию о конкретном чате
 * @access Private (Admin, Operator)
 * @param {string} chatId - ID чата
 * @query {string} avitoAccountName - Имя аккаунта Авито
 */
// router.get('/chats/:chatId', avitoMessengerController.getChatInfo);

/**
 * @route GET /api/avito-messenger/chats/:chatId/messages
 * @desc Получить сообщения из чата
 * @access Private (Admin, Operator)
 * @param {string} chatId - ID чата
 * @query {string} avitoAccountName - Имя аккаунта Авито
 * @query {number} limit - Количество сообщений для запроса (по умолчанию 50)
 * @query {number} offset - Сдвиг сообщений для запроса (по умолчанию 0)
 */
router.get('/chats/:chatId/messages', avitoMessengerController.getChatMessages);

/**
 * @route POST /api/avito-messenger/chats/:chatId/read
 * @desc Отметить сообщения в чате как прочитанные
 * @access Private (Admin, Operator)
 * @param {string} chatId - ID чата
 * @body {string} avitoAccountName - Имя аккаунта Авито
 */
router.post('/chats/:chatId/read', avitoMessengerController.markMessagesAsRead);

/**
 * @route POST /api/avito-messenger/chats/:chatId/messages
 * @desc Отправить сообщение в чат
 * @access Private (Admin, Operator)
 * @param {string} chatId - ID чата
 * @body {string} avitoAccountName - Имя аккаунта Авито
 * @body {string} message - Текст сообщения
 * @body {string} type - Тип сообщения (по умолчанию text)
 */
router.post('/chats/:chatId/messages', avitoMessengerController.sendMessage);

/**
 * @route POST /api/avito-messenger/voice-files
 * @desc Получить ссылки на голосовые файлы по их ID
 * @access Private (Admin, Operator)
 * @query {string} avitoAccountName - Имя аккаунта Авито
 * @body {string[]} voiceIds - Массив ID голосовых сообщений
 */
router.post('/voice-files', avitoMessengerController.getVoiceFileUrls);

export default router;
