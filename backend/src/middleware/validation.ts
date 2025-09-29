import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { createError } from './errorHandler';

// Validation result handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));
    
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: errorMessages
      }
    });
  }
  next();
};

// Common validation rules
export const commonValidations = {
  id: param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
    
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  phone: body('phone')
    .isMobilePhone('ru-RU')
    .withMessage('Valid Russian phone number is required'),
    
  date: body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
    
  positiveInt: body('value')
    .isInt({ min: 0 })
    .withMessage('Value must be a non-negative integer'),
    
  string: body('value')
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('String must be between 1 and 255 characters'),
    
  optionalString: body('value')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('String must not exceed 255 characters')
};

// Auth validation rules
export const authValidation = {
  login: [
    body('login')
      .notEmpty()
      .withMessage('Login is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Login must be between 3 and 50 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    handleValidationErrors
  ]
};

// Operator validation rules
export const operatorValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('login')
      .notEmpty()
      .withMessage('Login is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Login must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Login can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('city')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive'),
    body('statusWork')
      .optional()
      .isIn(['online', 'offline', 'busy'])
      .withMessage('Work status must be online, offline, or busy'),
    handleValidationErrors
  ],
  
  update: [
    param('id').isInt({ min: 1 }).withMessage('Valid operator ID is required'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('city')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive'),
    body('statusWork')
      .optional()
      .isIn(['online', 'offline', 'busy'])
      .withMessage('Work status must be online, offline, or busy'),
    handleValidationErrors
  ]
};

// Call validation rules
export const callValidation = {
  create: [
    body('phoneClient')
      .notEmpty()
      .withMessage('Client phone is required')
      .isMobilePhone('ru-RU')
      .withMessage('Valid Russian phone number is required'),
    body('phoneAts')
      .notEmpty()
      .withMessage('ATS phone is required')
      .isMobilePhone('ru-RU')
      .withMessage('Valid Russian phone number is required'),
    body('city')
      .notEmpty()
      .withMessage('City is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('rk')
      .notEmpty()
      .withMessage('RK is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('RK must be between 1 and 50 characters'),
    body('status')
      .isIn(['answered', 'missed', 'no_answer', 'completed', 'assigned'])
      .withMessage('Invalid call status'),
    handleValidationErrors
  ],
  
  update: [
    param('id').isInt({ min: 1 }).withMessage('Valid call ID is required'),
    body('status')
      .optional()
      .isIn(['answered', 'missed', 'no_answer', 'completed', 'assigned'])
      .withMessage('Invalid call status'),
    handleValidationErrors
  ]
};

// Order validation rules
export const orderValidation = {
  createFromCall: [
    body('callId')
      .notEmpty()
      .withMessage('Call ID is required')
      .isInt({ min: 1 })
      .withMessage('Call ID must be a positive integer'),
    body('rk')
      .isIn(['Авито', 'Листовка'])
      .withMessage('Недопустимый РК. Допустимые: Авито, Листовка'),
    body('avitoName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Авито аккаунт не должен превышать 100 символов'),
    body('city')
      .notEmpty()
      .withMessage('City is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('City must be between 2 and 50 characters'),
    body('clientName')
      .notEmpty()
      .withMessage('Client name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Client name must be between 2 and 100 characters'),
    body('address')
      .notEmpty()
      .withMessage('Address is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Address must be between 3 and 255 characters'),
    body('typeOrder')
      .isIn(['Впервые', 'Повтор', 'Гарантия'])
      .withMessage('Недопустимый тип заявки. Допустимые: Впервые, Повтор, Гарантия'),
    body('typeEquipment')
      .isIn(['КП', 'БТ', 'МНЧ'])
      .withMessage('Invalid equipment type'),
    body('problem')
      .notEmpty()
      .withMessage('Problem description is required')
      .isLength({ min: 3, max: 1000 })
      .withMessage('Problem description must be between 3 and 1000 characters'),
    body('dateMeeting')
      .notEmpty()
      .withMessage('Meeting date is required')
      .isISO8601()
      .withMessage('Valid ISO 8601 date format is required'),
    body('masterId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Master ID must be a positive integer'),
    handleValidationErrors
  ],
  create: [
    body('phone')
      .notEmpty()
      .withMessage('Phone is required')
      .isMobilePhone('ru-RU')
      .withMessage('Valid Russian phone number is required'),
    body('clientName')
      .notEmpty()
      .withMessage('Client name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Client name must be between 2 and 100 characters'),
    body('address')
      .notEmpty()
      .withMessage('Address is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Address must be between 3 and 255 characters'),
    body('typeOrder')
      .isIn(['Впервые', 'Повтор', 'Гарантия'])
      .withMessage('Недопустимый тип заявки. Допустимые: Впервые, Повтор, Гарантия'),
    body('typeEquipment')
      .isIn(['КП', 'БТ', 'МНЧ'])
      .withMessage('Invalid equipment type'),
    body('problem')
      .notEmpty()
      .withMessage('Problem description is required')
      .isLength({ min: 5, max: 1000 })
      .withMessage('Problem description must be between 5 and 1000 characters'),
    body('dateMeeting')
      .isISO8601()
      .withMessage('Valid meeting date is required'),
    body('statusOrder')
      .optional()
      .isIn(['Ожидает', 'Принял', 'В пути', 'В работе', 'Готово', 'Отказ', 'Модерн', 'Незаказ'])
      .withMessage('Invalid order status'),
    handleValidationErrors
  ],
  
  update: [
    param('id').isInt({ min: 1 }).withMessage('Valid order ID is required'),
    body('statusOrder')
      .optional()
      .isIn(['Ожидает', 'Принял', 'В пути', 'В работе', 'Готово', 'Отказ', 'Модерн', 'Незаказ'])
      .withMessage('Invalid order status'),
    body('result')
      .optional()
      .isDecimal()
      .withMessage('Result must be a valid decimal number'),
    body('expenditure')
      .optional()
      .isDecimal()
      .withMessage('Expenditure must be a valid decimal number'),
    handleValidationErrors
  ]
};

// Stats validation rules
export const statsValidation = {
  getStats: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO 8601 format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO 8601 format'),
    handleValidationErrors
  ]
};
