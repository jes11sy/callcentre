import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OptimizedPaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  where?: any;
  include?: any;
}

export interface OptimizedPaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Оптимизированная пагинация с использованием cursor-based подхода для больших наборов данных
export class QueryOptimizer {
  // Стандартная пагинация с offset (для небольших наборов данных)
  static async paginate<T>(
    model: any,
    options: OptimizedPaginationOptions
  ): Promise<OptimizedPaginationResult<T>> {
    const { page, limit, sortBy, sortOrder, where, include } = options;
    
    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: sortOrder };

    // Параллельное выполнение запросов
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include
      }),
      model.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Cursor-based пагинация (для больших наборов данных)
  static async paginateWithCursor<T>(
    model: any,
    options: OptimizedPaginationOptions & { cursor?: string }
  ): Promise<OptimizedPaginationResult<T> & { nextCursor?: string }> {
    const { limit, sortBy, sortOrder, where, include, cursor } = options;
    
    const orderBy = { [sortBy]: sortOrder };
    let whereClause = where;

    // Добавляем условие для cursor-based пагинации
    if (cursor) {
      const cursorCondition = sortOrder === 'desc' 
        ? { [sortBy]: { lt: cursor } }
        : { [sortBy]: { gt: cursor } };
      
      whereClause = where 
        ? { AND: [where, cursorCondition] }
        : cursorCondition;
    }

    const data = await model.findMany({
      where: whereClause,
      take: limit + 1, // Берем на один больше, чтобы определить есть ли следующая страница
      orderBy,
      include
    });

    const hasNext = data.length > limit;
    if (hasNext) {
      data.pop(); // Убираем лишний элемент
    }

    const nextCursor = hasNext && data.length > 0 
      ? (data[data.length - 1] as any)[sortBy] 
      : undefined;

    return {
      data,
      pagination: {
        page: 1, // Cursor-based пагинация не использует номера страниц
        limit,
        total: -1, // Общее количество не вычисляется для производительности
        totalPages: -1,
        hasNext,
        hasPrev: !!cursor
      },
      nextCursor
    };
  }

  // Оптимизированный поиск с использованием полнотекстового поиска
  static async fullTextSearch<T>(
    model: any,
    searchTerm: string,
    searchFields: string[],
    options: Omit<OptimizedPaginationOptions, 'sortBy'> & { sortBy?: string }
  ): Promise<OptimizedPaginationResult<T>> {
    const { page, limit, sortOrder, where, include } = options;
    
    // Создаем условие для полнотекстового поиска
    const searchConditions = searchFields.map(field => ({
      [field]: {
        search: searchTerm
      }
    }));

    const searchWhere = {
      AND: [
        where,
        { OR: searchConditions }
      ]
    };

    return this.paginate(model, {
      ...options,
      where: searchWhere,
      sortBy: options.sortBy || 'id'
    });
  }

  // Оптимизированная группировка с агрегацией
  static async optimizedGroupBy<T>(
    model: any,
    groupBy: string[],
    aggregations: Record<string, any>,
    where?: any,
    orderBy?: any
  ): Promise<T[]> {
    return model.groupBy({
      by: groupBy,
      where,
      ...aggregations,
      orderBy
    });
  }

  // Batch операции для массовых обновлений
  static async batchUpdate<T>(
    model: any,
    updates: Array<{ where: any; data: any }>
  ): Promise<{ count: number }> {
    const results = await Promise.all(
      updates.map(update => 
        model.updateMany({
          where: update.where,
          data: update.data
        })
      )
    );

    const totalCount = results.reduce((sum, result) => sum + result.count, 0);
    return { count: totalCount };
  }

  // Оптимизированное получение связанных данных
  static async getWithRelations<T>(
    model: any,
    id: number,
    relations: string[]
  ): Promise<T | null> {
    const include: any = {};
    relations.forEach(relation => {
      include[relation] = true;
    });

    return model.findUnique({
      where: { id },
      include
    });
  }
}

// Утилиты для оптимизации запросов
export const queryUtils = {
  // Создание эффективных условий WHERE
  createWhereClause: (filters: Record<string, any>) => {
    const where: any = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('*')) {
          // Поддержка wildcard поиска
          where[key] = {
            contains: value.replace(/\*/g, ''),
            mode: 'insensitive'
          };
        } else if (Array.isArray(value)) {
          where[key] = { in: value };
        } else if (typeof value === 'object' && value.range) {
          // Поддержка диапазонов
          where[key] = {
            gte: value.range[0],
            lte: value.range[1]
          };
        } else {
          where[key] = value;
        }
      }
    });

    return where;
  },

  // Оптимизация сортировки
  optimizeSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => {
    // Проверяем, есть ли индекс для поля сортировки
    const indexedFields = [
      'id', 'dateCreate', 'createDate', 'status', 'operatorId', 
      'operatorNameId', 'city', 'rk', 'phone'
    ];

    if (!indexedFields.includes(sortBy)) {
      // Если нет индекса, сортируем по ID для производительности
      return { id: sortOrder };
    }

    return { [sortBy]: sortOrder };
  },

  // Ограничение количества записей для предотвращения больших запросов
  limitQuerySize: (limit: number, maxLimit: number = 1000) => {
    return Math.min(Math.max(limit, 1), maxLimit);
  }
};
