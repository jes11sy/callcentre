import Imap from 'imap';
// @ts-ignore
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import s3Service from './s3Service';

const prisma = new PrismaClient();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  searchCriteria: string[];
  attachmentTypes: string[];
}

interface RecordingEmail {
  callId?: string;
  mangoCallId?: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  subject: string;
  date: Date;
}

class EmailRecordingService {
  private config: EmailConfig | null = null;
  private processedEmails: Set<string> = new Set();

  constructor() {
    this.loadConfig();
  }

  /**
   * Загружает конфигурацию из БД
   */
  private async loadConfig(): Promise<void> {
    try {
      const settings = await prisma.emailSettings.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      console.log('📧 Загрузка настроек почты:', {
        found: !!settings,
        enabled: settings?.enabled,
        host: settings?.host
      });

      if (settings) {
        console.log('✅ Используем настройки из БД');
        this.config = {
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          user: settings.user,
          password: settings.password,
          searchCriteria: [settings.mangoEmail],
          attachmentTypes: ['.mp3', '.wav', '.m4a', '.aac']
        };
        
        // Проверяем, включен ли мониторинг
        if (!settings.enabled) {
          console.log('⚠️ Мониторинг почты отключен в настройках');
          return; // Не выполняем проверку, если отключено
        }
      } else {
        console.log('⚠️ Используем fallback настройки из .env');
        // Fallback на .env если нет настроек в БД
        this.config = {
          host: process.env.EMAIL_HOST || 'imap.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '993'),
          secure: process.env.EMAIL_SECURE === 'true',
          user: process.env.EMAIL_USER || '',
          password: process.env.EMAIL_PASSWORD || '',
          searchCriteria: [process.env.MANGO_EMAIL || 'mango@example.com'],
          attachmentTypes: ['.mp3', '.wav', '.m4a', '.aac']
        };
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки конфигурации почты:', error);
      // Fallback на .env при ошибке
      this.config = {
        host: process.env.EMAIL_HOST || 'imap.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '993'),
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        searchCriteria: [process.env.MANGO_EMAIL || 'mango@example.com'],
        attachmentTypes: ['.mp3', '.wav', '.m4a', '.aac']
      };
    }
  }

  /**
   * Проверяет почту на наличие новых записей звонков
   */
  async checkForNewRecordings(): Promise<void> {
    console.log('🔍 Проверка почты на новые записи звонков...');
    
    try {
      // Перезагружаем конфигурацию перед каждой проверкой
      await this.loadConfig();
      
      if (!this.config) {
        console.log('⚠️ Конфигурация почты не загружена');
        return;
      }
      
      // Проверяем, включен ли мониторинг
      const settings = await prisma.emailSettings.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      if (settings && !settings.enabled) {
        console.log('⚠️ Мониторинг почты отключен в настройках');
        return;
      }

      console.log('🔗 Подключение к почте:', {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        user: this.config.user,
        passwordLength: this.config.password?.length || 0,
        searchCriteria: this.config.searchCriteria
      });

      const imapConfig = {
        host: this.config.host,
        port: this.config.port,
        tls: this.config.secure,
        user: this.config.user,
        password: this.config.password,
        connTimeout: 120000, // 2 минуты
        authTimeout: 120000, // 2 минуты
        keepalive: {
          interval: 10000,
          idleInterval: 300000,
          forceNoop: true
        },
        tlsOptions: {
          rejectUnauthorized: false, // Для самоподписанных сертификатов
          servername: this.config.host
        }
      };

      console.log('🔧 IMAP Config:', {
        host: imapConfig.host,
        port: imapConfig.port,
        tls: imapConfig.tls,
        user: imapConfig.user,
        passwordSet: !!imapConfig.password,
        connTimeout: imapConfig.connTimeout,
        authTimeout: imapConfig.authTimeout
      });

      const imap = new Imap(imapConfig);
      
      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => {
          console.log('📧 Подключение к почте установлено');
          this.fetchEmails(imap).then(resolve).catch(reject);
        });

        imap.once('error', (err: Error) => {
          console.error('❌ Ошибка подключения к почте:', {
            message: err.message,
            source: (err as any).source,
            code: (err as any).code,
            host: this.config?.host,
            port: this.config?.port,
            secure: this.config?.secure
          });
          reject(err);
        });

        imap.connect();
      });

