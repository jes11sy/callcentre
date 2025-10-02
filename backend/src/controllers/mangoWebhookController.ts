import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import { getSocketIO } from '../config/socket';

const prisma = new PrismaClient();

// Интерфейс для данных webhook от Mango
interface MangoWebhookData {
  call_id: string;
  from: string;
  to: string;
  direction: 'in' | 'out';
  status: 'start' | 'answer' | 'end';
  duration?: number;
  record_url?: string;
  timestamp: number;
  entry_id?: string;
  line_number?: string;
  location?: string;
  disconnect_reason?: string;
  vpbx_api_id?: string;
  vpbx_api_key?: string;
}

// Интерфейс для создания звонка
interface CreateCallData {
  rk: string;
  city: string;
  avitoName?: string;
  phoneClient: string;
  phoneAts: string;
  operatorId: number;
  status: 'answered' | 'missed' | 'busy' | 'no_answer';
  mangoCallId?: number;
  dateCreate: Date;
}

export const mangoWebhookController = {
  // Обработка webhook от Mango ATC
  async handleWebhook(req: Request, res: Response) {
    try {
      const rawData = req.body;
      
      // Парсим данные Mango Office (они приходят в поле json как строка)
      let webhookData: any;
      if (rawData.json) {
        webhookData = JSON.parse(rawData.json);
      } else {
        webhookData = rawData;
      }
      
      logger.info('Получен webhook от Mango ATC:', {
        callId: webhookData.call_id,
        callState: webhookData.call_state,
        from: webhookData.from?.number,
        to: webhookData.to?.number,
        location: webhookData.location,
        fullData: JSON.stringify(webhookData, null, 2)
      });

      // Обрабатываем события звонков по call_state
      if (webhookData.call_state === 'Disconnected') {
        await handleCallEnd(webhookData);
      }
      // Обрабатываем начало звонка для создания записи
      else if (webhookData.call_state === 'Appeared') {
        await handleCallStart(webhookData);
      }
      // Обрабатываем ответ на звонок
      else if (webhookData.call_state === 'Connected') {
        await handleCallAnswer(webhookData);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Ошибка при обработке webhook от Mango:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Ошибка при обработке webhook' 
      });
    }
  },

  // Получить настройки Mango ATC
  async getMangoSettings(req: Request, res: Response) {
    try {
      // Здесь можно добавить настройки из БД или конфига
      const settings = {
        webhookUrl: process.env.MANGO_WEBHOOK_URL || '/api/webhooks/mango',
        apiUrl: process.env.MANGO_API_URL || 'https://app.mango-office.ru/vpbx',
        apiKey: process.env.MANGO_API_KEY || '',
        apiId: process.env.MANGO_API_ID || ''
      };

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Ошибка при получении настроек Mango:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении настроек'
      });
    }
  },

  // Получить сводку событий (для Mango Office)
  async getEventsSummary(req: Request, res: Response) {
    try {
      logger.info('Получен запрос сводки событий от Mango Office');

      // Получаем статистику из БД
      const totalCalls = await prisma.call.count();
      const totalMangoRecords = await prisma.mango.count();
      
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCalls = await prisma.call.count({
        where: {
          createdAt: {
            gte: last24Hours
          }
        }
      });

      const summary = {
        total_calls: totalCalls,
        total_mango_records: totalMangoRecords,
        recent_calls_24h: recentCalls,
        webhook_status: 'active',
        last_updated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: summary
      });

      logger.info('Отправлена сводка событий:', summary);
    } catch (error) {
      logger.error('Ошибка при получении сводки событий:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении сводки событий'
      });
    }
  },

  // Проверка статуса webhook (для Mango Office)
  async getWebhookStatus(req: Request, res: Response) {
    try {
      logger.info('Проверка статуса webhook от Mango Office');

      const status = {
        status: 'active',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
          webhook: '/api/webhooks/mango',
          summary: '/api/webhooks/mango/events/summary',
          status: '/api/webhooks/mango/status',
          recording: '/api/webhooks/mango/events/recording',
          call: '/api/webhooks/mango/events/call'
        }
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Ошибка при проверке статуса webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при проверке статуса'
      });
    }
  },

  // Обработка записей звонков (для Mango Office)
  async handleRecording(req: Request, res: Response) {
    try {
      const recordingData = req.body;
      
      logger.info('Получены данные записи от Mango Office:', {
        callId: recordingData.call_id,
        recordUrl: recordingData.record_url,
        duration: recordingData.duration
      });

      // Обновляем запись в таблице mango с URL записи
      if (recordingData.call_id) {
        await prisma.mango.updateMany({
          where: { callId: recordingData.call_id },
          data: {
            recordUrl: recordingData.record_url,
            duration: recordingData.duration,
            mangoData: recordingData as any
          }
        });

        logger.info(`Обновлена запись для звонка ${recordingData.call_id}`);
      }

      res.json({
        success: true,
        message: 'Recording data processed successfully'
      });
    } catch (error) {
      logger.error('Ошибка при обработке записи:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обработке записи'
      });
    }
  }
};

