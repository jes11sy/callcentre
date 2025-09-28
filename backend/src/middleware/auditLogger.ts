import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface AuditLogData {
  userId?: number;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string | number;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  additionalData?: any;
}

export const auditLogger = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const auditData: AuditLogData = {
        userId: req.user?.id,
        userRole: req.user?.role,
        action,
        resource,
        resourceId: req.params.id || req.body.id,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? data : undefined,
        additionalData: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          body: req.method !== 'GET' ? req.body : undefined
        }
      };
      
      // Log audit event
      logger.info('Audit log', auditData);
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Specific audit loggers for different actions
export const auditLoggers = {
  // Authentication
  login: auditLogger('LOGIN', 'AUTH'),
  logout: auditLogger('LOGOUT', 'AUTH'),
  changePassword: auditLogger('CHANGE_PASSWORD', 'AUTH'),
  
  // Operators
  createOperator: auditLogger('CREATE', 'OPERATOR'),
  updateOperator: auditLogger('UPDATE', 'OPERATOR'),
  deleteOperator: auditLogger('DELETE', 'OPERATOR'),
  
  // Calls
  createCall: auditLogger('CREATE', 'CALL'),
  updateCall: auditLogger('UPDATE', 'CALL'),
  deleteCall: auditLogger('DELETE', 'CALL'),
  
  // Orders
  createOrder: auditLogger('CREATE', 'ORDER'),
  updateOrder: auditLogger('UPDATE', 'ORDER'),
  deleteOrder: auditLogger('DELETE', 'ORDER'),
  
  // Statistics
  viewStats: auditLogger('VIEW', 'STATISTICS'),
  
  // Admin actions
  adminAction: auditLogger('ADMIN_ACTION', 'SYSTEM')
};

// Middleware to log failed authentication attempts
export const logFailedAuth = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (res.statusCode === 401) {
      const auditData: AuditLogData = {
        action: 'FAILED_LOGIN',
        resource: 'AUTH',
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
        success: false,
        errorMessage: 'Authentication failed',
        additionalData: {
          method: req.method,
          url: req.url,
          body: req.body
        }
      };
      
      logger.warn('Failed authentication attempt', auditData);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware to log sensitive operations
export const logSensitiveOperation = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const auditData: AuditLogData = {
        userId: req.user?.id,
        userRole: req.user?.role,
        action: operation,
        resource: 'SENSITIVE',
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? data : undefined,
        additionalData: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode
        }
      };
      
      logger.warn('Sensitive operation', auditData);
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};
