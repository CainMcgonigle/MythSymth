import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';

export interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: ({ index, style, data }: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactNode;
  className?: string;
  overscan?: number;
}

function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscan = 5,
}: VirtualizedListProps<T>) {
  const ListComponent = useMemo(() => {
    return typeof itemHeight === 'function' ? VariableSizeList : List;
  }, [itemHeight]);

  const memoizedRenderItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>
        {renderItem({ index, style, data: items })}
      </div>
    ),
    [items, renderItem]
  );

  if (typeof itemHeight === 'function') {
    return (
      <VariableSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={items}
        className={className}
        overscanCount={overscan}
      >
        {memoizedRenderItem}
      </VariableSizeList>
    );
  }

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight as number}
      itemData={items}
      className={className}
      overscanCount={overscan}
    >
      {memoizedRenderItem}
    </List>
  );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;