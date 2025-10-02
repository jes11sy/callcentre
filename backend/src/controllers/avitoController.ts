import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import AvitoApiService from '../services/avitoApiService';
import AvitoApiHealthCheck from '../services/avitoApiHealthCheck';
import { startEternalOnlineProcess, stopEternalOnlineProcess } from '../services/eternalOnlineService';

// Получить все Авито аккаунты
export const getAllAvitoAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.avito.findMany({
      select: {
        id: true,
        name: true,
        clientId: true,
        // Exclude clientSecret for security in list view
        userId: true,
        proxyType: true,
        proxyHost: true,
        proxyPort: true,
        proxyLogin: true,
        // Exclude proxyPassword for security in list view
        connectionStatus: true,
        proxyStatus: true,
        accountBalance: true,
        adsCount: true,
        viewsCount: true,
        contactsCount: true,
        viewsToday: true,
        contactsToday: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      message: 'Avito accounts retrieved successfully',
      accounts,
      count: accounts.length,
    });
  } catch (error: any) {
    logger.error(`Error fetching Avito accounts: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error fetching Avito accounts' } });
  }
};

// Получить данные прокси всех аккаунтов (для проверки прокси)
export const getAllAvitoAccountsWithProxy = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.avito.findMany({
      select: {
        id: true,
        name: true,
        proxyType: true,
        proxyHost: true,
        proxyPort: true,
        proxyLogin: true,
        proxyPassword: true, // Include password for proxy testing
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      message: 'Avito accounts with proxy data retrieved successfully',
      accounts,
      count: accounts.length,
    });
  } catch (error: any) {
    logger.error('Failed to get Avito accounts with proxy:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve accounts' } });
  }
};

// Получить Авито аккаунт по ID
export const getAvitoAccountById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const account = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        clientId: true,
        clientSecret: true, // Include secret for edit form
        userId: true,
        proxyType: true,
        proxyHost: true,
        proxyPort: true,
        proxyLogin: true,
        proxyPassword: true, // Include password for edit form
        connectionStatus: true,
        proxyStatus: true,
        accountBalance: true,
        adsCount: true,
        viewsCount: true,
        contactsCount: true,
        viewsToday: true,
        contactsToday: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    res.status(200).json({
      message: 'Avito account retrieved successfully',
      account,
    });
  } catch (error: any) {
    logger.error(`Error fetching Avito account ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error fetching Avito account' } });
  }
};

