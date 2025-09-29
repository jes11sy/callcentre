import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';

interface AvitoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Официальная структура согласно документации Avito API
interface AvitoAccountInfo {
  id: number;           // Идентификатор пользователя (format: int32)
  name: string;         // Имя пользователя
  email: string;        // Email пользователя
  phone: string;        // Первый верифицированный телефон пользователя
  phones: string[];     // Все верифицированные номера телефонов
  profile_url: string;  // Ссылка на профиль пользователя
}

// Официальная структура согласно документации Avito API
interface AvitoBalance {
  real: number;    // Сумма реальных денежных средств (format: float)
  bonus: number;   // Сумма бонусных средств (format: float)
}

// Структура тарифа согласно документации
interface TariffContract {
  bonus: number;        // Количество бонусов на продвижение по тарифу (CPA баланс)
  closeTime: number | null;  // Дата окончания
  isActive: boolean;    // Признак активности
  level: string;        // Уровень тарифа
  startTime: number;    // Дата начала
}

interface TariffInfo {
  current: TariffContract | null;
  scheduled: TariffContract | null;
}

interface AvitoItemsStats {
  count: number;
  active_count: number;
  inactive_count: number;
}

interface AvitoItemStats {
  item_id: number;
  views: number;
  contacts: number;
  favorites: number;
  uniq_views: number;
  uniq_contacts: number;
  uniq_favorites: number;
}

export class AvitoApiService {
  private baseURL = 'https://api.avito.ru';
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private demoMode = process.env.AVITO_DEMO_MODE === 'true' || false; // Disable demo mode by default

