import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export const statsController = {
  // Получить статистику оператора
  async getOperatorStats(req: Request, res: Response) {
    try {
      const { operatorId } = req.params;
      const { startDate, endDate } = req.query;

      // Валидация параметров
      if (!operatorId) {
        return res.status(400).json({
          error: {
            message: 'ID оператора обязателен'
          }
        });
      }

      // Парсинг дат
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
      const end = endDate ? new Date(endDate as string + 'T23:59:59.999Z') : new Date(); // Добавляем время к конечной дате

      // Проверяем существование оператора
      const operator = await prisma.callcentreOperator.findUnique({
        where: { id: parseInt(operatorId) }
      });

      if (!operator) {
        return res.status(404).json({
          error: {
            message: 'Оператор не найден'
          }
        });
      }

      // Оптимизированная статистика звонков - один запрос вместо трех
      const callsStats = await prisma.call.groupBy({
        by: ['status'],
        where: {
          operatorId: parseInt(operatorId),
          dateCreate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        }
      });

      // Подсчитываем статистику из результата
      const totalCalls = callsStats.reduce((sum, stat) => sum + stat._count.id, 0);
      const acceptedCalls = callsStats
        .filter(stat => stat.status === 'answered')
        .reduce((sum, stat) => sum + stat._count.id, 0);
      const missedCalls = callsStats
        .filter(stat => ['missed', 'no_answer', 'busy'].includes(stat.status))
        .reduce((sum, stat) => sum + stat._count.id, 0);

      // Статистика заказов
      const ordersStats = await prisma.order.aggregate({
        where: {
          operatorNameId: parseInt(operatorId),
          createDate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        }
      });

      // Заказы по статусам
      const ordersByStatus = await prisma.order.groupBy({
        by: ['statusOrder'],
        where: {
          operatorNameId: parseInt(operatorId),
          createDate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        }
      });

      // Статистика по дням (используем переданные даты)
      const dailyStats = await prisma.call.groupBy({
        by: ['dateCreate'],
        where: {
          operatorId: parseInt(operatorId),
          dateCreate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          dateCreate: 'asc'
        }
      });

      // Конвертируем dailyStats в более удобный формат
      const dailyStatsFormatted = dailyStats.map(stat => ({
        date: stat.dateCreate.toISOString().split('T')[0],
        calls: stat._count?.id || 0
      }));

      // Статистика по городам
      const cityStats = await prisma.call.groupBy({
        by: ['city'],
        where: {
          operatorId: parseInt(operatorId),
          dateCreate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      // Статистика по РК
      const rkStats = await prisma.call.groupBy({
        by: ['rk'],
        where: {
          operatorId: parseInt(operatorId),
          dateCreate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      const response = {
        operator: {
          id: operator.id,
          name: operator.name,
          city: operator.city
        },
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        calls: {
          total: totalCalls,
          accepted: acceptedCalls,
          missed: missedCalls,
          acceptanceRate: totalCalls > 0 ? Math.round((acceptedCalls / totalCalls) * 100) : 0
        },
        orders: {
          total: ordersStats._count.id,
          byStatus: ordersByStatus.reduce((acc, item) => {
            acc[item.statusOrder] = item._count.id;
            return acc;
          }, {} as Record<string, number>)
        },
        dailyStats: dailyStatsFormatted,
        cityStats: cityStats.map(stat => ({
          city: stat.city || 'Не указан',
          calls: stat._count?.id || 0
        })),
        rkStats: rkStats.map(stat => ({
          rk: stat.rk || 'Не указан',
          calls: stat._count?.id || 0
        }))
      };

      logger.info(`Статистика оператора ${operator.name} получена`, {
        operatorId,
        period: `${start.toISOString()} - ${end.toISOString()}`,
        calls: response.calls.total,
        orders: response.orders.total
      });

      res.json(response);

    } catch (error) {
      logger.error('Ошибка получения статистики оператора', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operatorId: req.params.operatorId
      });

      res.status(500).json({
        error: {
          message: 'Внутренняя ошибка сервера'
        }
      });
    }
  },

  // Получить общую статистику (для админа)
  async getOverallStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      // Парсинг дат
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string + 'T23:59:59.999Z') : new Date(); // Добавляем время к конечной дате

      // Общая статистика звонков
      const totalCalls = await prisma.call.count({
        where: {
          dateCreate: {
            gte: start,
            lte: end
          }
        }
      });

      const acceptedCalls = await prisma.call.count({
        where: {
          dateCreate: {
            gte: start,
            lte: end
          },
          status: 'answered'
        }
      });

      const missedCalls = await prisma.call.count({
        where: {
          dateCreate: {
            gte: start,
            lte: end
          },
          status: {
            in: ['missed', 'no_answer', 'busy']
          }
        }
      });

      // Общая статистика заказов
      const totalOrders = await prisma.order.count({
        where: {
          createDate: {
            gte: start,
            lte: end
          }
        }
      });

      // Статистика по операторам
      const operatorStats = await prisma.call.groupBy({
        by: ['operatorId'],
        where: {
          dateCreate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      // Получаем имена операторов
      const operatorIds = operatorStats.map(stat => stat.operatorId);
      const operators = await prisma.callcentreOperator.findMany({
        where: {
          id: {
            in: operatorIds
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      const operatorMap = operators.reduce((acc, op) => {
        acc[op.id] = op.name;
        return acc;
      }, {} as Record<number, string>);

      // Статистика по городам
      const cityStats = await prisma.call.groupBy({
        by: ['city'],
        where: {
          dateCreate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      // Статистика по РК
      const rkStats = await prisma.call.groupBy({
        by: ['rk'],
        where: {
          dateCreate: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      const response = {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        calls: {
          total: totalCalls,
          accepted: acceptedCalls,
          missed: missedCalls,
          acceptanceRate: totalCalls > 0 ? Math.round((acceptedCalls / totalCalls) * 100) : 0
        },
        orders: {
          total: totalOrders
        },
        operatorStats: operatorStats.map(stat => ({
          operatorName: operatorMap[stat.operatorId] || 'Не указан',
          calls: stat._count?.id || 0
        })),
        cityStats: cityStats.map(stat => ({
          city: stat.city || 'Не указан',
          calls: stat._count?.id || 0
        })),
        rkStats: rkStats.map(stat => ({
          rk: stat.rk || 'Не указан',
          calls: stat._count?.id || 0
        }))
      };

      logger.info('Общая статистика получена', {
        period: `${start.toISOString()} - ${end.toISOString()}`,
        calls: response.calls.total,
        orders: response.orders.total
      });

      res.json(response);

    } catch (error) {
      logger.error('Ошибка получения общей статистики', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        error: {
          message: 'Внутренняя ошибка сервера'
        }
      });
    }
  },

  // Получить статистику по конкретному оператору (для самого оператора)
  async getMyStats(req: Request, res: Response) {
    try {
      const operatorId = (req as any).user?.id;
      
      if (!operatorId) {
        return res.status(401).json({
          error: {
            message: 'Не авторизован'
          }
        });
      }

      // Перенаправляем на getOperatorStats с ID текущего пользователя
      req.params.operatorId = operatorId.toString();
      return statsController.getOperatorStats(req, res);

    } catch (error) {
      logger.error('Ошибка получения личной статистики', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operatorId: (req as any).user?.id
      });

      res.status(500).json({
        error: {
          message: 'Внутренняя ошибка сервера'
        }
      });
    }
  }
};