// Создать новый Авито аккаунт
export const createAvitoAccount = async (req: Request, res: Response) => {
  const { 
    name, 
    clientId, 
    clientSecret,
    userId,
    proxyType,
    proxyHost,
    proxyPort,
    proxyLogin,
    proxyPassword
  } = req.body;

  // Validation
  if (!name || !clientId || !clientSecret) {
    return res.status(400).json({
      error: { message: 'Name, clientId, and clientSecret are required' },
    });
  }

  try {
    // Check if name already exists
    const existingAccount = await prisma.avito.findUnique({
      where: { name },
    });

    if (existingAccount) {
      return res.status(400).json({
        error: { message: 'Account with this name already exists' },
      });
    }

    // Create Avito account
    const newAccount = await prisma.avito.create({
      data: {
        name,
        clientId,
        clientSecret,
        userId: userId || null,
        proxyType: proxyType || null,
        proxyHost: proxyHost || null,
        proxyPort: proxyPort ? parseInt(proxyPort) : null,
        proxyLogin: proxyLogin || null,
        proxyPassword: proxyPassword || null,
      },
      select: {
        id: true,
        name: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`New Avito account created: ${newAccount.name} by admin ${req.user?.login}`);
    res.status(201).json({
      message: 'Avito account created successfully',
      account: newAccount,
    });
  } catch (error: any) {
    logger.error(`Error creating Avito account: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error creating Avito account' } });
  }
};

// Обновить Авито аккаунт
export const updateAvitoAccount = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    name, 
    clientId, 
    clientSecret,
    userId,
    proxyType,
    proxyHost,
    proxyPort,
    proxyLogin,
    proxyPassword
  } = req.body;

  try {
    // Check if account exists
    const existingAccount = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingAccount) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    // Check if new name conflicts with existing (if name is being changed)
    if (name && name !== existingAccount.name) {
      const nameConflict = await prisma.avito.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return res.status(400).json({
          error: { message: 'Account with this name already exists' },
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...(name && { name }),
      ...(clientId && { clientId }),
      ...(clientSecret && { clientSecret }),
      ...(userId !== undefined && { userId: userId || null }),
      ...(proxyType !== undefined && { proxyType: proxyType || null }),
      ...(proxyHost !== undefined && { proxyHost: proxyHost || null }),
      ...(proxyPort !== undefined && { proxyPort: proxyPort ? parseInt(proxyPort) : null }),
      ...(proxyLogin !== undefined && { proxyLogin: proxyLogin || null }),
      ...(proxyPassword !== undefined && { proxyPassword: proxyPassword || null }),
    };

    // Update account
    const updatedAccount = await prisma.avito.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Avito account updated: ${updatedAccount.name} by admin ${req.user?.login}`);
    res.status(200).json({
      message: 'Avito account updated successfully',
      account: updatedAccount,
    });
  } catch (error: any) {
    logger.error(`Error updating Avito account ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error updating Avito account' } });
  }
};

// Удалить Авито аккаунт
export const deleteAvitoAccount = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if account exists
    const existingAccount = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingAccount) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    // Check if account has associated orders or calls
    const associatedOrders = await prisma.order.count({
      where: { avitoName: existingAccount.name },
    });

    const associatedCalls = await prisma.call.count({
      where: { avitoName: existingAccount.name },
    });

    if (associatedOrders > 0 || associatedCalls > 0) {
      return res.status(400).json({
        error: {
          message: 'Cannot delete Avito account with associated orders or calls',
          details: {
            orders: associatedOrders,
            calls: associatedCalls,
          },
        },
      });
    }

    // Delete account
    await prisma.avito.delete({
      where: { id: parseInt(id) },
    });

    logger.info(`Avito account deleted: ${existingAccount.name} by admin ${req.user?.login}`);
    res.status(200).json({
      message: 'Avito account deleted successfully',
      deletedAccount: {
        id: existingAccount.id,
        name: existingAccount.name,
      },
    });
  } catch (error: any) {
    logger.error(`Error deleting Avito account ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error deleting Avito account' } });
  }
};

// Тестировать подключение к Авито API
export const testAvitoConnection = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const account = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
    });

    if (!account) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    // Create Avito API service instance
    const proxyConfig = account.proxyHost ? {
      host: account.proxyHost,
      port: account.proxyPort!,
      protocol: account.proxyType as 'http' | 'https' | 'socks4' | 'socks5',
      ...(account.proxyLogin && account.proxyPassword && {
        auth: {
          username: account.proxyLogin,
          password: account.proxyPassword,
        },
      }),
    } : undefined;

    const avitoApi = new AvitoApiService(
      account.clientId,
      account.clientSecret,
      proxyConfig
    );

    // Статус прокси определим по результату основного теста
    let proxyStatus = account.proxyHost ? 'not_checked' : null;

    // First do a simple health check
    const healthCheck = await AvitoApiHealthCheck.checkApiAvailability();
    if (!healthCheck.available) {
      logger.warn('Avito API is not available, skipping full connection test');
      await prisma.avito.update({
        where: { id: parseInt(id) },
        data: {
          connectionStatus: 'disconnected',
          proxyStatus: proxyStatus,
          lastSyncAt: new Date(),
        },
      });

      return res.status(200).json({
        message: 'Avito connection tested',
        result: {
          success: false,
          connectionStatus: 'disconnected',
          proxyStatus: proxyStatus,
          message: healthCheck.message,
          account: account.name,
        },
        account: await prisma.avito.findUnique({ where: { id: parseInt(id) } }),
      });
    }

    // Test with credentials
    const credentialsTest = await AvitoApiHealthCheck.testWithCredentials(
      account.clientId,
      account.clientSecret
    );

    if (!credentialsTest.success) {
      await prisma.avito.update({
        where: { id: parseInt(id) },
        data: {
          connectionStatus: 'disconnected',
          proxyStatus: proxyStatus,
          lastSyncAt: new Date(),
        },
      });

      return res.status(200).json({
        message: 'Avito connection tested',
        result: {
          success: false,
          connectionStatus: 'disconnected',
          proxyStatus: proxyStatus,
          message: credentialsTest.message,
          account: account.name,
        },
        account: await prisma.avito.findUnique({ where: { id: parseInt(id) } }),
      });
    }

    // Test full connection with proxy
    logger.info(`=== TESTING AVITO CONNECTION WITH PROXY ===`);
    logger.info(`Account: ${account.name}`);
    logger.info(`Client ID: ${account.clientId}`);
    logger.info(`Proxy: ${account.proxyHost ? `${account.proxyHost}:${account.proxyPort}` : 'None'}`);
    
    let connectionResult;
    
    // Если есть прокси, сначала попробуем без прокси для диагностики
    if (account.proxyHost) {
      try {
        logger.info(`=== TESTING AVITO WITHOUT PROXY (DIAGNOSTIC) ===`);
        const avitoApiNoProxy = new AvitoApiService(
          account.clientId,
          account.clientSecret
        );
        const noProxyTest = await avitoApiNoProxy.testConnection();
        logger.info(`Direct connection result: ${noProxyTest.success ? 'SUCCESS' : 'FAILED'} - ${noProxyTest.message}`);
      } catch (error: any) {
        logger.warn(`Direct connection failed: ${error.message}`);
      }
    }
    
    connectionResult = await avitoApi.testConnection();
    
    // Определяем статус прокси по результату теста
    if (account.proxyHost) {
      proxyStatus = connectionResult.success ? 'working' : 'failed';
    }

    // Update account status based on test results
    const updatedAccount = await prisma.avito.update({
      where: { id: parseInt(id) },
      data: {
        connectionStatus: connectionResult.success ? 'connected' : 'disconnected',
        proxyStatus,
        lastSyncAt: new Date(),
      },
    });

    const testResult = {
      success: connectionResult.success,
      connectionStatus: connectionResult.success ? 'connected' : 'disconnected',
      proxyStatus,
      message: connectionResult.message,
      account: account.name,
    };

    logger.info(`Avito connection test for account ${account.name}: ${testResult.message} by admin ${req.user?.login}`);
    res.status(200).json({
      message: 'Avito connection tested successfully',
      result: testResult,
      account: updatedAccount,
    });
  } catch (error: any) {
    logger.error(`Error testing Avito connection ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error testing Avito connection' } });
  }
};

// Синхронизировать данные аккаунта с Avito API
export const syncAvitoAccount = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const account = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
    });

    if (!account) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    // Create Avito API service instance
    const proxyConfig = account.proxyHost ? {
      host: account.proxyHost,
      port: account.proxyPort!,
      protocol: account.proxyType as 'http' | 'https' | 'socks4' | 'socks5',
      ...(account.proxyLogin && account.proxyPassword && {
        auth: {
          username: account.proxyLogin,
          password: account.proxyPassword,
        },
      }),
    } : undefined;

    const avitoApi = new AvitoApiService(
      account.clientId,
      account.clientSecret,
      proxyConfig
    );

    try {
      logger.info(`Starting sync for Avito account ${account.name} (ID: ${account.id})`);
      logger.info(`Account details:`, {
        clientId: account.clientId.substring(0, 8) + '...',
        hasProxy: !!account.proxyHost,
        proxyHost: account.proxyHost,
        proxyPort: account.proxyPort,
        proxyType: account.proxyType
      });

      // Добавляем небольшую задержку для стабильности прокси
      if (account.proxyHost) {
        logger.info('Adding delay before sync for proxy stability...');
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3 секунды
      }
      
      // Sync account data from Avito API
      const syncData = await avitoApi.syncAccountData();
      
      logger.info(`Sync data retrieved for ${account.name}:`, {
        balance: syncData.accountBalance,
        ads: syncData.adsCount,
        views: syncData.viewsCount,
        contacts: syncData.contactsCount
      });
      
      const updatedAccount = await prisma.avito.update({
        where: { id: parseInt(id) },
        data: {
          connectionStatus: 'connected',
          accountBalance: syncData.accountBalance,
          adsCount: syncData.adsCount,
          viewsCount: syncData.viewsCount,
          contactsCount: syncData.contactsCount,
          viewsToday: syncData.viewsToday || 0,
          contactsToday: syncData.contactsToday || 0,
          lastSyncAt: new Date(),
        },
      });

      logger.info(`Avito account ${account.name} synced successfully by admin ${req.user?.login}`);
      res.status(200).json({
        message: 'Account synced successfully',
        account: updatedAccount,
      });
    } catch (syncError: any) {
      // Определяем статус прокси при ошибке
      let proxyStatus = account.proxyHost ? 'not_checked' : null;
      
      if (account.proxyHost) {
        // При ошибке синхронизации считаем что проблема может быть в прокси
        proxyStatus = 'failed';
        logger.info(`Proxy marked as failed due to sync error`);
      }

      // Update connection status to disconnected if sync fails
      await prisma.avito.update({
        where: { id: parseInt(id) },
        data: {
          connectionStatus: 'disconnected',
          proxyStatus: proxyStatus,
          lastSyncAt: new Date(),
        },
      });

      logger.error(`Failed to sync Avito account ${account.name}:`, {
        error: syncError.message,
        stack: syncError.stack,
        accountId: account.id,
        clientId: account.clientId,
        hasProxy: !!account.proxyHost,
        proxyStatus: proxyStatus,
        proxyHost: account.proxyHost,
        proxyPort: account.proxyPort
      });
      
      // Более информативное сообщение об ошибке
      let errorMessage = syncError.message;
      if (account.proxyHost && proxyStatus === 'failed') {
        errorMessage = `Прокси ${account.proxyHost}:${account.proxyPort} не работает. ${syncError.message}`;
      } else if (syncError.message.includes('timeout') || syncError.message.includes('ECONNRESET')) {
        errorMessage = `Нестабильное соединение с прокси. Попробуйте еще раз. ${syncError.message}`;
      }
      
      res.status(400).json({
        error: { message: `Failed to sync account data: ${errorMessage}` },
      });
    }
  } catch (error: any) {
    logger.error(`Error syncing Avito account ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error syncing Avito account' } });
  }
};

