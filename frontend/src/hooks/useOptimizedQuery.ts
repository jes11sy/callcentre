import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useEffect } from 'react';

interface OptimizedQueryOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  retry?: number;
}

// Оптимизированный хук для запросов с умным кэшированием
export const useOptimizedQuery = <T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions = {}
) => {
  const queryClient = useQueryClient();

  const defaultOptions = {
    staleTime: 2 * 60 * 1000, // 2 минуты
    cacheTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    ...options
  };

  const query = useQuery({
    queryKey,
    queryFn,
    ...defaultOptions
  });

  // Функция для принудительного обновления
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Функция для предварительной загрузки данных
  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      ...defaultOptions
    });
  }, [queryClient, queryKey, queryFn, defaultOptions]);

  return {
    ...query,
    invalidate,
    prefetch
  };
};

// Хук для оптимизированной пагинации
export const useOptimizedPagination = <T>(
  queryKey: (string | number)[],
  queryFn: (page: number, limit: number) => Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>,
  initialPage: number = 1,
  initialLimit: number = 20
) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const query = useOptimizedQuery(
    [...queryKey, page, limit],
    () => queryFn(page, limit),
    {
      staleTime: 1 * 60 * 1000, // 1 минута для пагинированных данных
      keepPreviousData: true // Сохраняем предыдущие данные при переходе между страницами
    }
  );

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Сбрасываем на первую страницу при изменении лимита
  }, []);

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasNext) {
      setPage(prev => prev + 1);
    }
  }, [query.data?.pagination.hasNext]);

  const prevPage = useCallback(() => {
    if (query.data?.pagination.hasPrev) {
      setPage(prev => prev - 1);
    }
  }, [query.data?.pagination.hasPrev]);

  return {
    ...query,
    page,
    limit,
    goToPage,
    changeLimit,
    nextPage,
    prevPage,
    pagination: query.data?.pagination
  };
};

// Хук для дебаунсинга поиска
export const useDebouncedSearch = (searchTerm: string, delay: number = 300) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return debouncedSearchTerm;
};

// Хук для виртуализации списков
export const useVirtualization = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll
  };
};

// Хук для оптимизированного мемоизирования
export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

// Хук для ленивой загрузки компонентов
export const useLazyComponent = (importFn: () => Promise<any>) => {
  const [Component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    try {
      const module = await importFn();
      setComponent(() => module.default);
    } catch (error) {
      console.error('Failed to load component:', error);
    } finally {
      setLoading(false);
    }
  }, [Component, loading, importFn]);

  return {
    Component,
    loading,
    loadComponent
  };
};
