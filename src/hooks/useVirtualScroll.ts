// src/hooks/useVirtualScroll.ts
import { useRef, useCallback, useState, useEffect, useLayoutEffect } from 'react';
import type { VirtualScrollData } from '../types/chat';

interface UseVirtualScrollOptions {
  itemHeight: number;
  overscan?: number;
  totalItems: number;
  containerHeight: number;
  /** Автоскролл вниз при добавлении элементов, если пользователь уже был у низа */
  autoStickToBottom?: boolean;
}

interface UseVirtualScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  virtualData: VirtualScrollData;
  handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  scrollToIndex: (index: number) => void;
  isAtBottom: boolean;
}

const BOTTOM_THRESHOLD = 8; // px

export function useVirtualScroll({
  itemHeight,
  overscan = 3,
  totalItems,
  containerHeight,
  autoStickToBottom = true,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevTotalRef = useRef(totalItems);

  // Виртуальное окно
  const safeItemHeight = Math.max(1, itemHeight);
  const safeHeight = Math.max(0, containerHeight);

  const startIndex =
    totalItems === 0
      ? 0
      : Math.max(0, Math.floor(scrollTop / safeItemHeight) - overscan);

  const endIndex =
    totalItems === 0
      ? -1
      : Math.min(
          totalItems - 1,
          Math.floor((scrollTop + safeHeight) / safeItemHeight) + overscan,
        );

  const virtualData: VirtualScrollData = {
    startIndex,
    endIndex,
    totalHeight: totalItems * safeItemHeight,
    offsetY: startIndex * safeItemHeight,
  };

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    setScrollTop(el.scrollTop);
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;
      const top = Math.max(0, index * safeItemHeight);
      container.scrollTop = top;
    },
    [safeItemHeight],
  );

  // Автоскролл вниз при добавлении, если пользователь был у низа
  useLayoutEffect(() => {
    if (!autoStickToBottom) {
      prevTotalRef.current = totalItems;
      return;
    }

    const grew = totalItems > prevTotalRef.current;
    prevTotalRef.current = totalItems;

    if (grew && isAtBottom) {
      scrollToBottom('auto');
    }
  }, [totalItems, isAtBottom, autoStickToBottom, scrollToBottom]);

  // На случай, если контейнер меняет высоту (ресайз окна)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      // просто форсим ре-рендер через скролл-позицию
      setScrollTop(el.scrollTop);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return {
    containerRef,
    virtualData,
    handleScroll,
    scrollToBottom,
    scrollToIndex,
    isAtBottom,
  };
}