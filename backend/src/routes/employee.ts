import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  updateWorkStatus,
  getEmployeePassport,
  getEmployeeContract,
} from '../controllers/employeeController';
import { requireAdmin, authenticate } from '../middleware/auth';
import { uploadEmployeeFiles } from '../middleware/upload';
import { operatorValidation } from '../middleware/validation';
import { auditLoggers } from '../middleware/auditLogger';
import { cacheMiddlewareFor, cacheInvalidation } from '../middleware/cache';

const router = Router();

// PATCH /api/employees/work-status - Update work status (for operators)
// Этот роут доступен для операторов, не требует админских прав
router.patch('/work-status', authenticate, updateWorkStatus);

// All other employee routes require admin privileges
router.use(requireAdmin);

// GET /api/employees - Get all employees
router.get('/', cacheMiddlewareFor.employees, getAllEmployees);

// GET /api/employees/:id - Get employee by ID
router.get('/:id', operatorValidation.update[0], cacheMiddlewareFor.employee, getEmployeeById);

// POST /api/employees - Create new employee
router.post('/', uploadEmployeeFiles, operatorValidation.create, cacheInvalidation.employees, auditLoggers.createOperator, createEmployee);

// PUT /api/employees/:id - Update employee
router.put('/:id', uploadEmployeeFiles, operatorValidation.update, cacheInvalidation.employees, auditLoggers.updateOperator, updateEmployee);

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', operatorValidation.update[0], cacheInvalidation.employees, auditLoggers.deleteOperator, deleteEmployee);

// PATCH /api/employees/:id/status - Toggle employee status
router.patch('/:id/status', operatorValidation.update[0], cacheInvalidation.employees, auditLoggers.updateOperator, toggleEmployeeStatus);

// GET /api/employees/:id/passport - Get employee passport photo
router.get('/:id/passport', operatorValidation.update[0], getEmployeePassport);

// GET /api/employees/:id/contract - Get employee contract photo
router.get('/:id/contract', operatorValidation.update[0], getEmployeeContract);

export default router;
