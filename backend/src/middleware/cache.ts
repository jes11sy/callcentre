import { Request, Response, NextFunction } from 'express';
import { cacheService, cacheKeys, cacheTTL } from '../services/cacheService';
import { logger } from '../config/logger';

// Cache middleware for GET requests
export const cacheMiddleware = (keyGenerator: (req: Request) => string, ttl?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      const cachedData = cacheService.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Store original res.json to intercept response
      const originalJson = res.json;
      res.json = function(data: any) {
        // Cache successful responses (status 200)
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, data, ttl);
          logger.debug(`Cache set for key: ${cacheKey}`);
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Specific cache middleware for different endpoints
export const cacheMiddlewareFor = {
  // Statistics endpoints
  operatorStats: cacheMiddleware(
    (req) => cacheKeys.operatorStats(
      parseInt(req.params.operatorId),
      req.query.startDate as string || '',
      req.query.endDate as string || ''
    ),
    cacheTTL.STATS
  ),

  overallStats: cacheMiddleware(
    (req) => cacheKeys.overallStats(
      req.query.startDate as string || '',
      req.query.endDate as string || ''
    ),
    cacheTTL.STATS
  ),

  myStats: cacheMiddleware(
    (req) => cacheKeys.operatorStats(
      (req as any).user?.id || 0,
      req.query.startDate as string || '',
      req.query.endDate as string || ''
    ),
    cacheTTL.STATS
  ),

  // Employee endpoints
  employee: cacheMiddleware(
    (req) => cacheKeys.employee(parseInt(req.params.id)),
    cacheTTL.SINGLE_ITEM
  ),

  employees: cacheMiddleware(
    (req) => cacheKeys.employees(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
      JSON.stringify(req.query)
    ),
    cacheTTL.EMPLOYEES
  ),

  // Call endpoints
  call: cacheMiddleware(
    (req) => cacheKeys.call(parseInt(req.params.id)),
    cacheTTL.SINGLE_ITEM
  ),

  calls: cacheMiddleware(
    (req) => cacheKeys.calls(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
      JSON.stringify(req.query)
    ),
    cacheTTL.CALLS
  ),

  // Order endpoints
  order: cacheMiddleware(
    (req) => cacheKeys.order(parseInt(req.params.id)),
    cacheTTL.SINGLE_ITEM
  ),

  orders: cacheMiddleware(
    (req) => cacheKeys.orders(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
      JSON.stringify(req.query)
    ),
    cacheTTL.ORDERS
  ),

  // Phone endpoints
  phone: cacheMiddleware(
    (req) => cacheKeys.phone(req.params.number),
    cacheTTL.SINGLE_ITEM
  ),

  phones: cacheMiddleware(
    (req) => cacheKeys.phones(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
      JSON.stringify(req.query)
    ),
    cacheTTL.PHONES
  )
};

// Cache invalidation middleware
export const invalidateCache = (patterns: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Invalidate cache on successful mutations (POST, PUT, DELETE)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheService.clearPattern(pattern);
        });
        logger.debug(`Cache invalidated for patterns: ${patterns.join(', ')}`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation patterns for different entities
export const cacheInvalidation = {
  // Invalidate all employee-related cache
  employees: invalidateCache(['employee:', 'employees:']),
  
  // Invalidate all call-related cache
  calls: invalidateCache(['call:', 'calls:', 'stats:']),
  
  // Invalidate all order-related cache
  orders: invalidateCache(['order:', 'orders:', 'stats:']),
  
  // Invalidate all phone-related cache
  phones: invalidateCache(['phone:', 'phones:']),
  
  // Invalidate all statistics cache
  stats: invalidateCache(['stats:'])
};
