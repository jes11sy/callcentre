import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// Получить все номера телефонов
export const getAllPhones = async (req: Request, res: Response) => {
  try {
    const phones = await prisma.phone.findMany({
      select: {
        id: true,
        number: true,
        rk: true,
        city: true,
        avitoName: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            calls: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      message: 'Phone numbers retrieved successfully',
      phones,
      count: phones.length,
    });
  } catch (error: any) {
    logger.error(`Error fetching phone numbers: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error fetching phone numbers' } });
  }
};

// Получить номер телефона по ID
export const getPhoneById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const phone = await prisma.phone.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        number: true,
        rk: true,
        city: true,
        avitoName: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            calls: true,
          },
        },
      },
    });

    if (!phone) {
      return res.status(404).json({ error: { message: 'Phone number not found' } });
    }

    res.status(200).json({
      message: 'Phone number retrieved successfully',
      phone,
    });
  } catch (error: any) {
    logger.error(`Error fetching phone number ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error fetching phone number' } });
  }
};

// Создать новый номер телефона
export const createPhone = async (req: Request, res: Response) => {
  const { number, rk, city, avitoName } = req.body;

  // Validation
  if (!number) {
    return res.status(400).json({
      error: { message: 'Phone number is required' },
    });
  }

  try {
    // Check if phone number already exists
    const existingPhone = await prisma.phone.findUnique({
      where: { number },
    });

    if (existingPhone) {
      return res.status(400).json({
        error: { message: 'Phone number already exists' },
      });
    }

    // Create phone number
    const newPhone = await prisma.phone.create({
      data: {
        number,
        rk,
        city,
        avitoName,
      },
      select: {
        id: true,
        number: true,
        rk: true,
        city: true,
        avitoName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`New phone number created: ${newPhone.number} by admin ${req.user?.login}`);
    res.status(201).json({
      message: 'Phone number created successfully',
      phone: newPhone,
    });
  } catch (error: any) {
    logger.error(`Error creating phone number: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error creating phone number' } });
  }
};

// Обновить номер телефона
export const updatePhone = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { number, rk, city, avitoName } = req.body;

  try {
    // Check if phone exists
    const existingPhone = await prisma.phone.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPhone) {
      return res.status(404).json({ error: { message: 'Phone number not found' } });
    }

    // Check if new number conflicts with existing (if number is being changed)
    if (number && number !== existingPhone.number) {
      const numberConflict = await prisma.phone.findUnique({
        where: { number },
      });

      if (numberConflict) {
        return res.status(400).json({
          error: { message: 'Phone number already exists' },
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...(number && { number }),
      ...(rk !== undefined && { rk }),
      ...(city !== undefined && { city }),
      ...(avitoName !== undefined && { avitoName }),
    };

    // Update phone
    const updatedPhone = await prisma.phone.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        number: true,
        rk: true,
        city: true,
        avitoName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Phone number updated: ${updatedPhone.number} by admin ${req.user?.login}`);
    res.status(200).json({
      message: 'Phone number updated successfully',
      phone: updatedPhone,
    });
  } catch (error: any) {
    logger.error(`Error updating phone number ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error updating phone number' } });
  }
};

// Удалить номер телефона
export const deletePhone = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if phone exists
    const existingPhone = await prisma.phone.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPhone) {
      return res.status(404).json({ error: { message: 'Phone number not found' } });
    }

    // Check if phone has associated calls
    const associatedCalls = await prisma.call.count({
      where: { phoneAts: existingPhone.number },
    });

    if (associatedCalls > 0) {
      return res.status(400).json({
        error: {
          message: 'Cannot delete phone number with associated calls',
          details: {
            calls: associatedCalls,
          },
        },
      });
    }

    // Delete phone
    await prisma.phone.delete({
      where: { id: parseInt(id) },
    });

    logger.info(`Phone number deleted: ${existingPhone.number} by admin ${req.user?.login}`);
    res.status(200).json({
      message: 'Phone number deleted successfully',
      deletedPhone: {
        id: existingPhone.id,
        number: existingPhone.number,
      },
    });
  } catch (error: any) {
    logger.error(`Error deleting phone number ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error deleting phone number' } });
  }
};

// Получить статистику по номеру телефона
export const getPhoneStats = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const phone = await prisma.phone.findUnique({
      where: { id: parseInt(id) },
    });

    if (!phone) {
      return res.status(404).json({ error: { message: 'Phone number not found' } });
    }

    // Get call statistics
    const totalCalls = await prisma.call.count({
      where: { phoneAts: phone.number },
    });

    const callsByStatus = await prisma.call.groupBy({
      by: ['status'],
      where: { phoneAts: phone.number },
      _count: {
        id: true,
      },
    });

    // Get calls by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCalls = await prisma.call.count({
      where: {
        phoneAts: phone.number,
        dateCreate: {
          gte: thirtyDaysAgo,
        },
      },
    });

    logger.info(`Phone stats retrieved for: ${phone.number} by admin ${req.user?.login}`);
    res.status(200).json({
      message: 'Phone statistics retrieved successfully',
      phone: {
        id: phone.id,
        number: phone.number,
        rk: phone.rk,
        city: phone.city,
      },
      stats: {
        totalCalls,
        recentCalls,
        callsByStatus: callsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error: any) {
    logger.error(`Error getting phone stats ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error getting phone statistics' } });
  }
};
