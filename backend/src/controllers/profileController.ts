import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const profileController = {
  // Получить профиль текущего пользователя
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId) {
        return res.status(401).json({
          error: {
            message: 'Не авторизован'
          }
        });
      }

      let profile;

      if (userRole === 'admin') {
        // Получаем профиль админа
        profile = await prisma.callcentreAdmin.findUnique({
          where: { id: userId },
          select: {
            id: true,
            login: true,
            note: true,
            createdAt: true,
            updatedAt: true
          }
        });

        if (!profile) {
          return res.status(404).json({
            error: {
              message: 'Профиль администратора не найден'
            }
          });
        }

        // Добавляем роль
        (profile as any).role = 'admin';
        (profile as any).name = 'Администратор';
        (profile as any).city = 'Все города';

      } else {
        // Получаем профиль оператора
        profile = await prisma.callcentreOperator.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            login: true,
            city: true,
            status: true,
            statusWork: true,
            passport: true,
            contract: true,
            dateCreate: true,
            note: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                calls: true,
                orders: true
              }
            }
          }
        });

        if (!profile) {
          return res.status(404).json({
            error: {
              message: 'Профиль оператора не найден'
            }
          });
        }

        // Добавляем роль
        (profile as any).role = 'operator';
      }

      logger.info(`Профиль пользователя ${profile.login} получен`, {
        userId,
        role: userRole
      });

      res.json(profile);

    } catch (error) {
      logger.error('Ошибка получения профиля', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: (req as any).user?.id
      });

      res.status(500).json({
        error: {
          message: 'Внутренняя ошибка сервера'
        }
      });
    }
  },

  // Обновить профиль текущего пользователя
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const { name, city, statusWork, note, currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          error: {
            message: 'Не авторизован'
          }
        });
      }

      let updatedProfile;

      if (userRole === 'admin') {
        // Обновляем профиль админа
        const updateData: any = {};
        
        if (note !== undefined) {
          updateData.note = note;
        }

        // Если меняем пароль
        if (newPassword && currentPassword) {
          const admin = await prisma.callcentreAdmin.findUnique({
            where: { id: userId }
          });

          if (!admin) {
            return res.status(404).json({
              error: {
                message: 'Администратор не найден'
              }
            });
          }

          // Проверяем текущий пароль
          const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
          if (!isCurrentPasswordValid) {
            return res.status(400).json({
              error: {
                message: 'Неверный текущий пароль'
              }
            });
          }

          // Хешируем новый пароль
          const hashedNewPassword = await bcrypt.hash(newPassword, 10);
          updateData.password = hashedNewPassword;
        }

        updatedProfile = await prisma.callcentreAdmin.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            login: true,
            note: true,
            createdAt: true,
            updatedAt: true
          }
        });

        (updatedProfile as any).role = 'admin';
        (updatedProfile as any).name = 'Администратор';
        (updatedProfile as any).city = 'Все города';

      } else {
        // Обновляем профиль оператора
        const updateData: any = {};
        
        if (name !== undefined) {
          updateData.name = name;
        }
        
        if (city !== undefined) {
          updateData.city = city;
        }
        
        if (statusWork !== undefined) {
          updateData.statusWork = statusWork;
        }
        
        if (note !== undefined) {
          updateData.note = note;
        }

        // Если меняем пароль
        if (newPassword && currentPassword) {
          const operator = await prisma.callcentreOperator.findUnique({
            where: { id: userId }
          });

          if (!operator) {
            return res.status(404).json({
              error: {
                message: 'Оператор не найден'
              }
            });
          }

          // Проверяем текущий пароль
          const isCurrentPasswordValid = await bcrypt.compare(currentPassword, operator.password);
          if (!isCurrentPasswordValid) {
            return res.status(400).json({
              error: {
                message: 'Неверный текущий пароль'
              }
            });
          }

          // Хешируем новый пароль
          const hashedNewPassword = await bcrypt.hash(newPassword, 10);
          updateData.password = hashedNewPassword;
        }

        updatedProfile = await prisma.callcentreOperator.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            name: true,
            login: true,
            city: true,
            status: true,
            statusWork: true,
            passport: true,
            contract: true,
            dateCreate: true,
            note: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                calls: true,
                orders: true
              }
            }
          }
        });

        (updatedProfile as any).role = 'operator';
      }

      logger.info(`Профиль пользователя ${updatedProfile.login} обновлен`, {
        userId,
        role: userRole,
        updatedFields: Object.keys(req.body)
      });

      res.json(updatedProfile);

    } catch (error) {
      logger.error('Ошибка обновления профиля', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: (req as any).user?.id
      });

      res.status(500).json({
        error: {
          message: 'Внутренняя ошибка сервера'
        }
      });
    }
  },

  // Получить статистику профиля (для операторов)
  async getProfileStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId) {
        return res.status(401).json({
          error: {
            message: 'Не авторизован'
          }
        });
      }

      if (userRole !== 'operator') {
        return res.status(403).json({
          error: {
            message: 'Доступно только для операторов'
          }
        });
      }

      // Получаем базовую статистику оператора
      const operator = await prisma.callcentreOperator.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          city: true,
          dateCreate: true,
          _count: {
            select: {
              calls: true,
              orders: true
            }
          }
        }
      });

      if (!operator) {
        return res.status(404).json({
          error: {
            message: 'Оператор не найден'
          }
        });
      }

      // Статистика за текущий месяц
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyStats = await prisma.call.aggregate({
        where: {
          operatorId: userId,
          dateCreate: {
            gte: currentMonth
          }
        },
        _count: {
          id: true
        }
      });

      const monthlyOrders = await prisma.order.count({
        where: {
          operatorNameId: userId,
          createDate: {
            gte: currentMonth
          }
        }
      });

      // Статистика за сегодня
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayStats = await prisma.call.aggregate({
        where: {
          operatorId: userId,
          dateCreate: {
            gte: today
          }
        },
        _count: {
          id: true
        }
      });

      const todayOrders = await prisma.order.count({
        where: {
          operatorNameId: userId,
          createDate: {
            gte: today
          }
        }
      });

      const response = {
        operator: {
          id: operator.id,
          name: operator.name,
          city: operator.city,
          startDate: operator.dateCreate
        },
        total: {
          calls: operator._count.calls,
          orders: operator._count.orders
        },
        monthly: {
          calls: monthlyStats._count?.id || 0,
          orders: monthlyOrders
        },
        today: {
          calls: todayStats._count?.id || 0,
          orders: todayOrders
        }
      };

      logger.info(`Статистика профиля оператора ${operator.name} получена`, {
        userId,
        totalCalls: response.total.calls,
        totalOrders: response.total.orders
      });

      res.json(response);

    } catch (error) {
      logger.error('Ошибка получения статистики профиля', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: (req as any).user?.id
      });

      res.status(500).json({
        error: {
          message: 'Внутренняя ошибка сервера'
        }
      });
    }
  }
};
