// src/hooks/useVirtualScroll.ts
import { useRef, useCallback, useState, useEffect } from 'react';
import type { VirtualScrollData } from '../types/chat';

interface UseVirtualScrollOptions {
  itemHeight: number;
  overscan?: number;
  totalItems: number;
  containerHeight: number;
}

interface UseVirtualScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  virtualData: VirtualScrollData;
  handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll({
  itemHeight,
  overscan = 3,
  totalItems,
  containerHeight,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualData: VirtualScrollData = {
    startIndex,
    endIndex,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight,
  };

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = index * itemHeight;
      }
    },
    [itemHeight]
  );

  useEffect(() => {
    scrollToBottom();
  }, [totalItems, scrollToBottom]);

  return {
    containerRef,
    virtualData,
    handleScroll,
    scrollToBottom,
    scrollToIndex,
  };
}