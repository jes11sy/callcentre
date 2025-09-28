import axios from 'axios';
import { logger } from '../config/logger';
import { AvitoMessengerService } from './avitoMessengerService';

export class AvitoApiHealthCheck {
  static async checkApiAvailability(): Promise<{
    available: boolean;
    message: string;
    endpoints: { [key: string]: boolean };
  }> {
    const baseURL = 'https://api.avito.ru';
    const testEndpoints = [
      '/token',
      '/oauth/token', 
      '/core/v1',
      '/autoload/v1',
      '/autoload/v2'
    ];

    const results: { [key: string]: boolean } = {};
    let availableCount = 0;

    for (const endpoint of testEndpoints) {
      try {
        // Just test if endpoint responds (even with 401/403 is OK)
        const response = await axios.get(`${baseURL}${endpoint}`, {
          timeout: 5000,
          validateStatus: (status) => status < 500, // Accept any status < 500
        });
        
        results[endpoint] = true;
        availableCount++;
        logger.info(`Avito API endpoint ${endpoint} is available (status: ${response.status})`);
      } catch (error: any) {
        results[endpoint] = false;
        logger.warn(`Avito API endpoint ${endpoint} is not available:`, error.message);
      }
    }

    const available = availableCount > 0;
    const message = available 
      ? `Avito API частично доступен (${availableCount}/${testEndpoints.length} эндпоинтов)`
      : 'Avito API недоступен';

    return {
      available,
      message,
      endpoints: results
    };
  }

  static async testWithCredentials(clientId: string, clientSecret: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const response = await axios.post(
        'https://api.avito.ru/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      return {
        success: true,
        message: 'Авторизация в Avito API успешна',
        details: {
          token_type: response.data.token_type,
          expires_in: response.data.expires_in
        }
      };
    } catch (error: any) {
      logger.error('Avito API credentials test failed:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Неверные client_id или client_secret'
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Доступ запрещен, проверьте права доступа'
        };
      } else if (error.code === 'ENOTFOUND') {
        return {
          success: false,
          message: 'Не удается подключиться к api.avito.ru'
        };
      }

      return {
        success: false,
        message: `Ошибка подключения: ${error.message}`
      };
    }
  }

  /**
   * Test messenger API connection with credentials
   */
  static async testMessengerApi(clientId: string, clientSecret: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const messengerService = new AvitoMessengerService({
        clientId,
        clientSecret,
        baseUrl: 'https://api.avito.ru',
        userId: parseInt(clientId) // Assuming user ID is derived from client ID
      });

      const result = await messengerService.testConnection();
      
      if (result.success) {
        // Try to get a small number of chats to verify full functionality
        try {
          const chatsData = await messengerService.getChats({ limit: 1 });
          return {
            success: true,
            message: 'Messenger API работает корректно',
            details: {
              chatsAvailable: chatsData.chats.length > 0,
              totalChatsFound: chatsData.chats.length,
              connectionTime: new Date().toISOString()
            }
          };
        } catch (error: any) {
          // Connection works but no chats available
          if (error.response?.status === 200 || error.response?.status === 404) {
            return {
              success: true,
              message: 'Подключение к Messenger API установлено, чаты не найдены',
              details: {
                chatsAvailable: false,
                connectionTime: new Date().toISOString()
              }
            };
          }
          throw error;
        }
      }

      return result;

    } catch (error: any) {
      logger.error('Messenger API test failed:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Неверные client_id или client_secret для Messenger API'
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Доступ к Messenger API запрещен, проверьте права messenger:read'
        };
      }

      return {
        success: false,
        message: `Ошибка Messenger API: ${error.message}`
      };
    }
  }
}

export default AvitoApiHealthCheck;
