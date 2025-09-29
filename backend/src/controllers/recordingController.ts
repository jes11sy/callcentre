import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import cronService from '../services/cronService';
import emailRecordingService from '../services/emailRecordingService';
import s3Service from '../services/s3Service';

const prisma = new PrismaClient();

/**
 * Получить статус cron задач
 */
export const getCronStatus = async (req: Request, res: Response) => {
  try {
    const status = cronService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статуса cron задач'
    });
  }
};

/**
 * Ручной запуск проверки почты
 */
export const triggerEmailCheck = async (req: Request, res: Response) => {
  try {
    const result = await cronService.triggerEmailCheck();
    
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

/**
 * Получить запись звонка
 */
export const getCallRecording = async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    
    const call = await prisma.call.findUnique({
      where: { id: parseInt(callId) },
      select: {
        id: true,
        recordingPath: true,
        recordingProcessedAt: true,
        recordingEmailSent: true
      }
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Звонок не найден'
      });
    }

    if (!call.recordingPath) {
      return res.status(404).json({
        success: false,
        message: 'Запись звонка не найдена'
      });
    }

    // Проверяем, S3 ключ это или локальный путь
    const isS3File = call.recordingPath.startsWith('callcentre/recording_path/');
    
    if (isS3File) {
      // Файл в S3 - получаем подписанный URL
      const signedUrl = await s3Service.getRecordingUrl(call.recordingPath);
      
      return res.json({
        success: true,
        url: signedUrl,
        type: 's3'
      });
    } else {
      // Локальный файл - проверяем существование
      if (!fs.existsSync(call.recordingPath)) {
        return res.status(404).json({
          success: false,
          message: 'Файл записи не найден на диске'
        });
      }

      // Отправляем файл для воспроизведения
      const filename = path.basename(call.recordingPath);
      const ext = path.extname(filename).toLowerCase();
    
    // Определяем MIME тип по расширению
    let mimeType = 'audio/mpeg';
    if (ext === '.wav') mimeType = 'audio/wav';
    else if (ext === '.m4a') mimeType = 'audio/mp4';
    else if (ext === '.aac') mimeType = 'audio/aac';
    
    // Получаем информацию о файле
    const stats = fs.statSync(call.recordingPath);
    const fileSize = stats.size;
    
    // Обрабатываем Range запросы для потокового воспроизведения
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      const fileStream = fs.createReadStream(call.recordingPath, { start, end });
      fileStream.pipe(res);
    } else {
      // Устанавливаем заголовки для полного файла
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      const fileStream = fs.createReadStream(call.recordingPath);
      fileStream.pipe(res);
    }
    }

  } catch (error) {
    console.error('Error getting call recording:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении записи звонка'
    });
  }
};

/**
 * Получить информацию о записи звонка
 */
export const getCallRecordingInfo = async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    
    const call = await prisma.call.findUnique({
      where: { id: parseInt(callId) },
      select: {
        id: true,
        recordingPath: true,
        recordingProcessedAt: true,
        recordingEmailSent: true,
        mangoCallId: true
      }
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Звонок не найден'
      });
    }

    let fileInfo = null;
    if (call.recordingPath && fs.existsSync(call.recordingPath)) {
      const stats = fs.statSync(call.recordingPath);
      fileInfo = {
        filename: path.basename(call.recordingPath),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }

    res.json({
      success: true,
      data: {
        callId: call.id,
        mangoCallId: call.mangoCallId,
        recordingPath: call.recordingPath,
        recordingProcessedAt: call.recordingProcessedAt,
        recordingEmailSent: call.recordingEmailSent,
        fileInfo
      }
    });

  } catch (error) {
    console.error('Error getting call recording info:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении информации о записи'
    });
  }
};

/**
 * Удалить запись звонка
 */
export const deleteCallRecording = async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    
    const call = await prisma.call.findUnique({
      where: { id: parseInt(callId) },
      select: {
        id: true,
        recordingPath: true
      }
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Звонок не найден'
      });
    }

    // Удаляем файл с диска
    if (call.recordingPath && fs.existsSync(call.recordingPath)) {
      fs.unlinkSync(call.recordingPath);
    }

    // Обновляем запись в БД
    await prisma.call.update({
      where: { id: call.id },
      data: {
        recordingPath: null,
        recordingProcessedAt: null
      }
    });

    res.json({
      success: true,
      message: 'Запись звонка успешно удалена'
    });

  } catch (error) {
    console.error('Error deleting call recording:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении записи звонка'
    });
  }
};

/**
 * Получить статистику записей
 */
export const getRecordingsStats = async (req: Request, res: Response) => {
  try {
    const totalCalls = await prisma.call.count();
    const callsWithRecordings = await prisma.call.count({
      where: {
        recordingPath: {
          not: null
        }
      }
    });
    const callsWithEmailSent = await prisma.call.count({
      where: {
        recordingEmailSent: true
      }
    });

    // Статистика по последним 30 дням
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCalls = await prisma.call.count({
      where: {
        dateCreate: {
          gte: thirtyDaysAgo
        }
      }
    });

    const recentRecordings = await prisma.call.count({
      where: {
        dateCreate: {
          gte: thirtyDaysAgo
        },
        recordingPath: {
          not: null
        }
      }
    });

    res.json({
      success: true,
      data: {
        total: {
          calls: totalCalls,
          recordings: callsWithRecordings,
          emailSent: callsWithEmailSent
        },
        recent: {
          calls: recentCalls,
          recordings: recentRecordings,
          period: '30 дней'
        },
        percentages: {
          recordings: totalCalls > 0 ? Math.round((callsWithRecordings / totalCalls) * 100) : 0,
          emailSent: totalCalls > 0 ? Math.round((callsWithEmailSent / totalCalls) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting recordings stats:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики записей'
    });
  }
};

/**
 * Очистить дублированные записи
 */
export const cleanupDuplicateRecordings = async (req: Request, res: Response) => {
  try {
    const result = await emailRecordingService.cleanupDuplicateRecordings();
    
    res.json({
      success: result.success,
      message: result.message,
      cleanedCount: result.cleanedCount
    });
  } catch (error) {
    console.error('Error cleaning up duplicate recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при очистке дублированных записей'
    });
  }
};
