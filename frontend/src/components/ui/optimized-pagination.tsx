import React, { useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
  disabled?: boolean;
}

export function OptimizedPagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className,
  disabled = false
}: PaginationProps) {
  const visiblePages = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxVisiblePages]);

  const showStartEllipsis = visiblePages[0] > 2;
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  const handlePageClick = useCallback((page: number) => {
    if (page !== currentPage && !disabled) {
      onPageChange(page);
    }
  }, [currentPage, onPageChange, disabled]);

  const handlePrevClick = useCallback(() => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange, disabled]);

  const handleNextClick = useCallback(() => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange, disabled]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-center space-x-1', className)}>
      {/* First page button */}
      {showFirstLast && currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(1)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          1
        </Button>
      )}

      {/* Start ellipsis */}
      {showStartEllipsis && (
        <div className="flex items-center justify-center h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Previous button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevClick}
          disabled={disabled || currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Page numbers */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageClick(page)}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            page === currentPage && "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {page}
        </Button>
      ))}

      {/* Next button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextClick}
          disabled={disabled || currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* End ellipsis */}
      {showEndEllipsis && (
        <div className="flex items-center justify-center h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Last page button */}
      {showFirstLast && currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(totalPages)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          {totalPages}
        </Button>
      )}
    </div>
  );
}

// Компонент для отображения информации о пагинации
interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className
}: PaginationInfoProps) {
  const startItem = useMemo(() => 
    (currentPage - 1) * itemsPerPage + 1, 
    [currentPage, itemsPerPage]
  );

  const endItem = useMemo(() => 
    Math.min(currentPage * itemsPerPage, totalItems), 
    [currentPage, itemsPerPage, totalItems]
  );

  return (
    <div className={cn('text-sm text-gray-600', className)}>
      Показано {startItem}-{endItem} из {totalItems} записей
    </div>
  );
}

// Компонент для выбора количества элементов на странице
interface PageSizeSelectorProps {
  currentSize: number;
  onSizeChange: (size: number) => void;
  options?: number[];
  className?: string;
  disabled?: boolean;
}

export function PageSizeSelector({
  currentSize,
  onSizeChange,
  options = [10, 20, 50, 100],
  className,
  disabled = false
}: PageSizeSelectorProps) {
  const handleSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    onSizeChange(newSize);
  }, [onSizeChange]);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className="text-sm text-gray-600">Показать:</span>
      <select
        value={currentSize}
        onChange={handleSizeChange}
        disabled={disabled}
        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-600">на странице</span>
    </div>
  );
}

// Компонент для полной пагинации с информацией и селектором размера
interface FullPaginationProps extends PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  showInfo?: boolean;
  showPageSizeSelector?: boolean;
}

export function FullPagination({
  totalItems,
  itemsPerPage,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showInfo = true,
  showPageSizeSelector = true,
  ...paginationProps
}: FullPaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
      <div className="flex items-center space-x-4">
        {showInfo && (
          <PaginationInfo
            currentPage={paginationProps.currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        )}
        {showPageSizeSelector && (
          <PageSizeSelector
            currentSize={itemsPerPage}
            onSizeChange={onPageSizeChange}
            options={pageSizeOptions}
            disabled={paginationProps.disabled}
          />
        )}
      </div>
      
      <OptimizedPagination
        {...paginationProps}
        totalPages={totalPages}
      />
    </div>
  );
}