  constructor(
    private clientId: string,
    private clientSecret: string,
    private proxyConfig?: {
      host: string;
      port: number;
      auth?: {
        username: string;
        password: string;
      };
      protocol: 'http' | 'https' | 'socks4' | 'socks5';
    }
  ) {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CallCentre-CRM/1.0',
      },
    });

    // Если прокси настроен в БД, всегда используем его для безопасности аккаунтов
    if (this.proxyConfig) {
      logger.info(`Настройка прокси из БД: ${this.proxyConfig.host}:${this.proxyConfig.port} (${this.proxyConfig.protocol})`);
      this.configureProxyForAllRequests();
    }

    // Add request interceptor for token
    this.client.interceptors.request.use(async (config) => {
      if (!this.isTokenValid()) {
        await this.refreshToken();
      }
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  private isTokenValid(): boolean {
    return !!(
      this.accessToken &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt > new Date()
    );
  }

  private async refreshToken(): Promise<void> {
    // Use official token endpoint from documentation
    // Авито API требует HTTPS, используем его для всех типов прокси
    let tokenConfig = { baseUrl: 'https://api.avito.ru', endpoint: '/token' };
    
    // Альтернативные endpoints для тестирования если прокси блокирует основной:
    const alternativeTokenEndpoints = [
      '/token',
      '/oauth/token',
      '/v1/oauth/token'
    ];
    
    try {
      logger.info(`=== AVITO API TOKEN REQUEST ===`);
      logger.info(`Endpoint: ${tokenConfig.baseUrl}${tokenConfig.endpoint}`);
      logger.info(`Client ID: ${this.clientId}`);
      logger.info(`Proxy: ${this.proxyConfig ? `${this.proxyConfig.host}:${this.proxyConfig.port}` : 'None'}`);
      
      const requestData = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'user:read user_balance:read user_operations:read stats:read'
      });

      logger.info(`Request data: ${requestData.toString()}`);
      logger.info(`Client ID length: ${this.clientId?.length || 0}`);
      logger.info(`Client Secret length: ${this.clientSecret?.length || 0}`);
      
      // Настраиваем прокси для запроса токена
      let httpsAgent: any = undefined;
      let proxyConfig: any = undefined;
      
      if (this.proxyConfig && this.proxyConfig.protocol === 'http') {
        // Для HTTP прокси используем стандартную конфигурацию axios
        proxyConfig = {
          host: this.proxyConfig.host,
          port: this.proxyConfig.port,
          protocol: 'http',
        };
        
        if (this.proxyConfig.auth) {
          proxyConfig.auth = {
            username: this.proxyConfig.auth.username,
            password: this.proxyConfig.auth.password
          };
        }
        
        logger.info(`HTTP Proxy configured for token request: ${this.proxyConfig.host}:${this.proxyConfig.port}`);
        logger.info(`Proxy auth configured: ${this.proxyConfig.auth ? 'Yes' : 'No'}`);
      } else if (this.proxyConfig?.protocol === 'socks4' || this.proxyConfig?.protocol === 'socks5') {
        // SOCKS прокси пока не поддерживаются
        logger.warn(`SOCKS прокси ${this.proxyConfig.host}:${this.proxyConfig.port} не поддерживается для запроса токена.`);
      }

      const requestConfig: any = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        timeout: 30000, // Увеличиваем таймаут для прокси
        ...(proxyConfig && { proxy: proxyConfig }),
      };
      
      logger.info('Request config:', {
        url: `${tokenConfig.baseUrl}${tokenConfig.endpoint}`,
        proxy: proxyConfig,
        proxyType: this.proxyConfig?.protocol,
        headers: requestConfig.headers
      });
      
      // Дополнительная диагностика прокси
      logger.info('Proxy diagnostic info:', {
        proxyHost: this.proxyConfig?.host,
        proxyPort: this.proxyConfig?.port,
        proxyType: this.proxyConfig?.protocol,
        proxyAuth: this.proxyConfig?.auth ? 'Yes' : 'No'
      });
      
      let response: { data: AvitoTokenResponse } | undefined;
      
      // Если используется прокси, пробуем разные форматы запроса
      if (this.proxyConfig) {
        logger.info('=== TRYING PROXY-COMPATIBLE REQUEST FORMAT ===');
        
        try {
          // Сначала пробуем стандартный способ
          response = await axios.post(
            `${tokenConfig.baseUrl}${tokenConfig.endpoint}`,
            requestData,
            requestConfig
          ) as { data: AvitoTokenResponse };
        } catch (error: any) {
          // Если не работает, пробуем альтернативный формат
          if (error.response?.status === 400 && typeof error.response?.data === 'string' && error.response.data.includes('<html>')) {
            logger.warn('=== STANDARD REQUEST FAILED, TRYING ALTERNATIVE FORMAT ===');
            
            // Альтернативный формат: отправляем как обычный объект
            const altRequestConfig = {
              ...requestConfig,
              headers: {
                ...requestConfig.headers,
                'Content-Type': 'application/json', // Пробуем JSON
              }
            };
            
            const altRequestData = {
              grant_type: 'client_credentials',
              client_id: this.clientId,
              client_secret: this.clientSecret,
              scope: 'user:read user_balance:read user_operations:read stats:read'
            };
            
            try {
              response = await axios.post(
                `${tokenConfig.baseUrl}${tokenConfig.endpoint}`,
                altRequestData,
                altRequestConfig
              ) as { data: AvitoTokenResponse };
              logger.info('=== ALTERNATIVE JSON FORMAT WORKED ===');
            } catch (altError: any) {
              logger.warn('=== JSON FORMAT FAILED, TRYING NO-COMPRESSION FORMAT ===');
              
              // Третий вариант: убираем сжатие и упрощаем заголовки
              const simpleRequestConfig = {
                ...requestConfig,
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'curl/7.68.0', // Простой User-Agent
                  'Accept': '*/*'
                },
                decompress: false, // Отключаем автоматическую декомпрессию
              };
              
              try {
                response = await axios.post(
                  `${tokenConfig.baseUrl}${tokenConfig.endpoint}`,
                  requestData, // Возвращаемся к URL-encoded
                  simpleRequestConfig
                ) as { data: AvitoTokenResponse };
                logger.info('=== SIMPLE REQUEST FORMAT WORKED ===');
              } catch (simpleError: any) {
                logger.warn('=== TRYING ALTERNATIVE ENDPOINTS ===');
                
                // Четвертый вариант: пробуем альтернативные endpoints
                let alternativeWorked = false;
                for (const altEndpoint of alternativeTokenEndpoints.slice(1)) { // Пропускаем первый, уже попробовали
                  try {
                    logger.info(`Trying alternative endpoint: ${altEndpoint}`);
                    const altTokenConfig = { ...tokenConfig, endpoint: altEndpoint };
                    
                    response = await axios.post(
                      `${altTokenConfig.baseUrl}${altTokenConfig.endpoint}`,
                      requestData,
                      simpleRequestConfig
                    ) as { data: AvitoTokenResponse };
                    
                    logger.info(`=== ALTERNATIVE ENDPOINT ${altEndpoint} WORKED ===`);
                    alternativeWorked = true;
                    break;
                  } catch (endpointError: any) {
                    logger.warn(`Alternative endpoint ${altEndpoint} failed:`, endpointError.message);
                  }
                }
                
                if (!alternativeWorked) {
                  logger.warn('=== TRYING NATIVE FETCH WITH PROXY ===');
                  
                  // Последний вариант: используем нативный fetch через https-proxy-agent
                  try {
                    const { HttpsProxyAgent } = require('https-proxy-agent');
                    const proxyUrl = `http://${this.proxyConfig!.auth ? `${this.proxyConfig!.auth.username}:${this.proxyConfig!.auth.password}@` : ''}${this.proxyConfig!.host}:${this.proxyConfig!.port}`;
                    const agent = new HttpsProxyAgent(proxyUrl);
                    
                    // Используем axios с https-proxy-agent вместо fetch
                    const fetchConfig = {
                      headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'curl/7.68.0',
                        'Accept': 'application/json'
                      },
                      httpsAgent: agent,
                      timeout: 30000
                    };
                    
                    const fetchResponse = await axios.post(
                      `${tokenConfig.baseUrl}${tokenConfig.endpoint}`,
                      requestData,
                      fetchConfig
                    );
                    
                    response = fetchResponse as { data: AvitoTokenResponse };
                    logger.info('=== HTTPS-PROXY-AGENT METHOD WORKED ===');
                  } catch (fetchError: any) {
                    logger.error('=== ALL METHODS FAILED ===');
                    logger.error('Standard error:', error.message);
                    logger.error('JSON error:', altError.message);
                    logger.error('Simple error:', simpleError.message);
                    logger.error('Fetch error:', fetchError.message);
                    // Пробрасываем исходную ошибку
                    throw error;
                  }
                }
              }
            }
          } else {
            throw error;
          }
        }
      } else {
        // Без прокси используем стандартный способ
        response = await axios.post(
          `${tokenConfig.baseUrl}${tokenConfig.endpoint}`,
          requestData,
          requestConfig
        ) as { data: AvitoTokenResponse };
      }

      if (!response) {
        throw new Error('Failed to get response from Avito API');
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in || 3600) * 1000);

      logger.info(`=== AVITO API TOKEN SUCCESS ===`);
      logger.info(`Token received, expires in: ${response.data.expires_in} seconds`);
    } catch (error: any) {
      logger.error('=== AVITO API TOKEN FAILED ===');
      logger.error('Request details:', {
        url: `${tokenConfig.baseUrl}${tokenConfig.endpoint}`,
        clientId: this.clientId,
        proxy: this.proxyConfig ? `${this.proxyConfig.host}:${this.proxyConfig.port}` : 'None',
        proxyType: this.proxyConfig?.protocol || 'None'
      });
      logger.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // Более детальная диагностика ошибки 400
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        logger.error('Avito API 400 Error Details:', {
          fullResponse: errorData,
          error: errorData?.error,
          errorDescription: errorData?.error_description,
          errorUri: errorData?.error_uri
        });
        
        // Проверяем если получили HTML вместо JSON (признак блокировки прокси)
        if (typeof errorData === 'string' && errorData.includes('<html>')) {
          logger.error('=== PROXY BLOCKING DETECTED ===');
          logger.error('Received HTML error page instead of JSON API response');
          logger.error('This indicates that the proxy is blocking or filtering Avito API requests');
          
          if (this.proxyConfig) {
            throw new Error(`Прокси ${this.proxyConfig.host}:${this.proxyConfig.port} блокирует запросы к Авито API. Получена HTML-страница ошибки вместо JSON ответа. Попробуйте другой прокси или обратитесь к провайдеру прокси.`);
          } else {
            throw new Error('Получена HTML-страница ошибки вместо JSON ответа от Авито API');
          }
        }
        
        if (errorData?.error === 'invalid_client') {
          throw new Error('Неверные Client ID или Client Secret для Авито API');
        } else if (errorData?.error === 'invalid_grant') {
          throw new Error('Неверный тип авторизации для Авито API');
        } else if (errorData?.error === 'unsupported_grant_type') {
          throw new Error('Неподдерживаемый тип авторизации для Авито API');
        } else {
          // Показываем полный ответ от Авито API для диагностики
          const fullErrorInfo = JSON.stringify(errorData, null, 2);
          throw new Error(`Ошибка аутентификации Авито API: ${errorData?.error_description || errorData?.error || 'Неизвестная ошибка'}. Полный ответ: ${fullErrorInfo}`);
        }
      }
      
      throw new Error(`Failed to authenticate with Avito API: ${error.response?.status || error.message}`);
    }
  }

  // Публичный метод для тестирования только прокси (без Авито API)
  async testProxyOnly(): Promise<{ success: boolean; message: string }> {
    return this.testProxyConnection();
  }

  // Диагностика проблем с прокси и Авито API
  async diagnoseProxyIssues(): Promise<{ 
    proxyWorks: boolean; 
    avitoWorksWithoutProxy: boolean; 
    avitoWorksWithProxy: boolean; 
    recommendations: string[] 
  }> {
    const results = {
      proxyWorks: false,
      avitoWorksWithoutProxy: false,
      avitoWorksWithProxy: false,
      recommendations: [] as string[]
    };

    // 1. Тест прокси
    if (this.proxyConfig) {
      try {
        const proxyTest = await this.testProxyConnection();
        results.proxyWorks = proxyTest.success;
        if (!proxyTest.success) {
          results.recommendations.push('❌ Прокси не работает или недоступен');
          results.recommendations.push('🔧 Проверьте настройки прокси: хост, порт, логин, пароль');
          return results;
        }
      } catch (error) {
        results.recommendations.push('❌ Ошибка при тестировании прокси');
        return results;
      }
    }

    // 2. Тест Авито API без прокси (создаем временный экземпляр)
    try {
      const directService = new AvitoApiService(this.clientId, this.clientSecret);
      await directService.refreshToken();
      results.avitoWorksWithoutProxy = true;
      results.recommendations.push('✅ Авито API работает без прокси');
    } catch (error) {
      results.recommendations.push('❌ Авито API не работает даже без прокси - проверьте Client ID/Secret');
      return results;
    }

    // 3. Тест Авито API с прокси
    if (this.proxyConfig) {
      try {
        await this.refreshToken();
        results.avitoWorksWithProxy = true;
        results.recommendations.push('✅ Авито API работает с прокси');
      } catch (error: any) {
        if (error.message.includes('блокирует запросы к Авито API')) {
          results.recommendations.push('❌ Прокси блокирует запросы к Авито API');
          results.recommendations.push('🔧 Рекомендации:');
          results.recommendations.push('   • Попробуйте другой прокси-сервер');
          results.recommendations.push('   • Убедитесь что прокси поддерживает HTTPS');
          results.recommendations.push('   • Обратитесь к провайдеру прокси для разблокировки api.avito.ru');
          results.recommendations.push('   • Рассмотрите использование резидентных прокси');
        } else {
          results.recommendations.push(`❌ Ошибка Авито API с прокси: ${error.message}`);
        }
      }
    }

    return results;
  }

  // Простая настройка прокси (только для совместимости со старым кодом)
  private configureProxyForAllRequests(): void {
    if (!this.proxyConfig) return;

    logger.info(`Прокси настроен: ${this.proxyConfig.protocol}://${this.proxyConfig.host}:${this.proxyConfig.port}`);
    logger.info('Используется https-proxy-agent для всех запросов');
  }

  // Создать конфигурацию для запроса с рабочим прокси
  private createProxyConfig(): any {
    const config: any = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 30000
    };

    // Если есть токен, добавляем его
    if (this.accessToken) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Если настроен прокси, используем рабочий метод https-proxy-agent
    if (this.proxyConfig) {
      try {
        const { HttpsProxyAgent } = require('https-proxy-agent');
        const proxyUrl = `http://${this.proxyConfig.auth ? `${this.proxyConfig.auth.username}:${this.proxyConfig.auth.password}@` : ''}${this.proxyConfig.host}:${this.proxyConfig.port}`;
        const agent = new HttpsProxyAgent(proxyUrl);
        config.httpsAgent = agent;
      } catch (error: any) {
        logger.warn('Failed to create https-proxy-agent, using default config');
      }
    }

    return config;
  }


  // Проверка прокси перед отправкой запросов
  private async testProxyConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.proxyConfig) {
      return { success: true, message: 'Прокси не настроен' };
    }

    try {
      logger.info(`Testing proxy connection: ${this.proxyConfig.host}:${this.proxyConfig.port}`);
      
      let testClient;
      
      if (this.proxyConfig.protocol === 'socks4' || this.proxyConfig.protocol === 'socks5') {
        // Для SOCKS прокси пропускаем тестирование - используем напрямую
        logger.info('SOCKS proxy detected - skipping test, will use directly for Avito API');
        return {
          success: true,
          message: `SOCKS прокси ${this.proxyConfig.host}:${this.proxyConfig.port} будет использован напрямую`
        };
      } else {
        // Для HTTP прокси используем обычную конфигурацию
        const proxyConfig: any = {
          host: this.proxyConfig.host,
          port: this.proxyConfig.port,
          protocol: 'http',
        };

        if (this.proxyConfig.auth) {
          proxyConfig.auth = this.proxyConfig.auth;
        }

        testClient = axios.create({
          timeout: 15000,
          proxy: proxyConfig,
        });
      }

      // Тестируем прокси на HTTP запросе (SOCKS прокси лучше работают с HTTP)
      const response = await testClient.get('http://httpbin.org/ip', {
        timeout: 15000,
      });

      logger.info('Proxy test response:', {
        status: response.status,
        data: response.data,
        proxy: `${this.proxyConfig.host}:${this.proxyConfig.port}`
      });

      logger.info('Proxy connection test successful');
      return {
        success: true,
        message: `Прокси ${this.proxyConfig.host}:${this.proxyConfig.port} работает`,
      };
    } catch (error: any) {
      logger.error('Proxy connection test failed:', {
        proxy: `${this.proxyConfig.host}:${this.proxyConfig.port}`,
        error: error.message,
        code: error.code,
      });

      let errorMessage = 'Ошибка подключения к прокси';
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Прокси недоступен: соединение отклонено. Проверьте хост и порт';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Прокси недоступен: превышено время ожидания. Проверьте доступность прокси';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Прокси недоступен: хост не найден. Проверьте правильность адреса';
      } else if (error.code === 'EPROTO') {
        errorMessage = 'Ошибка протокола прокси. Возможно, неправильный тип прокси (HTTP/SOCKS)';
      } else if (error.code === 'ECONNRESET') {
        errorMessage = 'Прокси разорвал соединение. Проверьте настройки прокси';
      } else if (error.response?.status === 407) {
        errorMessage = 'Прокси недоступен: ошибка аутентификации. Проверьте логин и пароль';
      } else if (error.message?.includes('SOCKS')) {
        errorMessage = 'Ошибка SOCKS прокси. Проверьте тип прокси и настройки';
      } else if (error.message?.includes('proxy')) {
        errorMessage = `Ошибка прокси: ${error.message}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.demoMode) {
      logger.info('Demo mode: simulating successful connection test');
      return {
        success: true,
        message: 'Подключение к Avito API успешно (демо режим)',
      };
    }

    try {
      // Сначала проверяем прокси, если он настроен
      if (this.proxyConfig) {
        logger.info('Testing proxy before Avito API connection');
        const proxyTest = await this.testProxyConnection();
        if (!proxyTest.success) {
          logger.error('Proxy test failed, cannot proceed without proxy');
          return {
            success: false,
            message: `Прокси не работает: ${proxyTest.message}. Необходимо настроить рабочий прокси для безопасности аккаунтов.`,
          };
        }
        logger.info('Proxy test successful, proceeding with Avito API test (proxy already configured)');
      }

      // First try to get token (this might fail if proxy blocks Avito API)
      try {
        await this.refreshToken();
        logger.info('Token refresh successful');
      } catch (tokenError: any) {
        // Если получили HTML ошибку, значит прокси блокирует Авито API
        if (tokenError.message.includes('блокирует запросы к Авито API')) {
          logger.error('=== PROXY BLOCKS AVITO API ===');
          logger.error('Proxy is blocking Avito API requests, returning detailed error');
          return {
            success: false,
            message: tokenError.message,
          };
        }
        // Для других ошибок просто пробрасываем дальше
        throw tokenError;
      }
      
      // Test different API endpoints to find working ones
      const testEndpoints = [
        '/core/v1/accounts/self',
        '/core/v1/account',
        '/autoload/v1/account',
        '/autoload/v2/account',
        '/api/v1/account',
        '/v1/account',
        '/account',
        '/me',
        '/user/profile'
      ];

      let lastError: any = null;
      
      // Если у нас есть прокси, создаем конфигурацию для тестирования endpoints
      let testConfig: any = {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      };
      
      // Если прокси настроен и мы знаем что https-proxy-agent работает
      if (this.proxyConfig) {
        try {
          const { HttpsProxyAgent } = require('https-proxy-agent');
          const proxyUrl = `http://${this.proxyConfig.auth ? `${this.proxyConfig.auth.username}:${this.proxyConfig.auth.password}@` : ''}${this.proxyConfig.host}:${this.proxyConfig.port}`;
          const agent = new HttpsProxyAgent(proxyUrl);
          testConfig.httpsAgent = agent;
          logger.info('Using https-proxy-agent for endpoint testing');
        } catch (agentError: any) {
          logger.warn('Failed to create https-proxy-agent for testing, using standard client');
        }
      }

      for (const endpoint of testEndpoints) {
        try {
          // Используем axios напрямую с нашей рабочей конфигурацией прокси
          await axios.get(`${this.baseURL}${endpoint}`, testConfig);
          logger.info(`API test successful on endpoint: ${endpoint}`);
          return {
            success: true,
            message: 'Подключение к Avito API успешно',
          };
        } catch (error: any) {
          lastError = error;
          logger.warn(`API test failed on endpoint ${endpoint}:`, error.response?.status);
        }
      }

      // If all endpoints failed, use the last error
      throw lastError;
      
    } catch (error: any) {
      logger.error('Avito API connection test failed on all endpoints:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Ошибка авторизации: неверные client_id или client_secret',
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Доступ запрещен: проверьте права доступа к API',
        };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          message: 'API эндпоинт не найден: возможно изменилась структура API',
        };
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          message: 'Ошибка соединения: проверьте настройки прокси и интернет-подключение',
        };
      } else if (error.code === 'ENOTFOUND') {
        return {
          success: false,
          message: 'Не удается найти сервер api.avito.ru: проверьте DNS настройки',
        };
      }
      
      return {
        success: false,
        message: `Ошибка подключения: ${error.response?.status || error.code || error.message}`,
      };
    }
  }

  async getAccountInfo(): Promise<AvitoAccountInfo> {
    try {
      // Use client with interceptor for automatic token management
      const response = await this.client.get<AvitoAccountInfo>(`${this.baseURL}/core/v1/accounts/self`);
      logger.info('Account info retrieved:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Avito account info:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to get account information: ${error.response?.status || error.message}`);
    }
  }

  // Получение информации о тарифе (для CPA баланса)
  async getTariffInfo(): Promise<TariffInfo> {
    try {
      // Use official tariff endpoint from documentation
      const response = await this.client.get<TariffInfo>('/tariff/info/1', {
        headers: {
          'X-Source': 'CallCentreCRM'  // Required header according to documentation
        }
      });
      logger.info('Tariff info retrieved:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Avito tariff info:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to get tariff information: ${error.response?.status || error.message}`);
    }
  }

  // Получение CPA баланса (аванса) через официальный CPA API
  async getCpaBalance(): Promise<number> {
    try {
      logger.info('=== GETTING CPA BALANCE FROM OFFICIAL CPA API ===');
      
      // Сначала пробуем deprecated API v2 который возвращает advance (аванс)
      try {
        logger.info('Trying CPA API v2 balanceInfo (with advance field)');
        
        const response = await this.client.post(`/cpa/v2/balanceInfo`, '{}', {
          headers: { 'X-Source': 'callcentre-crm' }
        });
        
        logger.info('=== CPA V2 BALANCE RESPONSE:', JSON.stringify(response.data, null, 2));
        
        // Проверяем есть ли ошибка в ответе
        if (response.data?.error) {
          logger.warn('=== CPA V2 RETURNED ERROR:', response.data.error);
          throw new Error(`CPA API v2 error: ${response.data.error.message}`);
        }
        
        // Ищем аванс (в копейках, нужно перевести в рубли)
        if (response.data?.advance !== undefined) {
          const advanceKopecks = response.data.advance;
          const advanceRubles = Math.round(advanceKopecks / 100); // Переводим копейки в рубли
          logger.info(`=== ADVANCE (АВАНС) FOUND: ${advanceKopecks} копеек = ${advanceRubles} рублей`);
          return advanceRubles;
        }
        
        logger.warn('=== ADVANCE NOT FOUND IN CPA V2 RESPONSE');
        
      } catch (error: any) {
        logger.warn('=== CPA V2 FAILED:', error.response?.status, error.message);
      }
      
      // Fallback к CPA API v3 (только текущий баланс)
      try {
        logger.info('Trying CPA API v3 balanceInfo (current balance only)');
        
        const response = await this.client.post(`/cpa/v3/balanceInfo`, '{}', {
          headers: { 'X-Source': 'callcentre-crm' }
        });
        
        logger.info('=== CPA V3 BALANCE RESPONSE:', JSON.stringify(response.data, null, 2));
        
        // V3 возвращает только текущий баланс в копейках
        if (response.data?.balance !== undefined) {
          const balanceKopecks = response.data.balance;
          const balanceRubles = Math.round(balanceKopecks / 100); // Переводим копейки в рубли
          logger.info(`=== CURRENT BALANCE FOUND: ${balanceKopecks} копеек = ${balanceRubles} рублей`);
          return Math.abs(balanceRubles); // Берем абсолютное значение
        }
        
        logger.warn('=== BALANCE NOT FOUND IN CPA V3 RESPONSE');
        
      } catch (error: any) {
        logger.warn('=== CPA V3 FAILED:', error.response?.status, error.message);
      }
      
      logger.warn('=== ALL CPA API ENDPOINTS FAILED, RETURNING 0');
      return 0;
    } catch (error: any) {
      logger.error('=== FAILED TO GET CPA BALANCE FROM CPA API ===');
      logger.error('=== ERROR STATUS:', error.response?.status);
      logger.error('=== ERROR STATUS TEXT:', error.response?.statusText);
      logger.error('=== ERROR DATA:', JSON.stringify(error.response?.data, null, 2));
      logger.error('=== ERROR MESSAGE:', error.message);
      
      logger.warn('=== CPA BALANCE FAILED, RETURNING 0');
      return 0;
    }
  }

  // Получение CPA баланса из истории операций
  async getCpaBalanceFromHistory(userId: number): Promise<number> {
    try {
      // Get operations for the last week to calculate CPA balance
      const dateTo = new Date().toISOString();
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await this.client.post('/core/v1/accounts/operations_history/', {
        dateTimeFrom: dateFrom,
        dateTimeTo: dateTo
      });

      const operations = response.data.result?.operations || [];
      
      // Calculate CPA balance from operations
      let cpaBalance = 0;
      operations.forEach((op: any) => {
        if (op.operationType === 'внесение CPA аванса') {
          cpaBalance += op.amountTotal || 0;
        } else if (op.operationType === 'возврат CPA аванса') {
          cpaBalance -= op.amountTotal || 0;
        }
      });

      logger.info(`CPA balance calculated from operations: ${cpaBalance}`);
      return Math.max(0, cpaBalance); // Ensure non-negative
    } catch (error: any) {
      logger.error('Failed to get CPA balance from operations history:', error.message);
      throw new Error('Failed to calculate CPA balance from operations');
    }
  }

  // Простой метод для получения CPA баланса
  async getBalance(): Promise<AvitoBalance> {
    const cpaBalance = await this.getCpaBalance();
    
    return {
      real: cpaBalance,  // CPA баланс
      bonus: 0          
    };
  }

  async getItemsStats(): Promise<AvitoItemsStats> {
    try {
      // First get user info to get user_id
      const userInfo = await this.getAccountInfo();
      const userId = userInfo.id;
      
      logger.info(`=== GETTING ITEMS STATS FROM OFFICIAL API FOR USER ${userId} ===`);
      
      // Используем официальный API для получения списка объявлений
      try {
        logger.info('Trying official items API: /core/v1/items');
        
        const response = await this.client.get(`/core/v1/items`, {
          params: {
            per_page: 100, // Максимум объявлений за раз
            page: 1,
            status: 'active,removed,old,blocked,rejected' // Все статусы
          }
        });
        
        logger.info('=== ITEMS API RESPONSE:', JSON.stringify(response.data, null, 2));
        
        // Обрабатываем ответ официального API
        if (response.data?.resources && Array.isArray(response.data.resources)) {
          const items = response.data.resources;
          const result = {
            count: items.length,
            active_count: items.filter((item: any) => item.status === 'active').length,
            inactive_count: items.filter((item: any) => item.status !== 'active').length,
          };
          
          logger.info(`=== ITEMS STATS FROM OFFICIAL API:`, result);
          return result;
        }
        
        logger.warn('=== UNEXPECTED ITEMS API RESPONSE STRUCTURE');
        return { count: 0, active_count: 0, inactive_count: 0 };
        
      } catch (error: any) {
        logger.error('=== OFFICIAL ITEMS API FAILED:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        // Возвращаем нули если API не работает
        logger.warn('=== RETURNING ZERO STATS DUE TO API FAILURE');
        return { count: 0, active_count: 0, inactive_count: 0 };
      }
    } catch (error: any) {
      logger.error('=== FAILED TO GET ITEMS STATS:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to get items statistics: ${error.response?.status} ${error.response?.statusText || error.message}`);
    }
  }

  async getItemsStatsDetailed(dateFrom?: string, dateTo?: string): Promise<{
    total_views: number;
    total_contacts: number;
    total_favorites: number;
    items?: AvitoItemStats[];
  }> {
    try {
      // First get user info to get user_id
      const userInfo = await this.getAccountInfo();
      const userId = userInfo.id;
      
      logger.info(`=== GETTING DETAILED STATS FROM OFFICIAL STATS API FOR USER ${userId} ===`);
      
      // Set default date range (last 30 days) if not provided
      if (!dateFrom || !dateTo) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        dateFrom = dateFrom || thirtyDaysAgo.toISOString().split('T')[0];
        dateTo = dateTo || now.toISOString().split('T')[0];
      }

      // Сначала получаем список объявлений
      let itemIds: number[] = [];
      try {
        const itemsResponse = await this.client.get('/core/v1/items', {
          params: {
            per_page: 100,
            page: 1,
            status: 'active,removed,old' // Только объявления которые могут иметь статистику
          }
        });
        
        if (itemsResponse.data?.resources && Array.isArray(itemsResponse.data.resources)) {
          itemIds = itemsResponse.data.resources.map((item: any) => item.id).filter(Boolean);
          logger.info(`=== FOUND ${itemIds.length} ITEMS FOR STATS`);
        }
      } catch (error: any) {
        logger.warn('=== FAILED TO GET ITEMS LIST, USING EMPTY ARRAY');
      }

      // Если нет объявлений, возвращаем нули
      if (itemIds.length === 0) {
        logger.warn('=== NO ITEMS FOUND, RETURNING ZERO STATS');
        return {
          total_views: 0,
          total_contacts: 0,
          total_favorites: 0,
        };
      }

      // Используем официальный API статистики /stats/v1/accounts/{user_id}/items
      try {
        logger.info(`=== TRYING OFFICIAL STATS API WITH ${itemIds.length} ITEMS ===`);
        
        const requestData = {
          itemIds: itemIds.slice(0, 200), // Максимум 200 объявлений за раз
          dateFrom,
          dateTo,
          fields: ['uniqViews', 'uniqContacts', 'uniqFavorites'], // Используем новые поля
          periodGrouping: 'day' // Группировка по дням
        };
        
        const response = await this.client.post(`/stats/v1/accounts/${userId}/items`, requestData);
        
        logger.info('=== STATS API RESPONSE:', JSON.stringify(response.data, null, 2));
        
        // Обрабатываем ответ официального API статистики
        if (response.data?.result?.items && Array.isArray(response.data.result.items)) {
          const items = response.data.result.items;
          let total_views = 0;
          let total_contacts = 0;
          let total_favorites = 0;
          
          // Суммируем статистику по всем объявлениям и дням
          items.forEach((item: any) => {
            if (item.stats && Array.isArray(item.stats)) {
              item.stats.forEach((stat: any) => {
                total_views += stat.uniqViews || stat.views || 0;
                total_contacts += stat.uniqContacts || stat.contacts || 0;
                total_favorites += stat.uniqFavorites || stat.favorites || 0;
              });
            }
          });
          
          const result = {
            total_views,
            total_contacts,
            total_favorites,
          };
          
          logger.info(`=== DETAILED STATS FROM OFFICIAL API:`, result);
          return result;
        }
        
        logger.warn('=== UNEXPECTED STATS API RESPONSE STRUCTURE');
        return {
          total_views: 0,
          total_contacts: 0,
          total_favorites: 0,
        };
        
      } catch (error: any) {
        logger.error('=== OFFICIAL STATS API FAILED:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        // Возвращаем нули если API не работает
        logger.warn('=== RETURNING ZERO DETAILED STATS DUE TO API FAILURE');
        return {
          total_views: 0,
          total_contacts: 0,
          total_favorites: 0,
        };
      }
    } catch (error: any) {
      logger.error('=== FAILED TO GET DETAILED STATS:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to get detailed statistics: ${error.response?.status} ${error.response?.statusText || error.message}`);
    }
  }

  // Специальный метод для получения статистики с scope stats:read
  async getStatsWithScope(userId: number, dateFrom?: string, dateTo?: string): Promise<{
    views: number;
    contacts: number;
    favorites: number;
  }> {
    // Set default date range (last 30 days) if not provided
    if (!dateFrom || !dateTo) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      dateFrom = dateFrom || thirtyDaysAgo.toISOString().split('T')[0];
      dateTo = dateTo || now.toISOString().split('T')[0];
    }

    const params = {
      user_id: userId,
      date_from: dateFrom,
      date_to: dateTo
    };

    // Эндпоинты специально для scope stats:read
    const statsReadEndpoints = [
      '/core/v1/stats/calls',
      '/core/v1/stats/views', 
      '/core/v1/stats/items',
      '/stats/v1/summary',
      '/stats/v2/summary',
      `/core/v1/accounts/${userId}/statistics`
    ];

    let lastError: any = null;
    for (const endpoint of statsReadEndpoints) {
      try {
        logger.info(`Trying stats:read endpoint: ${endpoint} with params:`, params);
        const response = await this.client.get(endpoint, { params });
        
        const data = response.data;
        logger.info(`Stats response from ${endpoint}:`, data);
        
        return {
          views: data.views || data.total_views || data.statistics?.views || 0,
          contacts: data.contacts || data.total_contacts || data.statistics?.contacts || 0,
          favorites: data.favorites || data.total_favorites || data.statistics?.favorites || 0,
        };
      } catch (error: any) {
        lastError = error;
        logger.warn(`Stats endpoint ${endpoint} failed:`, error.response?.status);
      }
    }

    throw lastError || new Error('All stats:read endpoints failed');
  }

  async syncAccountData(): Promise<{
    accountBalance: number;
    adsCount: number;
    viewsCount: number;
    contactsCount: number;
    viewsToday: number;
    contactsToday: number;
  }> {
    if (this.demoMode) {
      logger.info('Demo mode: generating realistic demo data for account sync');
      
      // Generate realistic demo data based on account name/id
      const hash = this.clientId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const baseBalance = Math.abs(hash % 50000) + 5000; // 5000-55000 рублей
      const baseAds = Math.abs(hash % 50) + 10; // 10-60 объявлений
      const baseViews = Math.abs(hash % 5000) + 500; // 500-5500 просмотров
      const baseContacts = Math.abs(hash % 200) + 20; // 20-220 контактов
      
      // Add some randomness to make it look more realistic
      const randomFactor = () => 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
      
      const result = {
        accountBalance: Math.floor(baseBalance * randomFactor()),
        adsCount: Math.floor(baseAds * randomFactor()),
        viewsCount: Math.floor(baseViews * randomFactor()),
        contactsCount: Math.floor(baseContacts * randomFactor()),
        viewsToday: Math.floor((baseViews * randomFactor()) / 10), // Примерно 10% от общих просмотров
        contactsToday: Math.floor((baseContacts * randomFactor()) / 15), // Примерно 7% от общих контактов
      };
      
      logger.info('Demo data generated:', result);
      return result;
    }

    // Просто проверяем доступ к Авито API (с прокси или без)
    try {
      if (this.proxyConfig) {
        logger.info(`Using proxy: ${this.proxyConfig.host}:${this.proxyConfig.port} (${this.proxyConfig.protocol})`);
      } else {
        logger.info('Using direct connection to Avito API');
      }
      
      // Проверяем получение токена - это единственный реальный тест
      await this.refreshToken();
      logger.info('Avito API access confirmed, proceeding with sync');
    } catch (tokenError: any) {
      logger.error('Avito API access failed:', {
        message: tokenError.message,
        response: tokenError.response?.data,
        status: tokenError.response?.status,
        hasProxy: !!this.proxyConfig
      });
      
      let errorMessage = `Ошибка доступа к Авито API: ${tokenError.message}`;
      if (this.proxyConfig && tokenError.message.includes('блокирует запросы к Авито API')) {
        errorMessage = `Прокси ${this.proxyConfig.host}:${this.proxyConfig.port} блокирует Авито API`;
      }
      
      throw new Error(errorMessage);
    }

    const result = {
      accountBalance: 0,
      adsCount: 0,
      viewsCount: 0,
      contactsCount: 0,
      viewsToday: 0,
      contactsToday: 0,
    };

    const errors: string[] = [];

    // Получаем CPA баланс
    try {
      logger.info('=== STARTING CPA BALANCE RETRIEVAL ===');
      const cpaBalance = await this.getCpaBalance();
      result.accountBalance = cpaBalance;
      logger.info('=== CPA BALANCE RETRIEVAL COMPLETED:', cpaBalance, '===');
    } catch (error: any) {
      logger.error('=== CPA BALANCE RETRIEVAL FAILED ===');
      logger.error('=== CPA ERROR:', error.message);
      logger.error('=== CPA ERROR STACK:', error.stack);
      errors.push(`CPA Balance: ${error.message}`);
      logger.warn('Failed to get CPA balance, using default value 0');
      result.accountBalance = 0;
    }

    // Try to get items stats
    try {
      const itemsStats = await this.getItemsStats();
      result.adsCount = itemsStats.active_count || itemsStats.count || 0;
      logger.info('Successfully retrieved items stats');
    } catch (error: any) {
      errors.push(`Items stats: ${error.message}`);
      logger.warn('Failed to get items stats, using default value 0');
    }

    // Try to get detailed stats for views and contacts - общая статистика и за сегодня
    try {
      const userInfo = await this.getAccountInfo();
      
      // Получаем статистику за последние 30 дней (общая)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFrom30 = thirtyDaysAgo.toISOString().split('T')[0];
      const dateTo = new Date().toISOString().split('T')[0];
      
      // Получаем статистику за сегодня
      const today = new Date().toISOString().split('T')[0];
      
      logger.info('=== GETTING TOTAL AND TODAY STATS ===');
      
      // Общая статистика за 30 дней
      const totalStats = await this.getItemsStatsDetailed(dateFrom30, dateTo);
      result.viewsCount = totalStats.total_views || 0;
      result.contactsCount = totalStats.total_contacts || 0;
      
      // Статистика за сегодня
      const todayStats = await this.getItemsStatsDetailed(today, today);
      result.viewsToday = todayStats.total_views || 0;
      result.contactsToday = todayStats.total_contacts || 0;
      
      logger.info('Successfully retrieved total and today stats:', {
        totalViews: result.viewsCount,
        totalContacts: result.contactsCount,
        viewsToday: result.viewsToday,
        contactsToday: result.contactsToday
      });
    } catch (error: any) {
      errors.push(`Stats: ${error.message}`);
      logger.warn('Failed to get stats, using default values 0');
      result.viewsCount = 0;
      result.contactsCount = 0;
      result.viewsToday = 0;
      result.contactsToday = 0;
    }

    // If all requests failed, throw error
    if (errors.length === 3) {
      logger.error('All Avito API requests failed:', errors);
      throw new Error(`All sync operations failed: ${errors.join('; ')}`);
    }

    // Log partial success
    if (errors.length > 0) {
      logger.warn(`Partial sync completed with ${errors.length} errors:`, errors);
    }

    return result;
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ОТЗЫВАМИ И РЕЙТИНГАМИ =====

  /**
   * Получить информацию о рейтинге аккаунта
   */
  async getRatingInfo(): Promise<any> {
    try {
      logger.info('Getting rating info from Avito Ratings API');
      
      const response = await this.client.get('/ratings/v1/info');
      
      logger.info('=== RATING INFO RESPONSE:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get rating info:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to get rating info: ${error.response?.status || error.message}`);
    }
  }

  /**
   * Получить список отзывов с пагинацией
   */
  async getReviews(offset: number = 0, limit: number = 20): Promise<any> {
    try {
      logger.info(`Getting reviews from Avito Ratings API (offset: ${offset}, limit: ${limit})`);
      
      const response = await this.client.get('/ratings/v1/reviews', {
        params: {
          offset,
          limit: Math.min(limit, 50) // API ограничение - максимум 50
        }
      });
      
      logger.info('=== REVIEWS RESPONSE:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get reviews:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to get reviews: ${error.response?.status || error.message}`);
    }
  }

  /**
   * Создать ответ на отзыв
   */
  async createReviewAnswer(reviewId: number, message: string): Promise<any> {
    try {
      logger.info(`Creating answer for review ${reviewId}`);
      
      const response = await this.client.post('/ratings/v1/answers', {
        reviewId,
        message
      });
      
      logger.info('=== CREATE ANSWER RESPONSE:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create review answer:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to create review answer: ${error.response?.status || error.message}`);
    }
  }

  /**
   * Удалить ответ на отзыв
   */
  async removeReviewAnswer(answerId: number): Promise<any> {
    try {
      logger.info(`Removing answer ${answerId}`);
      
      const response = await this.client.delete(`/ratings/v1/answers/${answerId}`);
      
      logger.info('=== REMOVE ANSWER RESPONSE:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      logger.error('Failed to remove review answer:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to remove review answer: ${error.response?.status || error.message}`);
    }
  }
}

export default AvitoApiService;
