import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../config/logger';

// Types based on Avito API documentation
export interface AvitoChat {
  id: string;
  created: number;
  updated: number;
  context?: {
    type: string;
    value: {
      id: number;
      title: string;
      price_string?: string;
      url: string;
      user_id: number;
      status_id: number;
      location?: {
        lat?: number;
        lon?: number;
        title?: string; // This contains the city name
        city_name?: string;
        region_name?: string;
        district_name?: string;
      };
      images?: {
        count: number;
        main?: {
          '140x105': string;
        };
      };
    };
  };
  last_message?: {
    id: string;
    author_id: number;
    content: MessageContent;
    created: number;
    direction: 'in' | 'out';
    type: string;
  };
  users: Array<{
    id: number;
    name: string;
    public_user_profile?: {
      avatar?: {
        default: string;
        images: {
          '24x24': string;
          '36x36': string;
          '48x48': string;
          '64x64': string;
          '72x72': string;
          '96x96': string;
          '128x128': string;
          '192x192': string;
          '256x256': string;
        };
      };
      url: string;
      user_id: number;
      item_id?: number;
    };
  }>;
}

export interface AvitoMessage {
  id: string;
  author_id: number;
  content: MessageContent;
  created: number;
  direction: 'in' | 'out';
  type: string;
  is_read: boolean;
  read?: number;
  quote?: {
    id: string;
    author_id: number;
    content: MessageContent;
    created: number;
    type: string;
  };
}

export interface MessageContent {
  text?: string;
  image?: {
    sizes: Record<string, string>;
  };
  voice?: {
    voice_id: string;
  };
  link?: {
    text: string;
    url: string;
    preview?: {
      title: string;
      description: string;
      domain: string;
      url: string;
      images?: Record<string, string>;
    };
  };
  item?: {
    title: string;
    price_string?: string;
    item_url: string;
    image_url: string;
  };
  location?: {
    lat: number;
    lon: number;
    text: string;
    title: string;
    kind: string;
  };
  call?: {
    status: 'missed';
    target_user_id: number;
  };
  flow_id?: string;
}

export interface AvitoChatsResponse {
  chats: AvitoChat[];
}

export interface SendMessageRequest {
  type: 'text';
  message: {
    text: string;
  };
}

export interface SendImageMessageRequest {
  image_id: string;
}

export interface AvitoApiConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  baseUrl: string;
  userId: number;
  proxyConfig?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
    protocol: 'http' | 'https' | 'socks4' | 'socks5';
  };
}

export class AvitoMessengerService {
  private api: AxiosInstance;
  private config: AvitoApiConfig;
  private tokenExpiresAt?: Date;

  constructor(config: AvitoApiConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.avito.ru'
    };

    // Настройка прокси, если он предоставлен
    const axiosConfig: any = {
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Добавляем прокси через https-proxy-agent, если он настроен
    if (config.proxyConfig && config.proxyConfig.protocol === 'http') {
      try {
        const { HttpsProxyAgent } = require('https-proxy-agent');
        const proxyUrl = `http://${config.proxyConfig.auth ? `${config.proxyConfig.auth.username}:${config.proxyConfig.auth.password}@` : ''}${config.proxyConfig.host}:${config.proxyConfig.port}`;
        const agent = new HttpsProxyAgent(proxyUrl);
        
        axiosConfig.httpsAgent = agent;
        logger.info(`AvitoMessengerService: HTTPS-Proxy-Agent настроен: ${config.proxyConfig.host}:${config.proxyConfig.port}`);
      } catch (error: any) {
        logger.error('AvitoMessengerService: Failed to setup https-proxy-agent, using no proxy');
      }
    } else if (config.proxyConfig && (config.proxyConfig.protocol === 'socks4' || config.proxyConfig.protocol === 'socks5')) {
      logger.warn(`AvitoMessengerService: SOCKS прокси ${config.proxyConfig.protocol} не поддерживается`);
    }

    this.api = axios.create(axiosConfig);

    // Add request interceptor for automatic token refresh
    this.api.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.config.accessToken) {
        config.headers.Authorization = `Bearer ${this.config.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Avito API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.config.accessToken || this.isTokenExpired()) {
      await this.refreshToken();
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    return new Date() >= this.tokenExpiresAt;
  }

  /**
   * Refresh access token using client credentials
   */
  private async refreshToken(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.config.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600; // Default 1 hour
      this.tokenExpiresAt = new Date(Date.now() + (expiresIn - 60) * 1000); // Refresh 1 minute before expiry

      logger.info('Avito API token refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh Avito API token:', error);
      throw new Error('Failed to authenticate with Avito API');
    }
  }

  /**
   * Get user profile information to determine correct user ID
   */
  async getUserProfile(): Promise<{ userId: number; name?: string; email?: string }> {
    try {
      await this.ensureValidToken();
      
      // Try different endpoints to get user info
      let response;
      try {
        // First try the accounts/self endpoint
        response = await this.api.get('/core/v1/accounts/self');
      } catch (selfError: any) {
        if (selfError.response?.status === 404) {
          // If self doesn't work, try getting user info from messenger API
          response = await this.api.get('/messenger/v1/accounts');
          if (response.data && response.data.length > 0) {
            // Use the first account's user_id
            const firstAccount = response.data[0];
            return {
              userId: firstAccount.id,
              name: firstAccount.name,
              email: firstAccount.email
            };
          }
        }
        throw selfError;
      }

      logger.info('User profile retrieved successfully', {
        userId: response.data.id,
        name: response.data.name
      });

      return {
        userId: response.data.id,
        name: response.data.name,
        email: response.data.email
      };
    } catch (error: any) {
      logger.error('Failed to get user profile:', error);
      throw new Error(`Failed to get user profile: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Test API connection and credentials
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      await this.getChats({ limit: 1 });
      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      logger.error('AvitoMessengerService test connection failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        userId: this.config.userId,
        clientId: this.config.clientId
      });
      