// Синхронизировать все активные аккаунты Avito
export const syncAllAvitoAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.avito.findMany({
      where: {
        connectionStatus: {
          in: ['connected', 'not_checked'],
        },
      },
    });

    const results = [];
    
    for (const account of accounts) {
      try {
        // Create Avito API service instance
        const proxyConfig = account.proxyHost ? {
          host: account.proxyHost,
          port: account.proxyPort!,
          protocol: account.proxyType as 'http' | 'https' | 'socks4' | 'socks5',
          ...(account.proxyLogin && account.proxyPassword && {
            auth: {
              username: account.proxyLogin,
              password: account.proxyPassword,
            },
          }),
        } : undefined;

        const avitoApi = new AvitoApiService(
          account.clientId,
          account.clientSecret,
          proxyConfig
        );

        // Sync account data
        const syncData = await avitoApi.syncAccountData();
        
        await prisma.avito.update({
          where: { id: account.id },
          data: {
            connectionStatus: 'connected',
            accountBalance: syncData.accountBalance,
            adsCount: syncData.adsCount,
            viewsCount: syncData.viewsCount,
            contactsCount: syncData.contactsCount,
            viewsToday: syncData.viewsToday || 0,
            contactsToday: syncData.contactsToday || 0,
            lastSyncAt: new Date(),
          },
        });

        results.push({
          accountId: account.id,
          accountName: account.name,
          success: true,
          message: 'Synced successfully',
        });

        logger.info(`Avito account ${account.name} auto-synced successfully`);
      } catch (error: any) {
        // Update connection status to disconnected if sync fails
        await prisma.avito.update({
          where: { id: account.id },
          data: {
            connectionStatus: 'disconnected',
            lastSyncAt: new Date(),
          },
        });

        results.push({
          accountId: account.id,
          accountName: account.name,
          success: false,
          message: error.message,
        });

        logger.error(`Failed to auto-sync Avito account ${account.name}: ${error.message}`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info(`Avito auto-sync completed: ${successCount} successful, ${failureCount} failed by admin ${req.user?.login}`);
    res.status(200).json({
      message: `Sync completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: accounts.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error: any) {
    logger.error(`Error in bulk Avito sync: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error syncing Avito accounts' } });
  }
};

// Тестировать только прокси (без Авито API)
export const testProxyConnection = async (req: Request, res: Response) => {
  const { 
    proxyType,
    proxyHost,
    proxyPort,
    proxyLogin,
    proxyPassword
  } = req.body;

  try {
    // Валидация обязательных полей
    if (!proxyHost || !proxyPort || !proxyType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Хост, порт и тип прокси обязательны' }
      });
    }

    // Создаем конфигурацию прокси
    const proxyConfig = {
      host: proxyHost,
      port: parseInt(proxyPort),
      protocol: proxyType as 'http' | 'https' | 'socks4' | 'socks5',
      ...(proxyLogin && proxyPassword && {
        auth: {
          username: proxyLogin,
          password: proxyPassword,
        },
      }),
    };

    // Создаем временный AvitoApiService только для тестирования прокси
    const avitoApi = new AvitoApiService(
      'test_client_id',
      'test_client_secret',
      proxyConfig
    );

    // Тестируем только прокси (не Авито API)
    const proxyTest = await avitoApi.testProxyOnly();
    
    if (proxyTest.success) {
      logger.info(`Proxy test successful: ${proxyHost}:${proxyPort}`);
      res.status(200).json({
        success: true,
        message: `Прокси ${proxyHost}:${proxyPort} работает корректно`,
        proxy: {
          host: proxyHost,
          port: proxyPort,
          type: proxyType
        }
      });
    } else {
      logger.warn(`Proxy test failed: ${proxyHost}:${proxyPort} - ${proxyTest.message}`);
      res.status(200).json({
        success: false,
        message: proxyTest.message,
        proxy: {
          host: proxyHost,
          port: proxyPort,
          type: proxyType
        }
      });
    }

  } catch (error: any) {
    logger.error(`Error testing proxy: ${error.message}`, error);
    res.status(500).json({
      success: false,
      error: { message: 'Ошибка сервера при тестировании прокси' }
    });
  }
};

// Получить статусы онлайн и настройки вечного онлайна
export const getOnlineStatuses = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.avito.findMany({
      select: {
        id: true,
        name: true,
        eternalOnlineEnabled: true,
        isOnline: true,
        lastOnlineCheck: true,
      },
    });

    const onlineStatuses: {[key: number]: boolean} = {};
    const eternalOnlineSettings: {[key: number]: boolean} = {};

    accounts.forEach(account => {
      onlineStatuses[account.id] = account.isOnline || false;
      eternalOnlineSettings[account.id] = account.eternalOnlineEnabled || false;
    });

    res.status(200).json({
      message: 'Online statuses retrieved successfully',
      onlineStatuses,
      eternalOnlineSettings,
    });
  } catch (error: any) {
    logger.error('Failed to get online statuses:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve online statuses' } });
  }
};

