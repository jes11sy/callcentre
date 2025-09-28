import { Router } from 'express';
import { callController } from '../controllers/callController';
import { requireRole } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/calls
 * @desc Получить список звонков с фильтрацией и пагинацией
 * @access Private (Admin, Operator)
 * @query {string} dateFrom - Дата начала фильтрации (ISO string)
 * @query {string} dateTo - Дата окончания фильтрации (ISO string)
 * @query {string} city - Фильтр по городу
 * @query {string} rk - Фильтр по РК
 * @query {number} operatorId - Фильтр по ID оператора
 * @query {string} avitoName - Фильтр по имени Авито аккаунта
 * @query {string} status - Фильтр по статусу (answered, missed, busy, no_answer)
 * @query {number} page - Номер страницы (по умолчанию 1)
 * @query {number} limit - Количество элементов на странице (по умолчанию 20)
 * @query {string} sortBy - Поле для сортировки (по умолчанию dateCreate)
 * @query {string} sortOrder - Порядок сортировки: asc или desc (по умолчанию desc)
 */
router.get('/', callController.getCalls);

/**
 * @route GET /api/calls/stats
 * @desc Получить статистику звонков
 * @access Private (Admin, Operator)
 * @query {string} dateFrom - Дата начала фильтрации (ISO string)
 * @query {string} dateTo - Дата окончания фильтрации (ISO string)
 * @query {string} city - Фильтр по городу
 * @query {number} operatorId - Фильтр по ID оператора
 */
router.get('/stats', callController.getCallStats);

/**
 * @route GET /api/calls/:id
 * @desc Получить конкретный звонок по ID
 * @access Private (Admin, Operator)
 * @param {number} id - ID звонка
 */
router.get('/:id', callController.getCall);

/**
 * @route POST /api/calls
 * @desc Создать новый звонок (для интеграции с телефонией)
 * @access Private (Admin, Operator)
 * @body {string} rk - РК
 * @body {string} city - Город
 * @body {string} avitoName - Имя Авито аккаунта (опционально)
 * @body {string} phoneClient - Телефон клиента
 * @body {string} phoneAts - Телефон АТС
 * @body {number} operatorId - ID оператора
 * @body {string} status - Статус звонка (по умолчанию answered)
 * @body {number} mangoCallId - ID звонка в системе Mango (опционально)
 */
router.post('/', callController.createCall);

/**
 * @route PUT /api/calls/:id/status
 * @desc Обновить статус звонка
 * @access Private (Admin, Operator)
 * @param {number} id - ID звонка
 * @body {string} status - Новый статус (answered, missed, busy, no_answer)
 */
router.put('/:id/status', callController.updateCallStatus);

/**
 * @route GET /api/calls/:id
 * @desc Получить звонок по ID
 * @access Private (Admin, Operator)
 * @param {number} id - ID звонка
 */
router.get('/:id', callController.getCallById);

export default router;
