import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AvitoMessengerService } from '../services/avitoMessengerService';

// Standard select for Avito account with proxy data
const AVITO_ACCOUNT_SELECT = {
  id: true,
  name: true,
  clientId: true,
  clientSecret: true,
  userId: true,
  proxyType: true,
  proxyHost: true,
  proxyPort: true,
  proxyLogin: true,
  proxyPassword: true
} as const;

// Utility function to create AvitoMessengerService with proxy configuration
function createAvitoMessengerService(avitoAccount: any): AvitoMessengerService {
  const proxyConfig = avitoAccount.proxyHost ? {
    host: avitoAccount.proxyHost,
    port: avitoAccount.proxyPort!,
    protocol: avitoAccount.proxyType as 'http' | 'https' | 'socks4' | 'socks5',
    ...(avitoAccount.proxyLogin && avitoAccount.proxyPassword && {
      auth: {
        username: avitoAccount.proxyLogin,
        password: avitoAccount.proxyPassword,
      },
    }),
  } : undefined;

  return new AvitoMessengerService({
    clientId: avitoAccount.clientId,
    clientSecret: avitoAccount.clientSecret,
    baseUrl: 'https://api.avito.ru',
    userId: parseInt(avitoAccount.userId || '0'),
    proxyConfig
  });
}

interface AvitoMessengerRequest extends Request {
  avitoService?: AvitoMessengerService;
}

