import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { getSocketIO } from '../config/socket';

// Types for Avito webhook events
interface AvitoWebhookEvent {
  type: 'message' | 'chat';
  payload: {
    chat_id: string;
    message?: {
      id: string;
      author_id: number;
      content: any;
      created: number;
      direction: 'in' | 'out';
      type: string;
    };
    user_id?: number;
  };
}

export const avitoWebhookController = {
  /**
   * Handle incoming webhook from Avito Messenger
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const event: AvitoWebhookEvent = req.body;
      
      logger.info('📨 Received Avito webhook:', {
        type: event.type,
        chatId: event.payload.chat_id,
        messageId: event.payload.message?.id,
        direction: event.payload.message?.direction,
        timestamp: new Date().toISOString()
      });

      // Immediately respond with 200 OK (requirement from Avito)
      res.status(200).json({ ok: true });

      // Process the event asynchronously
      setImmediate(() => {
        processWebhookEvent(event);
      });

    } catch (error) {
      logger.error('❌ Error handling Avito webhook:', error);
      // Still return 200 to prevent Avito from retrying
      res.status(200).json({ ok: true });
    }
  },

  /**
   * Test webhook endpoint (for verification)
   */
  async testWebhook(req: Request, res: Response) {
    logger.info('🧪 Webhook test request received');
    res.status(200).json({ ok: true, message: 'Webhook endpoint is working' });
  }
};

/**
 * Process webhook event asynchronously
 */
async function processWebhookEvent(event: AvitoWebhookEvent) {
  try {
    switch (event.type) {
      case 'message':
        await handleNewMessage(event);
        break;
      case 'chat':
        await handleChatEvent(event);
        break;
      default:
        logger.warn('Unknown webhook event type:', event.type);
    }
  } catch (error) {
    logger.error('Error processing webhook event:', error);
  }
}

/**
 * Handle new message event
 */
async function handleNewMessage(event: AvitoWebhookEvent) {
  const { chat_id, message } = event.payload;
  
  if (!message) {
    logger.warn('Message event without message data');
    return;
  }

  logger.info('💬 New message in chat:', {
    chatId: chat_id,
    messageId: message.id,
    direction: message.direction,
    type: message.type
  });

  // Broadcast to all connected operators
  try {
    const io = getSocketIO();
    io.emit('avito-new-message', {
      chatId: chat_id,
      message: {
        id: message.id,
        authorId: message.author_id,
        content: message.content,
        created: message.created,
        direction: message.direction,
        type: message.type
      }
    });
    
    logger.info('✅ Broadcasted new message event to operators');
  } catch (error) {
    logger.error('Error broadcasting message:', error);
  }
}

/**
 * Handle chat event (new chat, chat updated, etc.)
 */
async function handleChatEvent(event: AvitoWebhookEvent) {
  const { chat_id } = event.payload;
  
  logger.info('💭 Chat event:', {
    chatId: chat_id
  });

  // Broadcast to all connected operators
  try {
    const io = getSocketIO();
    io.emit('avito-chat-updated', {
      chatId: chat_id
    });
    
    logger.info('✅ Broadcasted chat event to operators');
  } catch (error) {
    logger.error('Error broadcasting chat event:', error);
  }
}

