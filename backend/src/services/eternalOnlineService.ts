import { prisma } from '../config/database';
import { logger } from '../config/logger';
import AvitoApiService from './avitoApiService';

// Карта активных интервалов для каждого аккаунта
const activeIntervals = new Map<number, NodeJS.Timeout>();

// Карта последних обновлений для предотвращения слишком частых запросов
const lastUpdateTimes = new Map<number, number>();

// Минимальный интервал между обновлениями (5 минут)
const MIN_UPDATE_INTERVAL = 5 * 60 * 1000;

/**
 * Запустить процесс поддержания онлайна для аккаунта
 */
export const startEternalOnlineProcess = async (accountId: number): Promise<void> => {
  try {
    // Останавливаем предыдущий процесс если он существует
    await stopEternalOnlineProcess(accountId);

    const account = await prisma.avito.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        name: true,
        clientId: true,
        clientSecret: true,
        proxyType: true,
        proxyHost: true,
        proxyPort: true,
        proxyLogin: true,
        proxyPassword: true,
        onlineKeepAliveInterval: true,
      },
    });

    if (!account) {
      logger.error(`Account not found for eternal online: ${accountId}`);
      return;
    }

    logger.info(`Starting eternal online process for account: ${account.name} (ID: ${accountId})`);

    // Функция для поддержания онлайна
    const keepOnlineFunc = async () => {
      try {
        const lastUpdate = lastUpdateTimes.get(accountId) || 0;
        const now = Date.now();

        // Проверяем минимальный интервал
        if (now - lastUpdate < MIN_UPDATE_INTERVAL) {
          logger.debug(`Skipping online update for account ${accountId} - too soon`);
          return;
        }

        // Создаем экземпляр AvitoApiService с прокси
        const proxyConfig = account.proxyHost ? {
          protocol: account.proxyType as 'http' | 'socks4' | 'socks5',
          host: account.proxyHost,
          port: account.proxyPort!,
          auth: account.proxyLogin ? {
            username: account.proxyLogin,
            password: account.proxyPassword || '',
          } : undefined,
        } : undefined;

        const avitoService = new AvitoApiService(
          account.clientId,
          account.clientSecret,
          proxyConfig
        );

        // Пытаемся получить информацию об аккаунте (это поддерживает его онлайн)
        // Токен автоматически обновится через interceptor при необходимости
        await avitoService.getAccountInfo();

        // Обновляем статус в базе данных
        await prisma.avito.update({
          where: { id: accountId },
          data: {
            isOnline: true,
            lastOnlineCheck: new Date(),
          },
        });

        lastUpdateTimes.set(accountId, now);
        logger.info(`Online status updated for account: ${account.name}`);

      } catch (error: any) {
        const errorMessage = error.response?.data?.result?.message || error.message || 'Unknown error';
        logger.error(`Failed to keep account ${accountId} online: ${errorMessage}`, error);

        // Если ошибка 401 - проблема с токеном/аутентификацией
        if (error.response?.status === 401) {
          logger.warn(`Authentication failed for account ${accountId}. Token may have expired or credentials are invalid.`);
        }

        // Обновляем статус как оффлайн в случае ошибки
        try {
          await prisma.avito.update({
            where: { id: accountId },
            data: {
              isOnline: false,
              lastOnlineCheck: new Date(),
            },
          });
        } catch (dbError) {
          logger.error(`Failed to update offline status for account ${accountId}:`, dbError);
        }
      }
    };

    // Запускаем немедленно
    await keepOnlineFunc();

    // Устанавливаем интервал (по умолчанию 5 минут)
    const interval = (account.onlineKeepAliveInterval || 300) * 1000;
    const intervalId = setInterval(keepOnlineFunc, interval);

    // Сохраняем ID интервала
    activeIntervals.set(accountId, intervalId);

    logger.info(`Eternal online process started for account ${accountId} with interval ${interval}ms`);

  } catch (error: any) {
    logger.error(`Failed to start eternal online process for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Остановить процесс поддержания онлайна для аккаунта
 */
export const stopEternalOnlineProcess = async (accountId: number): Promise<void> => {
  try {
    const intervalId = activeIntervals.get(accountId);
    
    if (intervalId) {
      clearInterval(intervalId);
      activeIntervals.delete(accountId);
      lastUpdateTimes.delete(accountId);
      
      logger.info(`Eternal online process stopped for account: ${accountId}`);
    }

    // Обновляем время последней проверки в базе
    await prisma.avito.update({
      where: { id: accountId },
      data: {
        lastOnlineCheck: new Date(),
      },
    });

  } catch (error: any) {
    logger.error(`Failed to stop eternal online process for account ${accountId}:`, error);
  }
};

/**
 * Остановить все процессы вечного онлайна
 */
export const stopAllEternalOnlineProcesses = async (): Promise<void> => {
  logger.info('Stopping all eternal online processes...');
  
  const accountIds = Array.from(activeIntervals.keys());
  
  for (const accountId of accountIds) {
    await stopEternalOnlineProcess(accountId);
  }
  
  logger.info(`Stopped ${accountIds.length} eternal online processes`);
};

/**
 * Запустить все активные процессы вечного онлайна при старте сервера
 */
export const initializeEternalOnlineProcesses = async (): Promise<void> => {
  try {
    logger.info('Initializing eternal online processes...');

    const accounts = await prisma.avito.findMany({
      where: {
        eternalOnlineEnabled: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    logger.info(`Found ${accounts.length} accounts with eternal online enabled`);

    for (const account of accounts) {
      try {
        await startEternalOnlineProcess(account.id);
        logger.info(`Started eternal online for account: ${account.name}`);
      } catch (error: any) {
        logger.error(`Failed to start eternal online for account ${account.name}:`, error);
      }
    }

    logger.info('Eternal online processes initialization completed');

  } catch (error: any) {
    logger.error('Failed to initialize eternal online processes:', error);
  }
};

/**
 * Получить статистику активных процессов
 */
export const getEternalOnlineStats = (): {
  activeProcesses: number;
  accountIds: number[];
} => {
  return {
    activeProcesses: activeIntervals.size,
    accountIds: Array.from(activeIntervals.keys()),
  };
};

/**
 * Обновить интервал для аккаунта
 */
export const updateEternalOnlineInterval = async (
  accountId: number, 
  intervalSeconds: number
): Promise<void> => {
  try {
    // Обновляем в базе данных
    await prisma.avito.update({
      where: { id: accountId },
      data: {
        onlineKeepAliveInterval: intervalSeconds,
      },
    });

    // Если процесс активен, перезапускаем его с новым интервалом
    if (activeIntervals.has(accountId)) {
      await stopEternalOnlineProcess(accountId);
      await startEternalOnlineProcess(accountId);
    }

    logger.info(`Updated eternal online interval for account ${accountId} to ${intervalSeconds} seconds`);

  } catch (error: any) {
    logger.error(`Failed to update eternal online interval for account ${accountId}:`, error);
    throw error;
  }
};