export const avitoMessengerController = {
  /**
   * Get list of Avito accounts for operators
   */
  async getAccounts(req: AvitoMessengerRequest, res: Response) {
    try {
      // Get all Avito accounts with basic info
      const accounts = await prisma.avito.findMany({
        select: {
          id: true,
          name: true,
          connectionStatus: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        success: true,
        data: accounts
      });

      logger.info(`Retrieved ${accounts.length} Avito accounts for operator`, {
        userId: req.user?.id
      });

    } catch (error) {
      logger.error('Error getting Avito accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аккаунтов Авито'
      });
    }
  },

  /**
   * Get list of chats from Avito
   */
  async getChats(req: AvitoMessengerRequest, res: Response) {
    try {
      const { avitoAccountName, limit = '50', offset = '0', unread_only = 'false', chat_types = 'u2i' } = req.query;

      if (!avitoAccountName) {
        return res.status(400).json({
          success: false,
          message: 'Не указано имя аккаунта Авито'
        });
      }

      // Get Avito account from database with proxy data
      const avitoAccount = await prisma.avito.findUnique({
        where: { name: avitoAccountName as string },
        select: AVITO_ACCOUNT_SELECT
      });

      if (!avitoAccount) {
        return res.status(404).json({
          success: false,
          message: 'Аккаунт Авито не найден'
        });
      }

      // Create Avito service instance with proxy support
      const avitoService = createAvitoMessengerService(avitoAccount);

      // Get chats from Avito API
      const chatsData = await avitoService.getChats({
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        unread_only: unread_only === 'true',
        chat_types: (chat_types as string).split(',') as ('u2i' | 'u2u')[]
      });

      // Transform data for frontend
      const transformedChats = chatsData.chats.map(chat => ({
        id: chat.id,
        created: chat.created,
        updated: chat.updated,
        unread_count: 0, // Временно убрано из-за ошибок TypeScript
        context: chat.context ? {
          type: chat.context.type,
          value: {
            id: chat.context.value.id,
            title: chat.context.value.title,
            url: chat.context.value.url,
            image: chat.context.value.images?.main?.['140x105'],
            status: chat.context.value.status_id,
            city: chat.context.value.location?.title || chat.context.value.location?.city_name || chat.context.value.location?.region_name || 'Не указан'
          }
        } : null,
        lastMessage: chat.last_message ? {
          id: chat.last_message.id,
          author_id: chat.last_message.author_id,
          text: avitoService.getMessageDisplayText({
            ...chat.last_message,
            is_read: false // API doesn't provide is_read in chat list
          }),
          created: chat.last_message.created,
          direction: chat.last_message.direction,
          type: chat.last_message.type,
          isRead: false // API doesn't provide is_read in chat list
        } : null,
        users: chat.users.map(user => ({
          id: user.id,
          name: user.name,
          is_online: false, // Временно убрано из-за ошибок TypeScript
          avatar: user.public_user_profile?.avatar?.default || '' // Временно убрано из-за ошибок TypeScript
        })),
        // Additional fields for our system
        avitoAccountName: avitoAccount.name,
        city: chat.context?.value?.location?.title || chat.context?.value?.location?.city_name || chat.context?.value?.location?.region_name || 'Не указан',
        rk: avitoAccount.name // Using account name as RK for now
      }));

      res.json({
        success: true,
        data: {
          chats: transformedChats,
          total: transformedChats.length // Временно убрано из-за ошибок TypeScript
        }
      });

      logger.info(`Retrieved ${transformedChats.length} chats for account ${avitoAccountName}`, {
        userId: req.user?.id,
        avitoAccount: avitoAccountName
      });

    } catch (error) {
      logger.error('Error getting Avito chats:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении чатов из Авито'
      });
    }
  },

  /**
   * Get chat messages
   */
  async getChatMessages(req: AvitoMessengerRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const { avitoAccountName, limit = '50', offset = '0' } = req.query;

      if (!avitoAccountName) {
        return res.status(400).json({
          success: false,
          message: 'Не указано имя аккаунта Авито'
        });
      }

      // Get Avito account from database with proxy data
      const avitoAccount = await prisma.avito.findUnique({
        where: { name: avitoAccountName as string },
        select: AVITO_ACCOUNT_SELECT
      });

      if (!avitoAccount) {
        return res.status(404).json({
          success: false,
          message: 'Аккаунт Авито не найден'
        });
      }

      // Create Avito service instance with proxy support
      const avitoService = createAvitoMessengerService(avitoAccount);

      // Get messages from Avito API
      const messages = await avitoService.getMessages(chatId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      // Ensure messages is an array
      if (!Array.isArray(messages)) {
        logger.error(`Expected array of messages but got:`, {
          type: typeof messages,
          value: messages,
          chatId
        });
        
        return res.status(500).json({
          success: false,
          message: 'Неправильный формат ответа от Avito API'
        });
      }

      // Transform messages for frontend
      const transformedMessages = messages.map(message => ({
        id: message.id,
        author_id: message.author_id,
        content: message.content,
        created: message.created,
        direction: message.direction,
        type: message.type,
        isRead: message.is_read,
        readAt: message.read,
        // Add image URL for image messages
        imageUrl: message.type === 'image' && message.content.image ? 
          (message.content.image.sizes['1280x960'] || 
           message.content.image.sizes['640x480'] || 
           message.content.image.sizes['320x240'] || 
           Object.values(message.content.image.sizes)[0]) : null,
        quote: message.quote ? {
          id: message.quote.id,
          author_id: message.quote.author_id,
          content: message.quote.content,
          created: message.quote.created
        } : null
      }));

      res.json({
        success: true,
        data: {
          messages: transformedMessages
        }
      });

      logger.info(`Retrieved ${transformedMessages.length} messages for chat ${chatId}`, {
        userId: req.user?.id,
        avitoAccount: avitoAccountName
      });

    } catch (error) {
      logger.error('Error getting chat messages:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении сообщений'
      });
    }
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(req: AvitoMessengerRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const { avitoAccountName } = req.body;

      if (!avitoAccountName) {
        return res.status(400).json({
          success: false,
          message: 'Не указано имя Авито аккаунта'
        });
      }

      const avitoAccount = await prisma.avito.findUnique({
        where: { name: avitoAccountName },
        select: AVITO_ACCOUNT_SELECT
      });

      if (!avitoAccount) {
        return res.status(404).json({
          success: false,
          message: 'Авито аккаунт не найден'
        });
      }

      const avitoService = createAvitoMessengerService(avitoAccount);

      await avitoService.markMessagesAsRead(chatId);

      logger.info(`Messages marked as read for chat ${chatId}`, {
        avitoAccount: avitoAccountName,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'Сообщения отмечены как прочитанные'
      });

    } catch (error: any) {
      logger.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Ошибка при отметке сообщений как прочитанных'
      });
    }
  },

  /**
   * Send message to chat
   */
  async sendMessage(req: AvitoMessengerRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const { avitoAccountName, message, type = 'text' } = req.body;

      if (!avitoAccountName) {
        return res.status(400).json({
          success: false,
          message: 'Не указано имя аккаунта Авито'
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Сообщение не может быть пустым'
        });
      }

      // Get Avito account from database
      const avitoAccount = await prisma.avito.findUnique({
        where: { name: avitoAccountName },
        select: AVITO_ACCOUNT_SELECT
      });

      if (!avitoAccount) {
        return res.status(404).json({
          success: false,
          message: 'Аккаунт Авито не найден'
        });
      }

      // Create Avito service instance with proxy support
      const avitoService = createAvitoMessengerService(avitoAccount);

      // Send message via Avito API
      const sentMessage = await avitoService.sendMessage(chatId, message);

      res.json({
        success: true,
        data: sentMessage,
        message: 'Сообщение успешно отправлено'
      });

      logger.info(`Sent message to chat ${chatId}`, {
        userId: req.user?.id,
        avitoAccount: avitoAccountName,
        chatId
      });

    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при отправке сообщения'
      });
    }
  },

  /**
   * Get voice file URLs by voice IDs
   */
  async getVoiceFileUrls(req: AvitoMessengerRequest, res: Response) {
    try {
      const { avitoAccountName } = req.query;
      const { voiceIds } = req.body;

      if (!avitoAccountName) {
        return res.status(400).json({
          success: false,
          message: 'Не указано имя Авито аккаунта'
        });
      }

      if (!voiceIds || !Array.isArray(voiceIds) || voiceIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Не указаны ID голосовых сообщений'
        });
      }

      const avitoAccount = await prisma.avito.findUnique({
        where: { name: avitoAccountName as string },
        select: AVITO_ACCOUNT_SELECT
      });

      if (!avitoAccount) {
        return res.status(404).json({
          success: false,
          message: 'Авито аккаунт не найден'
        });
      }

      const avitoService = createAvitoMessengerService(avitoAccount);
      const voiceUrls = await avitoService.getVoiceFileUrls(voiceIds);

      res.json({
        success: true,
        data: voiceUrls
      });

      logger.info(`Retrieved voice file URLs`, {
        userId: req.user?.id,
        avitoAccount: avitoAccountName,
        voiceCount: voiceIds.length
      });

    } catch (error) {
      logger.error('Error getting voice file URLs:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении голосовых файлов'
      });
    }
  },

  /**
   * Register webhook for Avito account
   */
  async registerWebhook(req: AvitoMessengerRequest, res: Response) {
    try {
      const { avitoAccountName } = req.body;
      const webhookUrl = `${process.env.BACKEND_URL || 'https://callcentre.lead-schem.ru'}/api/webhooks/avito`;

      if (!avitoAccountName) {
        return res.status(400).json({
          success: false,
          message: 'Не указано имя Авито аккаунта'
        });
      }

      const avitoAccount = await prisma.avito.findUnique({
        where: { name: avitoAccountName },
        select: AVITO_ACCOUNT_SELECT
      });

      if (!avitoAccount) {
        return res.status(404).json({
          success: false,
          message: 'Авито аккаунт не найден'
        });
      }

      const avitoService = createAvitoMessengerService(avitoAccount);
      const success = await avitoService.registerWebhook(webhookUrl);

      res.json({
        success: true,
        data: {
          registered: success,
          webhookUrl
        },
        message: success ? 'Webhook успешно зарегистрирован' : 'Не удалось зарегистрировать webhook'
      });

      logger.info(`Webhook registration attempt`, {
        userId: req.user?.id,
        avitoAccount: avitoAccountName,
        webhookUrl,
        success
      });

    } catch (error) {
      logger.error('Error registering webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при регистрации webhook'
      });
    }
  },

  /**
   * Get current webhook URL for Avito account
   */
  async getWebhook(req: AvitoMessengerRequest, res: Response) {
    try {
      const { avitoAccountName } = req.query;

      if (!avitoAccountName) {
        return res.status(400).json({
          success: false,
          message: 'Не указано имя Авито аккаунта'
        });
      }

      const avitoAccount = await prisma.avito.findUnique({
        where: { name: avitoAccountName as string },
        select: AVITO_ACCOUNT_SELECT
      });

      if (!avitoAccount) {
        return res.status(404).json({
          success: false,
          message: 'Авито аккаунт не найден'
        });
      }

      const avitoService = createAvitoMessengerService(avitoAccount);
      const webhookUrl = await avitoService.getWebhook();

      res.json({
        success: true,
        data: {
          webhookUrl
        }
      });

    } catch (error) {
      logger.error('Error getting webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении webhook'
      });
    }
  }
};