      imap.end();
    } catch (error) {
      console.error('❌ Ошибка при проверке почты:', error);
    }
  }

  /**
   * Получает и обрабатывает письма из почтового ящика
   */
  private async fetchEmails(imap: Imap): Promise<void> {
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err, box) => { // true = read-write режим
        if (err) {
          reject(err);
          return;
        }

        // Ищем все письма от Mango за последние 7 дней (для тестирования)
        const fromEmail = this.config?.searchCriteria?.[0] || 'mango@example.com';
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const searchCriteria = [
          ['SINCE', since],
          ['FROM', fromEmail]
        ];

        console.log('🔍 Поиск писем:', {
          criteria: searchCriteria,
          fromEmail: fromEmail
        });

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          console.log('📊 Результаты поиска:', {
            found: results?.length || 0,
            results: results
          });

          if (!results || results.length === 0) {
            console.log('📭 Новых писем с записями не найдено');
            resolve();
            return;
          }

          console.log(`📬 Найдено ${results.length} новых писем с записями`);

          const fetch = imap.fetch(results, { bodies: '', struct: true });
          
          fetch.on('message', (msg) => {
            this.processEmail(msg);
          });

          fetch.once('error', (err) => {
            console.error('❌ Ошибка при получении писем:', err);
            reject(err);
          });

          fetch.once('end', () => {
            console.log('✅ Обработка писем завершена');
            resolve();
          });
        });
      });
    });
  }

  /**
   * Обрабатывает отдельное письмо
   */
  private async processEmail(msg: any): Promise<void> {
    let buffer = '';

    msg.on('body', (stream: any) => {
      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
      });
    });

    msg.once('end', async () => {
      try {
        const parsed = await simpleParser(buffer);
        await this.handleRecordingEmail(parsed);
      } catch (error) {
        console.error('❌ Ошибка при парсинге письма:', error);
      }
    });
  }

  /**
   * Обрабатывает письмо с записью звонка
   */
  private async handleRecordingEmail(email: any): Promise<void> {
    const emailId = email.messageId;
    
    // Проверяем, не обрабатывали ли мы уже это письмо
    if (this.processedEmails.has(emailId)) {
      return;
    }

    console.log(`📧 Обработка письма: ${email.subject}`);

    // Извлекаем данные для поиска звонка
    const callData = this.extractCallData(email);
    
    if (!callData) {
      console.log('⚠️ Не удалось извлечь данные звонка из письма');
      return;
    }

    // Фильтруем аудио вложения
    const audioAttachments = email.attachments?.filter((att: any) => {
      const ext = path.extname(att.filename || '').toLowerCase();
      return this.config?.attachmentTypes.includes(ext) || false;
    }) || [];

    if (audioAttachments.length === 0) {
      console.log('⚠️ Аудио вложения не найдены');
      return;
    }

    // Сохраняем записи
    for (const attachment of audioAttachments) {
      await this.saveRecording(callData, attachment, email);
    }

    // Помечаем письмо как обработанное
    this.processedEmails.add(emailId);
    
    console.log(`✅ Запись для звонка успешно обработана`);
  }

  /**
   * Извлекает данные для поиска звонка из письма
   */
  private extractCallData(email: any): { date: string; time: string; phones: string[] } | null {
    // Пробуем извлечь из названий вложений (формат: 2025-09-21__11-45-54__79093330057__79923298779.mp3)
    if (email.attachments && email.attachments.length > 0) {
      for (const attachment of email.attachments) {
        const filename = attachment.filename || '';
        console.log('🔍 Анализ вложения:', filename);
        
        // Парсим название файла: 2025-09-21__11-45-54__79093330057__79923298779.mp3
        let match = filename.match(/(\d{4}-\d{2}-\d{2})__(\d{2}-\d{2}-\d{2})__(\d{11})__(\d{11})/);
        if (match) {
          const [, date, time, phone1, phone2] = match;
          console.log('✅ Найдены данные из вложения (формат 1):', { date, time, phones: [phone1, phone2] });
          return {
            date: date, // 2025-09-21
            time: time.replace(/-/g, ':'), // 11:45:54
            phones: [phone1, phone2]
          };
        }

        // Парсим альтернативный формат: 2023.12.23__18-43-12__74951234567__74951234567
        match = filename.match(/(\d{4})\.(\d{2})\.(\d{2})__(\d{2}-\d{2}-\d{2})__(\d{11})__(\d{11})/);
        if (match) {
          const [, year, month, day, time, phone1, phone2] = match;
          const date = `${year}-${month}-${day}`; // Конвертируем в формат 2023-12-23
          console.log('✅ Найдены данные из вложения (формат 2):', { date, time, phones: [phone1, phone2] });
          return {
            date: date,
            time: time.replace(/-/g, ':'), // 18:43:12
            phones: [phone1, phone2]
          };
        }
      }
    }

    return null;
  }

  /**
   * Сохраняет аудио запись
   */
  private async saveRecording(callData: { date: string; time: string; phones: string[] }, attachment: any, email: any): Promise<void> {
    try {
      // Используем оригинальное имя файла
      const filename = attachment.filename || 'recording.mp3';

      // Загружаем в S3
      const s3Key = await s3Service.uploadRecording(filename, attachment.content);
      console.log(`☁️ Файл загружен в S3: ${s3Key}`);

      // Обновляем запись в БД (сохраняем S3 ключ вместо локального пути)
      await this.updateCallWithRecording(callData, s3Key, email);

      console.log(`💾 Запись сохранена в S3: ${filename}`);
    } catch (error) {
      console.error('❌ Ошибка при сохранении записи в S3:', error);
    }
  }

  /**
   * Обновляет запись звонка в БД
   */
  private async updateCallWithRecording(callData: { date: string; time: string; phones: string[] }, s3Key: string, email: any): Promise<void> {
    try {
      // Создаем диапазон времени для поиска (плюс-минус 2 минуты)
      const callTime = new Date(`${callData.date}T${callData.time}`);
      const timeStart = new Date(callTime.getTime() - 2 * 60 * 1000); // -2 минуты
      const timeEnd = new Date(callTime.getTime() + 2 * 60 * 1000); // +2 минуты

      console.log('🔍 Поиск звонка по данным:', {
        date: callData.date,
        time: callData.time,
        phones: callData.phones,
        timeRange: { start: timeStart, end: timeEnd }
      });

      // Проверяем, не привязан ли уже этот файл к другому звонку
      const existingCallWithSameFile = await prisma.call.findFirst({
        where: {
          recordingPath: s3Key
        }
      });

      if (existingCallWithSameFile) {
        console.log(`⚠️ Файл записи уже привязан к звонку ID: ${existingCallWithSameFile.id}`);
        return;
      }

      // Сначала ищем звонки с уже существующими записями, чтобы избежать дублирования
      const existingCallsWithRecordings = await prisma.call.findMany({
        where: {
          AND: [
            {
              createdAt: {
                gte: timeStart,
                lte: timeEnd
              }
            },
            {
              OR: [
                { phoneClient: { in: callData.phones } },
                { phoneAts: { in: callData.phones } }
              ]
            },
            {
              recordingPath: {
                not: null
              }
            }
          ]
        }
      });

      if (existingCallsWithRecordings.length > 0) {
        console.log(`⚠️ Найдены звонки с уже существующими записями:`, existingCallsWithRecordings.map(c => c.id));
        return;
      }

      // Ищем звонки без записей
      const callsWithoutRecordings = await prisma.call.findMany({
        where: {
          AND: [
            {
              createdAt: {
                gte: timeStart,
                lte: timeEnd
              }
            },
            {
              OR: [
                { phoneClient: { in: callData.phones } },
                { phoneAts: { in: callData.phones } }
              ]
            },
            {
              recordingPath: null
            }
          ]
        },
        orderBy: {
          createdAt: 'asc' // Берем самый ранний звонок
        }
      });

      if (callsWithoutRecordings.length === 0) {
        console.log(`⚠️ Звонки не найдены в БД по данным:`, callData);
        return;
      }

      if (callsWithoutRecordings.length > 1) {
        console.log(`⚠️ Найдено несколько звонков (${callsWithoutRecordings.length}) в диапазоне времени. Выбираем ближайший по времени.`);
        console.log('Найденные звонки:', callsWithoutRecordings.map(c => ({
          id: c.id,
          createdAt: c.createdAt,
          phoneClient: c.phoneClient,
          phoneAts: c.phoneAts,
          timeDiff: Math.abs(c.createdAt.getTime() - callTime.getTime())
        })));
      }

      // Выбираем звонок, ближайший по времени к времени записи
      const call = callsWithoutRecordings.reduce((closest, current) => {
        const closestDiff = Math.abs(closest.createdAt.getTime() - callTime.getTime());
        const currentDiff = Math.abs(current.createdAt.getTime() - callTime.getTime());
        return currentDiff < closestDiff ? current : closest;
      });

      // Обновляем запись звонка
      await prisma.call.update({
        where: { id: call.id },
        data: {
          recordingPath: s3Key,
          recordingProcessedAt: new Date(),
          recordingEmailSent: true
        }
      });

      console.log(`✅ Запись привязана к звонку ID: ${call.id} (${call.createdAt}), S3 ключ: ${s3Key}`);
    } catch (error) {
      console.error('❌ Ошибка при обновлении БД:', error);
    }
  }

  /**
   * Очищает дублированные записи (если один файл привязан к нескольким звонкам)
   */
  async cleanupDuplicateRecordings(): Promise<{ success: boolean; message: string; cleanedCount: number }> {
    try {
      console.log('🧹 Начинаем очистку дублированных записей...');
      
      // Находим все записи с одинаковыми путями к файлам
      const duplicateRecordings = await prisma.call.groupBy({
        by: ['recordingPath'],
        where: {
          recordingPath: {
            not: null
          }
        },
        _count: {
          recordingPath: true
        },
        having: {
          recordingPath: {
            _count: {
              gt: 1
            }
          }
        }
      });

      if (duplicateRecordings.length === 0) {
        return {
          success: true,
          message: 'Дублированных записей не найдено',
          cleanedCount: 0
        };
      }

      let cleanedCount = 0;

      for (const duplicate of duplicateRecordings) {
        if (!duplicate.recordingPath) continue;

        // Находим все звонки с этим файлом
        const callsWithSameFile = await prisma.call.findMany({
          where: {
            recordingPath: duplicate.recordingPath
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        if (callsWithSameFile.length > 1) {
          // Оставляем запись только у самого раннего звонка
          const keepCall = callsWithSameFile[0];
          const removeCalls = callsWithSameFile.slice(1);

          // Удаляем записи у остальных звонков
          for (const call of removeCalls) {
            await prisma.call.update({
              where: { id: call.id },
              data: {
                recordingPath: null,
                recordingProcessedAt: null,
                recordingEmailSent: false
              }
            });
            cleanedCount++;
          }

          console.log(`🧹 Очищено дублирование для файла ${duplicate.recordingPath}: оставлен звонок ${keepCall.id}, удалено ${removeCalls.length} дубликатов`);
        }
      }

      return {
        success: true,
        message: `Очистка завершена. Удалено ${cleanedCount} дублированных записей`,
        cleanedCount
      };

    } catch (error) {
      console.error('❌ Ошибка при очистке дублированных записей:', error);
      return {
        success: false,
        message: `Ошибка при очистке: ${error}`,
        cleanedCount: 0
      };
    }
  }

  /**
   * Ручная проверка почты (для API endpoint)
   */
  async manualCheck(): Promise<{ success: boolean; message: string; processedCount: number }> {
    try {
      const initialProcessedCount = this.processedEmails.size;
      await this.checkForNewRecordings();
      const finalProcessedCount = this.processedEmails.size;
      
      return {
        success: true,
        message: 'Проверка почты завершена',
        processedCount: finalProcessedCount - initialProcessedCount
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка при проверке почты: ${error}`,
        processedCount: 0
      };
    }
  }

  /**
   * Обновляет конфигурацию (вызывается после изменения настроек)
   */
  async reloadConfig(): Promise<void> {
    await this.loadConfig();
  }
}

export default new EmailRecordingService();
