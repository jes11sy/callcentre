import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebouncedSearch } from '@/hooks/useOptimizedQuery';

interface OptimizedSearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  loading?: boolean;
  className?: string;
  showClearButton?: boolean;
  initialValue?: string;
}

export function OptimizedSearch({
  placeholder = 'Поиск...',
  onSearch,
  onClear,
  debounceMs = 300,
  loading = false,
  className,
  showClearButton = true,
  initialValue = ''
}: OptimizedSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebouncedSearch(searchTerm, debounceMs);

  // Вызываем поиск при изменении debounced значения
  React.useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    onClear?.();
  }, [onClear]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const hasValue = searchTerm.length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          className="pl-10 pr-10"
          disabled={loading}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
        {showClearButton && hasValue && !loading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Компонент для расширенного поиска с фильтрами
interface AdvancedSearchProps {
  onSearch: (filters: Record<string, any>) => void;
  filters: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number';
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
  }>;
  debounceMs?: number;
  loading?: boolean;
  className?: string;
}

export function AdvancedSearch({
  onSearch,
  filters,
  debounceMs = 300,
  loading = false,
  className
}: AdvancedSearchProps) {
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({});
  const debouncedFilters = useDebouncedSearch(JSON.stringify(searchFilters), debounceMs);

  // Вызываем поиск при изменении debounced фильтров
  React.useEffect(() => {
    try {
      const parsedFilters = JSON.parse(debouncedFilters);
      onSearch(parsedFilters);
    } catch (error) {
      console.error('Error parsing search filters:', error);
    }
  }, [debouncedFilters, onSearch]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setSearchFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchFilters({});
  }, []);

  const hasActiveFilters = Object.values(searchFilters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters.map((filter) => (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {filter.label}
            </label>
            {filter.type === 'text' && (
              <Input
                type="text"
                placeholder={filter.placeholder}
                value={searchFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                disabled={loading}
              />
            )}
            {filter.type === 'select' && (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                disabled={loading}
              >
                <option value="">Все</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {filter.type === 'date' && (
              <Input
                type="date"
                value={searchFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                disabled={loading}
              />
            )}
            {filter.type === 'number' && (
              <Input
                type="number"
                placeholder={filter.placeholder}
                value={searchFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                disabled={loading}
              />
            )}
          </div>
        ))}
      </div>
      
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={loading}
          >
            Очистить фильтры
          </Button>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
}
