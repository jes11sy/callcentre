import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import { logger } from '../config/logger';

// Получить всех операторов
export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.callcentreOperator.findMany({
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
            orders: true,
            calls: true,
          },
        },
        // Exclude password for security
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      message: 'Employees retrieved successfully',
      data: employees,
      count: employees.length,
    });
  } catch (error: any) {
    logger.error(`Error fetching employees: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error fetching employees' } });
  }
};

// Получить сотрудника по ID
export const getEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const employee = await prisma.callcentreOperator.findUnique({
      where: { id: parseInt(id) },
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
      },
    });

    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    res.status(200).json({
      message: 'Employee retrieved successfully',
      employee,
    });
  } catch (error: any) {
    logger.error(`Error fetching employee ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error fetching employee' } });
  }
};

// Создать нового сотрудника
export const createEmployee = async (req: Request, res: Response) => {
  const {
    name,
    login,
    password,
    city = 'Не указан', // Default city if not provided
    status = 'active',
    statusWork = 'offline', // Default work status
    note,
  } = req.body;

  // Handle uploaded files
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const passportPhoto = files?.passportPhoto?.[0];
  const contractPhoto = files?.contractPhoto?.[0];

  // Validation - city is now optional with default value
  if (!name || !login || !password) {
    return res.status(400).json({
      error: { message: 'Name, login, and password are required' },
    });
  }

  try {
    // Check if login already exists
    const existingEmployee = await prisma.callcentreOperator.findUnique({
      where: { login },
    });

    if (existingEmployee) {
      return res.status(400).json({
        error: { message: 'Login already exists' },
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create employee
    const newEmployee = await prisma.callcentreOperator.create({
      data: {
        name,
        login,
        password: hashedPassword,
        city,
        status,
        statusWork,
        passport: passportPhoto?.filename || null,
        contract: contractPhoto?.filename || null,
        note: note || null,
        dateCreate: new Date(),
      },
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
      },
    });

    logger.info(`New employee created: ${newEmployee.name} (${newEmployee.login}) by admin ${req.user?.login}`);
    res.status(201).json({
      message: 'Employee created successfully',
      employee: newEmployee,
    });
  } catch (error: any) {
    logger.error(`Error creating employee: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error creating employee' } });
  }
};

// Обновить сотрудника
export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    login,
    password,
    city,
    status,
    statusWork,
    note,
  } = req.body;

  // Handle uploaded files
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const passportPhoto = files?.passportPhoto?.[0];
  const contractPhoto = files?.contractPhoto?.[0];

  try {
    // Check if employee exists
    const existingEmployee = await prisma.callcentreOperator.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    // Check if new login conflicts with existing (if login is being changed)
    if (login && login !== existingEmployee.login) {
      const loginConflict = await prisma.callcentreOperator.findUnique({
        where: { login },
      });

      if (loginConflict) {
        return res.status(400).json({
          error: { message: 'Login already exists' },
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...(name && { name }),
      ...(login && { login }),
      ...(city && { city }),
      ...(status && { status }),
      ...(statusWork && { statusWork }),
      ...(note !== undefined && { note: note || null }),
    };

    // Update file paths if new files uploaded
    if (passportPhoto) {
      updateData.passport = passportPhoto.filename;
    }
    if (contractPhoto) {
      updateData.contract = contractPhoto.filename;
    }

    // Hash new password if provided
    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password);
    }

    // Update employee
    const updatedEmployee = await prisma.callcentreOperator.update({
      where: { id: parseInt(id) },
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
            orders: true,
            calls: true,
          },
        },
      },
    });

    logger.info(`Employee updated: ${updatedEmployee.name} (${updatedEmployee.login}) by admin ${req.user?.login}`);
    res.status(200).json({
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  } catch (error: any) {
    logger.error(`Error updating employee ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error updating employee' } });
  }
};

// Удалить сотрудника
export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if employee exists
    const existingEmployee = await prisma.callcentreOperator.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    // Check if employee has associated orders or calls (optional business logic)
    const associatedOrders = await prisma.order.count({
      where: { operatorNameId: parseInt(id) },
    });

    const associatedCalls = await prisma.call.count({
      where: { operatorId: parseInt(id) },
    });

    if (associatedOrders > 0 || associatedCalls > 0) {
      return res.status(400).json({
        error: {
          message: 'Cannot delete employee with associated orders or calls. Consider deactivating instead.',
          details: {
            orders: associatedOrders,
            calls: associatedCalls,
          },
        },
      });
    }

    // Delete employee
    await prisma.callcentreOperator.delete({
      where: { id: parseInt(id) },
    });

    logger.info(`Employee deleted: ${existingEmployee.name} (${existingEmployee.login}) by admin ${req.user?.login}`);
    res.status(200).json({
      message: 'Employee deleted successfully',
      deletedEmployee: {
        id: existingEmployee.id,
        name: existingEmployee.name,
        login: existingEmployee.login,
      },
    });
  } catch (error: any) {
    logger.error(`Error deleting employee ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error deleting employee' } });
  }
};

// Изменить статус сотрудника (активировать/деактивировать)
export const toggleEmployeeStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      error: { message: 'Valid status (active/inactive) is required' },
    });
  }

  try {
    const employee = await prisma.callcentreOperator.findUnique({
      where: { id: parseInt(id) },
    });

    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    const updatedEmployee = await prisma.callcentreOperator.update({
      where: { id: parseInt(id) },
      data: { status },
      select: {
        id: true,
        name: true,
        login: true,
        status: true,
      },
    });

    logger.info(`Employee status changed: ${updatedEmployee.name} (${updatedEmployee.login}) -> ${status} by admin ${req.user?.login}`);
    res.status(200).json({
      message: `Employee ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      employee: updatedEmployee,
    });
  } catch (error: any) {
    logger.error(`Error changing employee status ${id}: ${error.message}`, error);
    res.status(500).json({ error: { message: 'Internal server error changing employee status' } });
  }
};

// Обновить статус работы оператора
export const updateWorkStatus = async (req: Request, res: Response) => {
  try {
    const { statusWork } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Не авторизован' }
      });
    }

    if (!statusWork || !['online', 'offline', 'break'].includes(statusWork)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Неверный статус работы. Допустимые значения: online, offline, break' }
      });
    }

    const updatedOperator = await prisma.callcentreOperator.update({
      where: { id: userId },
      data: { statusWork },
      select: {
        id: true,
        name: true,
        login: true,
        statusWork: true,
        city: true
      }
    });

    logger.info(`Work status updated: ${updatedOperator.name} (${updatedOperator.login}) -> ${statusWork}`);
    
    res.status(200).json({
      success: true,
      message: 'Статус работы обновлен',
      data: updatedOperator
    });

  } catch (error: any) {
    logger.error(`Error updating work status: ${error.message}`, error);
    res.status(500).json({
      success: false,
      error: { message: 'Ошибка сервера при обновлении статуса работы' }
    });
  }
};