import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { createError } from './errorHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔒 Auth failed: No Bearer token');
      throw createError('Access token is required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔒 Verifying token:', token.substring(0, 20) + '...');
    const payload = verifyToken(token);
    console.log('🔒 Token valid for user:', payload.login, payload.role);
    
    req.user = payload;
    next();
  } catch (error) {
    console.log('🔒 Auth error:', error instanceof Error ? error.message : 'Unknown error');
    next(createError('Invalid or expired token', 401));
  }
};

export const requireRole = (roles: ('admin' | 'operator')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

// Convenience middleware for admin-only routes
export const requireAdmin = requireRole(['admin']);

// Convenience middleware for operator and admin routes
export const requireOperator = requireRole(['admin', 'operator']);