      let message = 'Connection failed';
      if (error.response?.status === 401) {
        message = 'Ошибка авторизации: неверные client_id или client_secret';
      } else if (error.response?.status === 403) {
        message = 'Доступ запрещен: проверьте права messenger:read';
      } else if (error.response?.status === 404) {
        message = `Пользователь с ID ${this.config.userId} не найден`;
      } else if (error.code === 'ENOTFOUND') {
        message = 'Не удается подключиться к api.avito.ru';
      }
      
      return { 
        success: false, 
        message,
        details: {
          status: error.response?.status,
          error: error.response?.data?.error,
          userId: this.config.userId
        }
      };
    }
  }

  /**
   * Get list of chats
   */
  async getChats(params: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
    chat_types?: ('u2i' | 'u2u')[];
    item_ids?: number[];
  } = {}): Promise<AvitoChatsResponse> {
    const response: AxiosResponse<AvitoChatsResponse> = await this.api.get(
      `/messenger/v2/accounts/${this.config.userId}/chats`,
      { params }
    );

    logger.info(`Retrieved ${response.data.chats.length} chats from Avito API`);
    return response.data;
  }

  /**
   * Get specific chat by ID
   */
  async getChat(chatId: string): Promise<AvitoChat> {
    const response: AxiosResponse<AvitoChat> = await this.api.get(
      `/messenger/v2/accounts/${this.config.userId}/chats/${chatId}`
    );

    logger.info(`Retrieved chat ${chatId} from Avito API`);
    return response.data;
  }

  /**
   * Get messages from a specific chat
   */
  async getMessages(chatId: string, params: {
    limit?: number;
    offset?: number;
  } = {}): Promise<AvitoMessage[]> {
    const response = await this.api.get(
      `/messenger/v3/accounts/${this.config.userId}/chats/${chatId}/messages/`,
      { params }
    );

    logger.info(`Raw messages response for chat ${chatId}:`, {
      status: response.status,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : null,
      data: response.data
    });

    // Handle different response formats
    let messages: AvitoMessage[] = [];
    
    if (Array.isArray(response.data)) {
      messages = response.data;
    } else if (response.data && Array.isArray(response.data.messages)) {
      messages = response.data.messages;
    } else if (response.data && Array.isArray(response.data.data)) {
      messages = response.data.data;
    } else {
      logger.warn(`Unexpected response format for messages in chat ${chatId}:`, response.data);
      messages = [];
    }

    logger.info(`Retrieved ${messages.length} messages from chat ${chatId}`);
    return messages;
  }

  /**
   * Mark messages as read in chat
   */
  async markMessagesAsRead(chatId: string): Promise<void> {
    try {
      await this.api.post(
        `/messenger/v1/accounts/${this.config.userId}/chats/${chatId}/read`
      );
      logger.info(`Messages marked as read for chat ${chatId}`);
    } catch (error) {
      logger.error(`Error marking messages as read for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get voice file URLs by voice IDs
   */
  async getVoiceFileUrls(voiceIds: string[]): Promise<Record<string, string>> {
    try {
      const response = await this.api.get(
        `/messenger/v1/accounts/${this.config.userId}/getVoiceFiles`,
        {
          params: { voice_ids: voiceIds }
        }
      );
      
      logger.info(`Retrieved voice file URLs for ${voiceIds.length} voice messages`);
      return response.data.voices_urls || {};
    } catch (error) {
      logger.error(`Error getting voice file URLs:`, error);
      throw error;
    }
  }

  /**
   * Register webhook URL for notifications
   */
  async registerWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const response = await this.api.post(
        `/messenger/v3/webhook`,
        { url: webhookUrl }
      );
      
      logger.info(`Webhook registered successfully for user ${this.config.userId}`, {
        webhookUrl
      });
      return response.data.ok === true;
    } catch (error) {
      logger.error(`Error registering webhook:`, error);
      throw error;
    }
  }

  /**
   * Get current webhook URL
   */
  async getWebhook(): Promise<string | null> {
    try {
      const response = await this.api.get(
        `/messenger/v3/webhook`
      );
      
      return response.data.url || null;
    } catch (error) {
      logger.error(`Error getting webhook:`, error);
      throw error;
    }
  }

  /**
   * Send text message to chat
   */
  async sendMessage(chatId: string, text: string): Promise<AvitoMessage> {
    const data: SendMessageRequest = {
      type: 'text',
      message: { text }
    };

    const response: AxiosResponse<AvitoMessage> = await this.api.post(
      `/messenger/v1/accounts/${this.config.userId}/chats/${chatId}/messages`,
      data
    );

    logger.info(`Sent message to chat ${chatId}`);
    return response.data;
  }

  /**
   * Upload image for sending
   */
  async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([imageBuffer]);
    formData.append('uploadfile[]', blob, filename);

    const response = await this.api.post(
      `/messenger/v1/accounts/${this.config.userId}/uploadImages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    );

    // Response contains object with image_id as key
    const imageId = Object.keys(response.data)[0];
    logger.info(`Uploaded image with ID: ${imageId}`);
    return imageId;
  }

  /**
   * Send image message to chat
   */
  async sendImageMessage(chatId: string, imageId: string): Promise<AvitoMessage> {
    const data: SendImageMessageRequest = { image_id: imageId };

    const response: AxiosResponse<AvitoMessage> = await this.api.post(
      `/messenger/v1/accounts/${this.config.userId}/chats/${chatId}/messages/image`,
      data
    );

    logger.info(`Sent image message to chat ${chatId}`);
    return response.data;
  }

  /**
   * Mark chat as read
   */
  async markChatAsRead(chatId: string): Promise<void> {
    await this.api.post(
      `/messenger/v1/accounts/${this.config.userId}/chats/${chatId}/read`
    );

    logger.info(`Marked chat ${chatId} as read`);
  }

  /**
   * Delete message
   */
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await this.api.post(
      `/messenger/v1/accounts/${this.config.userId}/chats/${chatId}/messages/${messageId}`
    );

    logger.info(`Deleted message ${messageId} from chat ${chatId}`);
  }

  /**
   * Get voice file URLs
   */
  async getVoiceFiles(voiceIds: string[]): Promise<Record<string, string>> {
    const response = await this.api.get(
      `/messenger/v1/accounts/${this.config.userId}/getVoiceFiles`,
      {
        params: { voice_ids: voiceIds }
      }
    );

    logger.info(`Retrieved voice files for ${voiceIds.length} voice messages`);
    return response.data.voices_urls;
  }

  /**
   * Subscribe to webhooks
   */
  async subscribeToWebhooks(webhookUrl: string): Promise<void> {
    await this.api.post('/messenger/v3/webhook', {
      url: webhookUrl
    });

    logger.info(`Subscribed to webhooks at ${webhookUrl}`);
  }

  /**
   * Unsubscribe from webhooks
   */
  async unsubscribeFromWebhooks(webhookUrl: string): Promise<void> {
    await this.api.post('/messenger/v1/webhook/unsubscribe', {
      url: webhookUrl
    });

    logger.info(`Unsubscribed from webhooks at ${webhookUrl}`);
  }

  /**
   * Get webhook subscriptions
   */
  async getWebhookSubscriptions(): Promise<Array<{ url: string; version: string }>> {
    const response = await this.api.post('/messenger/v1/subscriptions');
    return response.data.subscriptions;
  }

  /**
   * Add user to blacklist
   */
  async addToBlacklist(userId: number, itemId?: number, reasonId: 1 | 2 | 3 | 4 = 4): Promise<void> {
    const data = {
      users: [{
        user_id: userId,
        context: {
          item_id: itemId,
          reason_id: reasonId // 1 - spam, 2 - fraud, 3 - insults, 4 - other
        }
      }]
    };

    await this.api.post(
      `/messenger/v2/accounts/${this.config.userId}/blacklist`,
      data
    );

    logger.info(`Added user ${userId} to blacklist`);
  }

  /**
   * Get formatted message content for display
   */
  getMessageDisplayText(message: AvitoMessage): string {
    const content = message.content;
    
    switch (message.type) {
      case 'text':
        return content.text || '';
      case 'image':
        return '📷 Изображение';
      case 'voice':
        return '🎵 Голосовое сообщение';
      case 'link':
        return `🔗 ${content.link?.text || 'Ссылка'}`;
      case 'item':
        return `📦 ${content.item?.title || 'Объявление'}`;
      case 'location':
        return `📍 ${content.location?.text || 'Местоположение'}`;
      case 'call':
        return '📞 Звонок';
      case 'deleted':
        return '🗑️ Сообщение удалено';
      case 'system':
        return '⚙️ Системное сообщение';
      default:
        return 'Неизвестный тип сообщения';
    }
  }

  /**
   * Format timestamp to readable date
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