// Переключить настройку вечного онлайна для аккаунта
export const toggleEternalOnline = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled } = req.body;

  try {
    const account = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
    });

    if (!account) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    // Обновляем настройку в базе данных
    const updatedAccount = await prisma.avito.update({
      where: { id: parseInt(id) },
      data: {
        eternalOnlineEnabled: enabled,
        lastOnlineCheck: new Date(),
        // Если включаем вечный онлайн, сразу ставим статус онлайн
        isOnline: enabled ? true : account.isOnline,
      },
    });

    logger.info(`Eternal online ${enabled ? 'enabled' : 'disabled'} for account: ${account.name}`);

    // Запускаем или останавливаем фоновый процесс
    if (enabled) {
      await startEternalOnlineProcess(parseInt(id));
    } else {
      await stopEternalOnlineProcess(parseInt(id));
    }

    res.status(200).json({
      message: `Eternal online ${enabled ? 'enabled' : 'disabled'} successfully`,
      accountId: updatedAccount.id,
      enabled: updatedAccount.eternalOnlineEnabled,
      isOnline: updatedAccount.isOnline,
    });
  } catch (error: any) {
    logger.error('Failed to toggle eternal online:', error);
    res.status(500).json({ error: { message: 'Failed to toggle eternal online' } });
  }
};