// Обработка начала звонка
async function handleCallStart(webhookData: any) {
  try {
    const callId = webhookData.call_id;
    const fromNumber = webhookData.from?.number;
    const toNumber = webhookData.to?.number;
    const direction = fromNumber && toNumber ? 'in' : 'out';
    
    // Создаем запись в таблице mango для отслеживания
    const mangoRecord = await prisma.mango.upsert({
      where: { callId: callId },
      update: {
        phoneNumber: fromNumber || toNumber,
        direction: direction,
        status: 'started',
        mangoData: webhookData as any
      },
      create: {
        callId: callId,
        phoneNumber: fromNumber || toNumber,
        direction: direction,
        status: 'started',
        mangoData: webhookData as any
      }
    });

    logger.info(`Создана запись Mango для звонка ${callId}`);
  } catch (error) {
    logger.error('Ошибка при создании записи Mango:', error);
  }
}

// Обработка ответа на звонок
async function handleCallAnswer(webhookData: any) {
  try {
    // Обновляем статус в таблице mango
    await prisma.mango.update({
      where: { callId: webhookData.call_id },
      data: {
        status: 'answered',
        mangoData: webhookData as any
      }
    });

    logger.info(`Звонок ${webhookData.call_id} отвечен`);
  } catch (error) {
    logger.error('Ошибка при обновлении статуса ответа:', error);
  }
}

// Обработка завершения звонка
async function handleCallEnd(webhookData: any) {
  try {
    // Сначала проверяем, существует ли запись Mango
    const existingMango = await prisma.mango.findUnique({
      where: { callId: webhookData.call_id }
    });

    if (!existingMango) {
      logger.warn(`Запись Mango не найдена для callId: ${webhookData.call_id}`);
      return;
    }

    // Обновляем запись в таблице mango
    const mangoRecord = await prisma.mango.update({
      where: { callId: webhookData.call_id },
      data: {
        status: 'completed',
        mangoData: webhookData as any
      }
    });

    // Определяем номер клиента и АТС
    const phoneClient = webhookData.from?.number;
    // Ищем оператора по SIP-адресу (to.number) или номеру АТС (to.line_number)
    const sipAddress = webhookData.to?.number;
    const phoneAts = webhookData.to?.line_number;

    logger.info('Поиск оператора:', {
      phoneClient,
      phoneAts,
      sipAddress,
      toNumber: webhookData.to?.number,
      toLineNumber: webhookData.to?.line_number
    });

    // Ищем оператора по SIP-адресу или номеру АТС
    const operator = await findOperatorByPhone(sipAddress || phoneAts);
    
    if (!operator) {
      logger.warn(`Оператор не найден для номера АТС: ${phoneAts}`);
      return;
    }

    // Определяем статус звонка
    const callStatus = determineCallStatus(webhookData);

    // Ищем существующую запись звонка
    const existingCall = await prisma.call.findFirst({
      where: { mangoCallId: mangoRecord.id }
    });

    if (existingCall) {
      // Обновляем существующую запись
      const updatedCall = await prisma.call.update({
        where: { id: existingCall.id },
        data: {
          status: callStatus
        },
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              login: true
            }
          },
          mango: true
        }
      });
      
      logger.info(`Обновлен звонок ID: ${existingCall.id}`);

      // Broadcast call update to all connected operators via Socket.IO
      try {
        const io = getSocketIO();
        io.emit('mango-call-updated', {
          callId: updatedCall.id,
          call: {
            id: updatedCall.id,
            rk: updatedCall.rk,
            city: updatedCall.city,
            avitoName: updatedCall.avitoName,
            phoneClient: updatedCall.phoneClient,
            phoneAts: updatedCall.phoneAts,
            dateCreate: updatedCall.dateCreate.toISOString(),
            status: updatedCall.status,
            recordingPath: updatedCall.recordingPath,
            recordingEmailSent: updatedCall.recordingEmailSent,
            recordingProcessedAt: updatedCall.recordingProcessedAt?.toISOString(),
            operator: updatedCall.operator,
            avito: updatedCall.avito,
            phone: updatedCall.phone,
            mango: updatedCall.mango
          }
        });
        
        logger.info('✅ Broadcasted call update event to operators');
      } catch (error) {
        logger.error('Error broadcasting call update:', error);
      }
    } else {
      // Создаем новую запись звонка
      const callData = await prepareCallData({
        phoneClient,
        phoneAts,
        operatorId: operator.id,
        status: callStatus,
        mangoCallId: mangoRecord.id
      });

      const call = await prisma.call.create({
        data: callData,
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              login: true
            }
          },
          mango: true
        }
      });

      logger.info(`Создан новый звонок ID: ${call.id} для ${phoneClient}`);

      // Broadcast new call to all connected operators via Socket.IO
      try {
        const io = getSocketIO();
        io.emit('mango-new-call', {
          call: {
            id: call.id,
            rk: call.rk,
            city: call.city,
            avitoName: call.avitoName,
            phoneClient: call.phoneClient,
            phoneAts: call.phoneAts,
            dateCreate: call.dateCreate.toISOString(),
            status: call.status,
            recordingPath: call.recordingPath,
            recordingEmailSent: call.recordingEmailSent,
            recordingProcessedAt: call.recordingProcessedAt?.toISOString(),
            operator: call.operator,
            avito: call.avito,
            phone: call.phone,
            mango: call.mango
          }
        });
        
        logger.info('✅ Broadcasted new call event to operators');
      } catch (error) {
        logger.error('Error broadcasting new call:', error);
      }
    }
  } catch (error) {
    logger.error('Ошибка при обработке завершения звонка:', error);
  }
}

