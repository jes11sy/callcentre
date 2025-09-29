import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { orderValidation } from '../middleware/validation';
import { auditLoggers } from '../middleware/auditLogger';

const router = Router();

/**
 * @route POST /api/orders/from-call
 * @desc Создать заказ из звонка
 * @access Private (Admin, Operator)
 * @body {number} callId - ID звонка
 * @body {string} typeOrder - Тип заявки (Впервые, Повтор, Гарантия)
 * @body {string} clientName - Имя клиента
 * @body {string} address - Адрес
 * @body {string} dateMeeting - Дата встречи (ISO string)
 * @body {string} typeEquipment - Тип техники (КП, БТ, МНЧ)
 * @body {string} problem - Описание проблемы
 * @body {number} masterId - ID мастера (опционально)
 */
router.post('/from-call', orderValidation.createFromCall, auditLoggers.createOrder, orderController.createOrderFromCall);

/**
 * @route POST /api/orders/from-chat
 * @desc Создать заказ из чата Авито
 * @access Private (Admin, Operator)
 * @body {string} chatId - ID чата
 * @body {string} avitoChatId - ID чата Авито
 * @body {string} typeOrder - Тип заявки (Впервые, Повтор, Гарантия)
 * @body {string} clientName - Имя клиента
 * @body {string} phone - Номер телефона
 * @body {string} address - Адрес
 * @body {string} dateMeeting - Дата встречи (ISO string)
 * @body {string} typeEquipment - Тип техники (КП, БТ, МНЧ)
 * @body {string} problem - Описание проблемы
 * @body {number} masterId - ID мастера (опционально)
 */
router.post('/from-chat', orderValidation.create, auditLoggers.createOrder, orderController.createOrderFromChat);

/**
 * @route GET /api/orders
 * @desc Получить список заказов с фильтрацией и пагинацией
 * @access Private (Admin, Operator)
 * @query {number} page - Номер страницы (по умолчанию 1)
 * @query {number} limit - Количество элементов на странице (по умолчанию 20)
 * @query {string} sortBy - Поле для сортировки (по умолчанию createDate)
 * @query {string} sortOrder - Порядок сортировки: asc или desc (по умолчанию desc)
 * @query {string} status - Фильтр по статусу
 * @query {string} city - Фильтр по городу
 * @query {string} rk - Фильтр по РК
 * @query {number} operatorId - Фильтр по ID оператора
 * @query {string} dateFrom - Дата начала фильтрации (ISO string)
 * @query {string} dateTo - Дата окончания фильтрации (ISO string)
 */
router.get('/', orderController.getOrders);

/**
 * @route GET /api/orders/:id
 * @desc Получить конкретный заказ по ID
 * @access Private (Admin, Operator)
 * @param {number} id - ID заказа
 */
router.get('/:id', orderValidation.update[0], orderController.getOrder);

/**
 * @route POST /api/orders
 * @desc Создать новый заказ
 * @access Private (Admin, Operator)
 * @body {string} rk - РК
 * @body {string} city - Город
 * @body {string} avitoName - Имя Авито аккаунта (опционально)
 * @body {string} phone - Телефон клиента
 * @body {string} typeOrder - Тип заявки (Впервые, Повтор, Гарантия)
 * @body {string} clientName - Имя клиента
 * @body {string} address - Адрес
 * @body {string} dateMeeting - Дата встречи (ISO string)
 * @body {string} typeEquipment - Тип техники (КП, БТ, МНЧ)
 * @body {string} problem - Описание проблемы
 * @body {string} callRecord - URL записи звонка (опционально)
 * @body {number} masterId - ID мастера (опционально)
 * @body {number} operatorNameId - ID оператора
 */
router.post('/', orderValidation.create, auditLoggers.createOrder, orderController.createOrder);

/**
 * @route PUT /api/orders/:id/status
 * @desc Обновить статус заказа
 * @access Private (Admin, Operator)
 * @param {number} id - ID заказа
 * @body {string} status - Новый статус (Ожидает, Принял, В пути, В работе, Готово, Отказ, Модерн, Незаказ)
 */
router.put('/:id/status', orderValidation.update[0], auditLoggers.updateOrder, orderController.updateOrderStatus);

/**
 * @route PUT /api/orders/:id
 * @desc Обновить заказ (редактирование)
 * @access Private (Admin, Operator)
 * @param {number} id - ID заказа
 * @body {object} orderData - Данные заказа для обновления
 */
router.put('/:id', orderValidation.update, auditLoggers.updateOrder, orderController.updateOrder);

/**
 * @route DELETE /api/orders/:id
 * @desc Удалить заказ
 * @access Private (Admin, Operator)
 * @param {number} id - ID заказа
 */
router.delete('/:id', orderValidation.update[0], auditLoggers.deleteOrder, orderController.deleteOrder);

/**
 * @route PUT /api/orders/update-call-ids/:phone
 * @desc Обновить call_id для всех заказов с определенным номером телефона
 * @access Private (Admin, Operator)
 * @param {string} phone - Номер телефона
 */
router.put('/update-call-ids/:phone', orderController.updateOrderCallIds);

export default router;
