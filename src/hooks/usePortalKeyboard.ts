/**
 * usePortalKeyboard Hook
 * Provides keyboard navigation for portal cards
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePortalKeyboardProps {
  totalItems: number;
  columnsPerRow: number;
  onSelect: (index: number) => void;
  enabled?: boolean;
}

export const usePortalKeyboard = ({
  totalItems,
  columnsPerRow,
  onSelect,
  enabled = true,
}: UsePortalKeyboardProps) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || totalItems === 0) return;

    const key = e.key;
    let newIndex = focusedIndex;

    switch (key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(focusedIndex + 1, totalItems - 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(focusedIndex - 1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(focusedIndex + columnsPerRow, totalItems - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(focusedIndex - columnsPerRow, 0);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          onSelect(focusedIndex);
        }
        return;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = totalItems - 1;
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedIndex(-1);
        containerRef.current?.blur();
        return;
      default:
        return;
    }

    if (newIndex !== focusedIndex && newIndex >= 0) {
      setFocusedIndex(newIndex);
    }
  }, [enabled, totalItems, columnsPerRow, focusedIndex, onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  // Reset focus when items change
  useEffect(() => {
    if (totalItems === 0) {
      setFocusedIndex(-1);
    } else if (focusedIndex >= totalItems) {
      setFocusedIndex(totalItems - 1);
    }
  }, [totalItems, focusedIndex]);

  const setFocus = useCallback((index: number) => {
    setFocusedIndex(Math.max(-1, Math.min(index, totalItems - 1)));
  }, [totalItems]);

  const clearFocus = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  return {
    containerRef,
    focusedIndex,
    setFocus,
    clearFocus,
    containerProps: {
      tabIndex: enabled && totalItems > 0 ? 0 : -1,
      role: 'grid',
      'aria-label': 'Portal items grid',
    },
  };
};

/**
 * Hook for tracking grid columns based on container width
 */
export const useGridColumns = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateColumns = () => {
      const width = container.offsetWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };

    updateColumns();

    const observer = new ResizeObserver(updateColumns);
    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef]);

  return columns;
};