// Детальная диагностика проблем с прокси и Авито API
export const diagnoseAvitoConnection = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const account = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
    });

    if (!account) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    // Create Avito API service instance
    const proxyConfig = account.proxyHost ? {
      host: account.proxyHost,
      port: account.proxyPort!,
      protocol: account.proxyType as 'http' | 'https' | 'socks4' | 'socks5',
      ...(account.proxyLogin && account.proxyPassword && {
        auth: {
          username: account.proxyLogin,
          password: account.proxyPassword,
        },
      }),
    } : undefined;

    const avitoApi = new AvitoApiService(
      account.clientId,
      account.clientSecret,
      proxyConfig
    );

    // Запускаем детальную диагностику
    const diagnosis = await avitoApi.diagnoseProxyIssues();
    
    logger.info(`Detailed diagnosis completed for account ${account.name}:`, diagnosis);
    
    res.status(200).json({
      message: 'Детальная диагностика завершена',
      account: account.name,
      diagnosis: {
        proxyWorks: diagnosis.proxyWorks,
        avitoWorksWithoutProxy: diagnosis.avitoWorksWithoutProxy,
        avitoWorksWithProxy: diagnosis.avitoWorksWithProxy,
        recommendations: diagnosis.recommendations,
        summary: diagnosis.avitoWorksWithProxy ? 
          '✅ Все работает корректно' : 
          diagnosis.avitoWorksWithoutProxy ? 
            '⚠️ Авито API работает, но прокси блокирует запросы' :
            '❌ Проблемы с Client ID/Secret или доступом к Авито API'
      }
    });
  } catch (error: any) {
    logger.error(`Error diagnosing Avito connection ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error during diagnosis' } });
  }
};

// ===== КОНТРОЛЛЕРЫ ДЛЯ РАБОТЫ С ОТЗЫВАМИ И РЕЙТИНГАМИ =====

/**
 * Получить информацию о рейтинге для всех аккаунтов
 */
export const getAllRatingsInfo = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.avito.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const ratingsInfo = [];

    for (const account of accounts) {
      try {
        // Create Avito API service instance with proxy config
        const proxyConfig = account.proxyHost ? {
          host: account.proxyHost,
          port: account.proxyPort!,
          protocol: account.proxyType as 'http' | 'https' | 'socks4' | 'socks5',
          ...(account.proxyLogin && account.proxyPassword && {
            auth: {
              username: account.proxyLogin,
              password: account.proxyPassword,
            },
          }),
        } : undefined;

        const avitoService = new AvitoApiService(
          account.clientId,
          account.clientSecret,
          proxyConfig
        );

        const ratingInfo = await avitoService.getRatingInfo();
        
        ratingsInfo.push({
          accountId: account.id,
          accountName: account.name,
          ratingInfo: ratingInfo
        });

      } catch (error: any) {
        logger.error(`Failed to get rating info for account ${account.name}:`, error);
        ratingsInfo.push({
          accountId: account.id,
          accountName: account.name,
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: 'Ratings info retrieved successfully',
      ratings: ratingsInfo,
    });
  } catch (error: any) {
    logger.error('Failed to get ratings info:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve ratings info' } });
  }
};

/**
 * Получить отзывы для конкретного аккаунта
 */
export const getAccountReviews = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { offset = 0, limit = 20 } = req.query;

  try {
    const account = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
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
      },
    });

    if (!account) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    // Create Avito API service instance with proxy config
    const proxyConfig = account.proxyHost ? {
      host: account.proxyHost,
      port: account.proxyPort!,
      protocol: account.proxyType as 'http' | 'https' | 'socks4' | 'socks5',
      ...(account.proxyLogin && account.proxyPassword && {
        auth: {
          username: account.proxyLogin,
          password: account.proxyPassword,
        },
      }),
    } : undefined;

    const avitoService = new AvitoApiService(
      account.clientId,
      account.clientSecret,
      proxyConfig
    );

    const reviews = await avitoService.getReviews(
      parseInt(offset as string), 
      parseInt(limit as string)
    );

    res.status(200).json({
      message: 'Reviews retrieved successfully',
      accountId: account.id,
      accountName: account.name,
      reviews: reviews,
    });
  } catch (error: any) {
    logger.error(`Failed to get reviews for account ${id}:`, error);
    res.status(500).json({ error: { message: 'Failed to retrieve reviews' } });
  }
};

/**
 * Создать ответ на отзыв
 */
export const createReviewAnswer = async (req: Request, res: Response) => {
  const { id } = req.params; // account ID
  const { reviewId, message } = req.body;

  try {
    const account = await prisma.avito.findUnique({
      where: { id: parseInt(id) },
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
      },
    });

    if (!account) {
      return res.status(404).json({ error: { message: 'Avito account not found' } });
    }

    // Create Avito API service instance with proxy config
    const proxyConfig = account.proxyHost ? {
      host: account.proxyHost,
      port: account.proxyPort!,
      protocol: account.proxyType as 'http' | 'https' | 'socks4' | 'socks5',
      ...(account.proxyLogin && account.proxyPassword && {
        auth: {
          username: account.proxyLogin,
          password: account.proxyPassword,
        },
      }),
    } : undefined;

    const avitoService = new AvitoApiService(
      account.clientId,
      account.clientSecret,
      proxyConfig
    );

    const result = await avitoService.createReviewAnswer(reviewId, message);

    res.status(200).json({
      message: 'Review answer created successfully',
      accountId: account.id,
      accountName: account.name,
      answer: result,
    });
  } catch (error: any) {
    logger.error(`Failed to create review answer for account ${id}:`, error);
    res.status(500).json({ error: { message: 'Failed to create review answer' } });
  }
};
