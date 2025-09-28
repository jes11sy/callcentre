import cron from 'node-cron';
import emailRecordingService from './emailRecordingService';

class CronService {
  private emailCheckJob: cron.ScheduledTask | null = null;

  /**
   * Запускает все cron задачи
   */
  start(): void {
    console.log('🚀 Запуск cron сервиса...');
    this.startEmailMonitoring();
    console.log('✅ Cron сервис запущен');
  }

  /**
   * Останавливает все cron задачи
   */
  stop(): void {
    console.log('🛑 Остановка cron сервиса...');
    
    if (this.emailCheckJob) {
      this.emailCheckJob.stop();
      this.emailCheckJob = null;
    }
    
    console.log('✅ Cron сервис остановлен');
  }

  /**
   * Запускает мониторинг почты каждые 5 минут
   */
  private startEmailMonitoring(): void {
    // Проверяем почту каждые 5 минут
    this.emailCheckJob = cron.schedule('*/5 * * * *', async () => {
      console.log('⏰ Запуск проверки почты по расписанию...');
      try {
        await emailRecordingService.checkForNewRecordings();
      } catch (error) {
        console.error('❌ Ошибка при проверке почты по расписанию:', error);
      }
    }, {
      scheduled: false, // Не запускаем автоматически
      timezone: 'Europe/Moscow'
    });

    // Запускаем задачу
    this.emailCheckJob.start();
    
    console.log('📧 Мониторинг почты настроен (каждые 5 минут)');
  }

  /**
   * Получает статус cron задач
   */
  getStatus(): { emailMonitoring: boolean } {
    return {
      emailMonitoring: this.emailCheckJob !== null
    };
  }

  /**
   * Ручной запуск проверки почты
   */
  async triggerEmailCheck(): Promise<{ success: boolean; message: string; processedCount: number }> {
    try {
      console.log('🔍 Ручной запуск проверки почты...');
      const result = await emailRecordingService.manualCheck();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Ошибка при ручной проверке почты: ${error}`,
        processedCount: 0
      };
    }
  }
}

export default new CronService();
