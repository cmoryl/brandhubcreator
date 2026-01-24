/**
 * usePortalPagination Hook
 * Handles pagination logic for portal grids with performance optimizations
 * 
 * Features:
 * - Configurable items per page
 * - Automatic page reset on filter changes
 * - Memoized page slicing
 * - Total page calculation
 */

import { useMemo, useState, useCallback, useEffect } from 'react';

interface UsePaginationOptions {
  itemsPerPage?: number;
  resetKey?: string; // When this changes, reset to page 1
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  totalItems: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  showPagination: boolean;
}

const PAGINATION_THRESHOLD = 12; // Show pagination when items > 12

export const usePortalPagination = <T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> => {
  const { itemsPerPage = 12, resetKey = '' } = options;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when resetKey changes (e.g., search query or tab changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Ensure current page is valid
  const validatedPage = useMemo(() => {
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, totalPages]);

  // Update page if it became invalid
  useEffect(() => {
    if (currentPage !== validatedPage) {
      setCurrentPage(validatedPage);
    }
  }, [validatedPage, currentPage]);

  // Calculate indices
  const startIndex = (validatedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Memoized page slice
  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const goToPage = useCallback((page: number) => {
    const newPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(newPage);
    // Scroll to top of content area
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(validatedPage + 1);
  }, [goToPage, validatedPage]);

  const prevPage = useCallback(() => {
    goToPage(validatedPage - 1);
  }, [goToPage, validatedPage]);

  const canGoNext = validatedPage < totalPages;
  const canGoPrev = validatedPage > 1;
  const showPagination = totalItems > PAGINATION_THRESHOLD;

  return {
    currentPage: validatedPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    showPagination,
  };
};

// Combined pagination hook for multiple entity types in portal
interface CombinedPaginationOptions {
  itemsPerPage?: number;
  activeTab: string;
  searchQuery: string;
}

interface CombinedPaginationReturn<B, P, E> {
  brands: UsePaginationReturn<B>;
  products: UsePaginationReturn<P>;
  events: UsePaginationReturn<E>;
  all: UsePaginationReturn<B | P | E>;
}

export const usePortalCombinedPagination = <B, P, E>(
  brands: B[],
  products: P[],
  events: E[],
  options: CombinedPaginationOptions
): CombinedPaginationReturn<B, P, E> => {
  const { itemsPerPage = 12, activeTab, searchQuery } = options;
  
  // Combine all items for "all" tab
  const allItems = useMemo(() => {
    return [...brands, ...products, ...events] as (B | P | E)[];
  }, [brands, products, events]);

  // Create reset key that changes when tab or search changes
  const resetKey = `${activeTab}-${searchQuery}`;

  const brandsPagination = usePortalPagination(brands, { 
    itemsPerPage, 
    resetKey: `brands-${searchQuery}` 
  });
  
  const productsPagination = usePortalPagination(products, { 
    itemsPerPage, 
    resetKey: `products-${searchQuery}` 
  });
  
  const eventsPagination = usePortalPagination(events, { 
    itemsPerPage, 
    resetKey: `events-${searchQuery}` 
  });
  
  const allPagination = usePortalPagination(allItems, { 
    itemsPerPage: itemsPerPage * 3, // Show more on "all" tab (3 sections)
    resetKey 
  });

  return {
    brands: brandsPagination,
    products: productsPagination,
    events: eventsPagination,
    all: allPagination,
  };
};
