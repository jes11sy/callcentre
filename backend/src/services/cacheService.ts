import { logger } from '../config/logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  // Set cache item
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, item);
    logger.debug(`Cache set: ${key}`);
  }

  // Get cache item
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return item.data;
  }

  // Delete cache item
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  // Clear cache by pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    logger.debug(`Cache cleared pattern "${pattern}": ${deletedCount} items`);
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Clean expired items
  cleanExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug(`Cache cleanup: ${cleanedCount} expired items removed`);
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Clean expired items every 10 minutes
setInterval(() => {
  cacheService.cleanExpired();
}, 10 * 60 * 1000);

// Cache key generators
export const cacheKeys = {
  // Statistics cache keys
  operatorStats: (operatorId: number, startDate: string, endDate: string) => 
    `stats:operator:${operatorId}:${startDate}:${endDate}`,
  
  overallStats: (startDate: string, endDate: string) => 
    `stats:overall:${startDate}:${endDate}`,
  
  // Employee cache keys
  employee: (id: number) => `employee:${id}`,
  employees: (page: number, limit: number, filters: string) => 
    `employees:${page}:${limit}:${filters}`,
  
  // Call cache keys
  call: (id: number) => `call:${id}`,
  calls: (page: number, limit: number, filters: string) => 
    `calls:${page}:${limit}:${filters}`,
  
  // Order cache keys
  order: (id: number) => `order:${id}`,
  orders: (page: number, limit: number, filters: string) => 
    `orders:${page}:${limit}:${filters}`,
  
  // Phone cache keys
  phone: (number: string) => `phone:${number}`,
  phones: (page: number, limit: number, filters: string) => 
    `phones:${page}:${limit}:${filters}`
};

// Cache TTL constants
export const cacheTTL = {
  STATS: 2 * 60 * 1000, // 2 minutes for statistics
  EMPLOYEES: 5 * 60 * 1000, // 5 minutes for employees
  CALLS: 1 * 60 * 1000, // 1 minute for calls (more dynamic)
  ORDERS: 2 * 60 * 1000, // 2 minutes for orders
  PHONES: 10 * 60 * 1000, // 10 minutes for phones (less dynamic)
  SINGLE_ITEM: 5 * 60 * 1000 // 5 minutes for single items
};
