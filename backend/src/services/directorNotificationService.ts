import axios from 'axios';
import { logger } from '../config/logger';

interface NotificationData {
  orderId: number;
  newDate: string;
  city: string;
  token: string;
}

export class DirectorNotificationService {
  private static readonly BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || 'http://localhost:3001';
  private static readonly WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'your_webhook_secret_token';

  /**
   * Отправка уведомления директору о новой заявке
   */
  static async sendNewOrderNotification(orderId: number, city: string, dateMeeting: Date): Promise<void> {
    try {
      const notificationData = {
        orderId,
        city,
        dateMeeting: dateMeeting.toISOString(),
        token: this.WEBHOOK_TOKEN
      };

      logger.info('Отправка уведомления директору о новой заявке', {
        orderId,
        city
      });

      const response = await axios.post(
        `${this.BOT_WEBHOOK_URL}/webhook/new-order`,
        notificationData,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        logger.info('Уведомление о новой заявке успешно отправлено', {
          orderId,
          city,
          response: response.data
        });
      } else {
        logger.error('Ошибка при отправке уведомления о новой заявке', {
          orderId,
          city,
          response: response.data
        });
      }
    } catch (error) {
      logger.error('Ошибка при отправке уведомления о новой заявке', {
        orderId,
        city,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Не прерываем выполнение основной логики при ошибке уведомления
      console.error('Не удалось отправить уведомление о новой заявке:', error);
    }
  }

  /**
   * Отправка уведомления директору о переносе даты встречи
   */
  static async sendDateChangeNotification(orderId: number, newDate: Date, city: string): Promise<void> {
    try {
      const notificationData: NotificationData = {
        orderId,
        newDate: newDate.toISOString(),
        city,
        token: this.WEBHOOK_TOKEN
      };

      logger.info('Отправка уведомления директору о переносе даты', {
        orderId,
        newDate: newDate.toISOString(),
        city
      });

      const response = await axios.post(
        `${this.BOT_WEBHOOK_URL}/webhook/order-update`,
        notificationData,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        logger.info('Уведомление директору успешно отправлено', {
          orderId,
          city,
          response: response.data
        });
      } else {
        logger.error('Ошибка при отправке уведомления директору', {
          orderId,
          city,
          response: response.data
        });
      }
    } catch (error) {
      logger.error('Ошибка при отправке уведомления директору', {
        orderId,
        city,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Не прерываем выполнение основной логики при ошибке уведомления
      console.error('Не удалось отправить уведомление директору:', error);
    }
  }

  /**
   * Проверка доступности webhook бота
   */
  static async checkBotWebhookHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.BOT_WEBHOOK_URL}/health`, {
        timeout: 3000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Webhook бота недоступен', {
        url: this.BOT_WEBHOOK_URL,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}
