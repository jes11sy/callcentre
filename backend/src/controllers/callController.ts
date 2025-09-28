import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

interface CallFilters {
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  rk?: string;
  operatorId?: number;
  avitoName?: string;
  status?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const callController = {
  // Получить звонок по ID
  async getCallById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const call = await prisma.call.findUnique({
        where: { id: parseInt(id) },
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              login: true
            }
          },
          avito: {
            select: {
              id: true,
              name: true
            }
          },
          mango: {
            select: {
              id: true,
              callId: true,
              recordUrl: true
            }
          }
        }
      });

      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Звонок не найден'
        });
      }

      res.json({
        success: true,
        data: call
      });

    } catch (error) {
      logger.error('Error getting call by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении звонка'
      });
    }
  },

  // Получить список звонков с фильтрацией и пагинацией
  async getCalls(req: Request, res: Response) {
    try {
      const {
        dateFrom,
        dateTo,
        city,
        rk,
        operatorId,
        avitoName,
        status,
        page = 1,
        limit = 20,
        sortBy = 'dateCreate',
        sortOrder = 'desc'
      } = req.query;

      // Построение условий фильтрации
      const where: any = {};

      if (dateFrom || dateTo) {
        where.dateCreate = {};
        if (dateFrom) {
          where.dateCreate.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.dateCreate.lte = new Date(dateTo as string);
        }
      }

      if (city) {
        where.city = {
          contains: city as string,
          mode: 'insensitive'
        };
      }

      if (rk) {
        where.rk = {
          contains: rk as string,
          mode: 'insensitive'
        };
      }

      if (operatorId) {
        where.operatorId = parseInt(operatorId as string);
      }

      if (avitoName) {
        where.avitoName = {
          contains: avitoName as string,
          mode: 'insensitive'
        };
      }

      if (status) {
        where.status = status as string;
      }

      // Пагинация
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const skip = (pageNum - 1) * limitNum;

      // Сортировка
      const orderBy: any = {};
      const sortField = sortBy as string;
      orderBy[sortField] = sortOrder as 'asc' | 'desc';

      // Получение данных
      const [calls, total] = await Promise.all([
        prisma.call.findMany({
          where,
          skip,
          take: limitNum,
          orderBy,
          include: {
            operator: {
              select: {
                id: true,
                name: true,
                login: true
              }
            },
            avito: {
              select: {
                id: true,
                name: true
              }
            },
            phone: {
              select: {
                id: true,
                number: true,
                rk: true,
                city: true
              }
            },
            mango: {
              select: {
                id: true,
                callId: true,
                recordUrl: true,
                duration: true,
                direction: true
              }
            }
          }
        }),
        prisma.call.count({ where })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          calls,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          }
        }
      });

      logger.info(`Получен список звонков: страница ${pageNum}, всего ${total}`, {
        userId: req.user?.id,
        filters: { dateFrom, dateTo, city, rk, operatorId, avitoName, status }
      });

    } catch (error) {
      logger.error('Ошибка при получении списка звонков:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении списка звонков'
      });
    }
  },

  // Получить конкретный звонок по ID
  async getCall(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const call = await prisma.call.findUnique({
        where: { id: parseInt(id) },
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              login: true,
              city: true
            }
          },
          avito: {
            select: {
              id: true,
              name: true
            }
          },
          phone: {
            select: {
              id: true,
              number: true,
              rk: true,
              city: true
            }
          },
          mango: {
            select: {
              id: true,
              callId: true,
              recordUrl: true,
              duration: true,
              direction: true,
              mangoData: true
            }
          }
        }
      });

      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Звонок не найден'
        });
      }

      res.json({
        success: true,
        data: call
      });

      logger.info(`Получена информация о звонке ID: ${id}`, {
        userId: req.user?.id
      });

    } catch (error) {
      logger.error('Ошибка при получении звонка:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении звонка'
      });
    }
  },

  // Получить статистику звонков
  async getCallStats(req: Request, res: Response) {
    try {
      const {
        dateFrom,
        dateTo,
        city,
        operatorId
      } = req.query;

      // Построение условий фильтрации
      const where: any = {};

      if (dateFrom || dateTo) {
        where.dateCreate = {};
        if (dateFrom) {
          where.dateCreate.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.dateCreate.lte = new Date(dateTo as string);
        }
      }

      if (city) {
        where.city = city as string;
      }

      if (operatorId) {
        where.operatorId = parseInt(operatorId as string);
      }

      // Получение статистики
      const [
        totalCalls,
        answeredCalls,
        missedCalls,
        busyCalls,
        noAnswerCalls,
        callsByOperator,
        callsByCity,
        callsByStatus
      ] = await Promise.all([
        // Общее количество звонков
        prisma.call.count({ where }),
        
        // Отвеченные звонки
        prisma.call.count({ 
          where: { ...where, status: 'answered' }
        }),
        
        // Пропущенные звонки
        prisma.call.count({ 
          where: { ...where, status: 'missed' }
        }),
        
        // Занято
        prisma.call.count({ 
          where: { ...where, status: 'busy' }
        }),
        
        // Не отвечает
        prisma.call.count({ 
          where: { ...where, status: 'no_answer' }
        }),
        
        // Группировка по операторам
        prisma.call.groupBy({
          by: ['operatorId'],
          where,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        }),
        
        // Группировка по городам
        prisma.call.groupBy({
          by: ['city'],
          where,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        }),
        
        // Группировка по статусам
        prisma.call.groupBy({
          by: ['status'],
          where,
          _count: {
            id: true
          }
        })
      ]);

      // Дополнительная информация об операторах
      const operatorIds = callsByOperator.map(item => item.operatorId);
      const operators = await prisma.callcentreOperator.findMany({
        where: {
          id: { in: operatorIds }
        },
        select: {
          id: true,
          name: true,
          login: true
        }
      });

      // Обогащение данных операторов
      const enrichedOperatorStats = callsByOperator.map(item => {
        const operator = operators.find(op => op.id === item.operatorId);
        return {
          operatorId: item.operatorId,
          operatorName: operator?.name || 'Неизвестно',
          operatorLogin: operator?.login || 'Неизвестно',
          callsCount: item._count.id
        };
      });

      res.json({
        success: true,
        data: {
          summary: {
            total: totalCalls,
            answered: answeredCalls,
            missed: missedCalls,
            busy: busyCalls,
            noAnswer: noAnswerCalls,
            answerRate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0
          },
          byOperator: enrichedOperatorStats,
          byCity: callsByCity.map(item => ({
            city: item.city,
            callsCount: item._count.id
          })),
          byStatus: callsByStatus.map(item => ({
            status: item.status,
            callsCount: item._count.id
          }))
        }
      });

      logger.info('Получена статистика звонков', {
        userId: req.user?.id,
        filters: { dateFrom, dateTo, city, operatorId }
      });

    } catch (error) {
      logger.error('Ошибка при получении статистики звонков:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении статистики звонков'
      });
    }
  },

  // Создать новый звонок (для интеграции с телефонией)
  async createCall(req: Request, res: Response) {
    try {
      const {
        rk,
        city,
        avitoName,
        phoneClient,
        phoneAts,
        operatorId,
        status = 'answered',
        mangoCallId
      } = req.body;

      // Валидация обязательных полей
      if (!rk || !city || !phoneClient || !phoneAts || !operatorId) {
        return res.status(400).json({
          success: false,
          message: 'Отсутствуют обязательные поля: rk, city, phoneClient, phoneAts, operatorId'
        });
      }

      // Проверка существования оператора
      const operator = await prisma.callcentreOperator.findUnique({
        where: { id: operatorId }
      });

      if (!operator) {
        return res.status(404).json({
          success: false,
          message: 'Оператор не найден'
        });
      }

      const call = await prisma.call.create({
        data: {
          rk,
          city,
          avitoName,
          phoneClient,
          phoneAts,
          operatorId,
          status,
          mangoCallId,
          dateCreate: new Date()
        },
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              login: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: call,
        message: 'Звонок успешно создан'
      });

      logger.info(`Создан новый звонок ID: ${call.id}`, {
        userId: req.user?.id,
        callData: { rk, city, phoneClient, phoneAts, operatorId, status }
      });

    } catch (error) {
      logger.error('Ошибка при создании звонка:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при создании звонка'
      });
    }
  },

  // Обновить статус звонка
  async updateCallStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['answered', 'missed', 'busy', 'no_answer'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Недопустимый статус. Допустимые значения: ${validStatuses.join(', ')}`
        });
      }

      const call = await prisma.call.update({
        where: { id: parseInt(id) },
        data: { status },
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              login: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: call,
        message: 'Статус звонка успешно обновлен'
      });

      logger.info(`Обновлен статус звонка ID: ${id} на ${status}`, {
        userId: req.user?.id
      });

    } catch (error) {
      logger.error('Ошибка при обновлении статуса звонка:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении статуса звонка'
      });
    }
  }
};
