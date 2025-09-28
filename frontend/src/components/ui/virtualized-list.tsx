import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: {
    index: number;
    style: React.CSSProperties;
    item: T;
  }) => React.ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  overscanCount?: number;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  onScroll,
  overscanCount = 5
}: VirtualizedListProps<T>) {
  const listRef = useRef<List>(null);

  const handleScroll = useCallback(({ scrollTop }: { scrollTop: number }) => {
    onScroll?.(scrollTop);
  }, [onScroll]);

  const ItemRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div style={style}>
        {renderItem({ index, style, item })}
      </div>
    );
  }, [items, renderItem]);

  return (
    <div className={cn('w-full', className)}>
      <List
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        onScroll={handleScroll}
        overscanCount={overscanCount}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {ItemRenderer}
      </List>
    </div>
  );
}

// Компонент для виртуализированной таблицы
interface VirtualizedTableProps<T> {
  items: T[];
  height: number;
  rowHeight: number;
  columns: Array<{
    key: string;
    label: string;
    width: number;
    render: (item: T, index: number) => React.ReactNode;
  }>;
  className?: string;
}

export function VirtualizedTable<T>({
  items,
  height,
  rowHeight,
  columns,
  className
}: VirtualizedTableProps<T>) {
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), 
    [columns]
  );

  const RowRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div style={style} className="flex border-b border-gray-200 hover:bg-gray-50">
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 py-2 border-r border-gray-200 last:border-r-0"
            style={{ width: column.width }}
          >
            {column.render(item, index)}
          </div>
        ))}
      </div>
    );
  }, [items, columns]);

  return (
    <div className={cn('w-full border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200 last:border-r-0"
            style={{ width: column.width }}
          >
            {column.label}
          </div>
        ))}
      </div>

      {/* Virtualized rows */}
      <List
        height={height - 48} // Subtract header height
        itemCount={items.length}
        itemSize={rowHeight}
        width={totalWidth}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {RowRenderer}
      </List>
    </div>
  );
}

// Компонент для бесконечной прокрутки
interface InfiniteScrollListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: {
    index: number;
    style: React.CSSProperties;
    item: T;
  }) => React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  className?: string;
}

export function InfiniteScrollList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  onLoadMore,
  hasMore,
  loading,
  className
}: InfiniteScrollListProps<T>) {
  const listRef = useRef<List>(null);

  const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }: {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  }) => {
    // Загружаем больше данных когда дошли до конца
    if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  const ItemRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div style={style}>
        {renderItem({ index, style, item })}
      </div>
    );
  }, [items, renderItem]);

  return (
    <div className={cn('w-full', className)}>
      <List
        ref={listRef}
        height={height}
        itemCount={items.length + (loading ? 1 : 0)}
        itemSize={itemHeight}
        onScroll={handleScroll}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {ItemRenderer}
      </List>
      
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