// Поиск оператора по номеру телефона
async function findOperatorByPhone(phoneNumber: string) {
  try {
    logger.info(`Поиск оператора для номера: ${phoneNumber}`);
    
    // Сначала ищем оператора по SIP-адресу
    const operatorBySip = await prisma.callcentreOperator.findFirst({
      where: { 
        status: 'active',
        sipAddress: phoneNumber
      }
    });
    
    if (operatorBySip) {
      logger.info('Найден оператор по SIP-адресу:', { operator: operatorBySip });
      return operatorBySip;
    }
    
    // Если не найден по SIP, берем первого активного оператора
    const operator = await prisma.callcentreOperator.findFirst({
      where: { status: 'active' }
    });
    
    logger.info('Найденный оператор (fallback):', { operator });
    return operator;
    
  } catch (error) {
    logger.error('Ошибка при поиске оператора:', error);
    return null;
  }
}

// Определение статуса звонка
function determineCallStatus(webhookData: any): 'answered' | 'missed' | 'busy' | 'no_answer' {
  // Проверяем disconnect_reason
  if (webhookData.disconnect_reason) {
    switch (webhookData.disconnect_reason) {
      case 1100: // Нормальное завершение
        return 'answered';
      case 1120: // Нормальное завершение
        return 'answered';
      case 1101: // Занято
        return 'busy';
      case 1102: // Нет ответа
        return 'no_answer';
      default:
        return 'missed';
    }
  }
  
  // Если нет disconnect_reason, считаем пропущенным
  return 'missed';
}

// Подготовка данных для создания звонка
async function prepareCallData(data: {
  phoneClient: string;
  phoneAts: string;
  operatorId: number;
  status: string;
  mangoCallId: number;
}): Promise<CreateCallData> {
  // Ищем информацию о телефоне АТС
  const phone = await prisma.phone.findUnique({
    where: { number: data.phoneAts }
  });

  // Получаем информацию об операторе
  const operator = await prisma.callcentreOperator.findUnique({
    where: { id: data.operatorId }
  });

  return {
    rk: phone?.rk || 'Неизвестно',
    city: phone?.city || operator?.city || 'Неизвестно',
    avitoName: phone?.avitoName || undefined, // Берем из таблицы phones (null -> undefined)
    phoneClient: data.phoneClient,
    phoneAts: data.phoneAts,
    operatorId: data.operatorId,
    status: data.status as any,
    mangoCallId: data.mangoCallId,
    dateCreate: new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Moscow"}))
  };
}
