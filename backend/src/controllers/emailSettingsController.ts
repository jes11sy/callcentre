import { Request, Response } from 'express';
import Imap from 'imap';
// @ts-ignore
import { simpleParser } from 'mailparser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  mangoEmail: string;
  checkInterval: number; // в минутах
  enabled: boolean;
}

/**
 * Получить текущие настройки почты
 */
export const getEmailSettings = async (req: Request, res: Response) => {
  try {
    // Ищем настройки в БД
    let settings = await prisma.emailSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Если настроек нет в БД, создаем из .env
    if (!settings) {
      settings = await prisma.emailSettings.create({
        data: {
          host: process.env.EMAIL_HOST || 'imap.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '993'),
          secure: process.env.EMAIL_SECURE === 'true',
          user: process.env.EMAIL_USER || '',
          password: process.env.EMAIL_PASSWORD || '',
          mangoEmail: process.env.MANGO_EMAIL || '',
          checkInterval: parseInt(process.env.EMAIL_CHECK_INTERVAL || '5'),
          enabled: process.env.EMAIL_MONITORING_ENABLED === 'true'
        }
      });
    }

    // Скрываем пароль в ответе
    const responseData = {
      ...settings,
      password: settings.password ? '***' : ''
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error getting email settings:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении настроек почты'
    });
  }
};

/**
 * Обновить настройки почты
 */
export const updateEmailSettings = async (req: Request, res: Response) => {
  try {
    const {
      host,
      port,
      secure,
      user,
      password,
      mangoEmail,
      checkInterval,
      enabled
    }: EmailSettings = req.body;

    // Валидация
    if (!host || !user || !mangoEmail) {
      return res.status(400).json({
        success: false,
        message: 'Поля host, user и mangoEmail обязательны'
      });
    }

    if (port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Порт должен быть в диапазоне 1-65535'
      });
    }

    if (checkInterval < 1 || checkInterval > 1440) {
      return res.status(400).json({
        success: false,
        message: 'Интервал проверки должен быть от 1 до 1440 минут'
      });
    }

    // Ищем существующие настройки
    const existingSettings = await prisma.emailSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let updatedSettings;

    if (existingSettings) {
      // Обновляем существующие настройки
      updatedSettings = await prisma.emailSettings.update({
        where: { id: existingSettings.id },
        data: {
          host,
          port,
          secure,
          user,
          password: password === '***' ? existingSettings.password : password, // Сохраняем старый пароль если не изменился
          mangoEmail,
          checkInterval,
          enabled
        }
      });
    } else {
      // Создаем новые настройки
      updatedSettings = await prisma.emailSettings.create({
        data: {
          host,
          port,
          secure,
          user,
          password,
          mangoEmail,
          checkInterval,
          enabled
        }
      });
    }

    // Перезагружаем конфигурацию в сервисе
    const emailRecordingService = require('../services/emailRecordingService').default;
    await emailRecordingService.reloadConfig();

    // Скрываем пароль в ответе
    const responseData = {
      ...updatedSettings,
      password: '***'
    };
    
    res.json({
      success: true,
      message: 'Настройки почты обновлены',
      data: responseData
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении настроек почты'
    });
  }
};

/**
 * Тестировать подключение к почте
 */
export const testEmailConnection = async (req: Request, res: Response) => {
  try {
    // Получаем настройки из БД
    const settings = await prisma.emailSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Настройки почты не найдены. Сначала сохраните настройки.'
      });
    }

    const config = {
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      user: settings.user,
      password: settings.password,
      connTimeout: 60000, // 60 секунд
      authTimeout: 60000, // 60 секунд
      keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: true
      },
      // Дополнительные настройки для Timeweb
      tls: false,
      tlsOptions: { rejectUnauthorized: false }
    };

    console.log('🔗 Тест подключения к почте:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user
    });

    // Тестируем подключение
    const imap = new Imap(config);
    
    const testResult = await new Promise<{ success: boolean; message: string }>((resolve) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          imap.end();
          resolve({
            success: false,
            message: 'Таймаут подключения (60 секунд)'
          });
        }
      }, 60000);

      imap.once('ready', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          imap.end();
          console.log('✅ Тест подключения успешен');
          resolve({
            success: true,
            message: 'Подключение к почте успешно'
          });
        }
      });

      imap.once('error', (err: Error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.error('❌ Ошибка теста подключения:', {
            message: err.message,
            source: (err as any).source,
            code: (err as any).code
          });
          resolve({
            success: false,
            message: `Ошибка подключения: ${err.message}`
          });
        }
      });

      imap.connect();
    });

    res.json({
      success: testResult.success,
      message: testResult.message
    });

  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при тестировании подключения к почте'
    });
  }
};

/**
 * Получить статистику мониторинга почты
 */
export const getEmailMonitoringStats = async (req: Request, res: Response) => {
  try {
    // Получаем статистику из БД
    const totalCalls = await prisma.call.count();
    const callsWithRecordings = await prisma.call.count({
      where: {
        recordingPath: {
          not: null
        }
      }
    });
    
    const recentProcessed = await prisma.call.count({
      where: {
        recordingProcessedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
        }
      }
    });

    const lastProcessed = await prisma.call.findFirst({
      where: {
        recordingProcessedAt: {
          not: null
        }
      },
      orderBy: {
        recordingProcessedAt: 'desc'
      },
      select: {
        recordingProcessedAt: true
      }
    });

    const stats = {
      totalCalls,
      callsWithRecordings,
      recentProcessed,
      successRate: totalCalls > 0 ? Math.round((callsWithRecordings / totalCalls) * 100) : 0,
      lastProcessed: lastProcessed?.recordingProcessedAt?.toISOString() || null,
      nextCheck: new Date(Date.now() + 5 * 60 * 1000).toISOString() // +5 минут
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting email monitoring stats:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики мониторинга'
    });
  }
};

/**
 * Ручной запуск проверки почты
 */
export const triggerEmailCheck = async (req: Request, res: Response) => {
  try {
    // Импортируем сервис динамически, чтобы избежать циклических зависимостей
    const emailRecordingService = require('../services/emailRecordingService').default;
    
    const result = await emailRecordingService.manualCheck();
    
    res.json({
      success: result.success,
      message: result.message,
      processedCount: result.processedCount
    });
  } catch (error) {
    console.error('Error triggering email check:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при запуске проверки почты'
    });
  }
};
