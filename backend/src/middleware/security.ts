import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger';

// Rate limiting middleware
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: { message } },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
      });
      res.status(429).json({ error: { message } });
    }
  });
};

// General API rate limiting (relaxed for development)
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests per window (increased for development)
  'Too many requests from this IP, please try again later'
);

// Auth endpoints rate limiting (more restrictive)
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  20, // 20 login attempts per window (increased for development)
  'Too many authentication attempts, please try again later'
);

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    logger.warn(`Request size limit exceeded`, {
      ip: req.ip,
      contentLength,
      maxSize,
      url: req.url
    });
    return res.status(413).json({ 
      error: { message: 'Request entity too large' } 
    });
  }
  
  next();
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP || '')) {
      logger.warn(`Unauthorized IP access attempt`, {
        ip: clientIP,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ 
        error: { message: 'Access denied from this IP' } 
      });
    }
    
    next();
  };
};

// Session timeout middleware
export const sessionTimeout = (timeoutMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.iat) {
      const now = Date.now();
      const tokenIssuedAt = req.user.iat * 1000; // Convert to milliseconds
      
      if (now - tokenIssuedAt > timeoutMs) {
        logger.info(`Session timeout for user ${req.user.id}`);
        return res.status(401).json({ 
          error: { message: 'Session expired, please login again' } 
        });
      }
    }
    
    next();
  };
};
