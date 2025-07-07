/**
 * HVAC Server-Side Filter Hook
 * "Pasja rodzi profesjonalizm" - Professional server-side filtering for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - Server-side filtering optimization
 */

import { useCallback, useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';

// Filter types
export interface ServerSideFilter {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
  type: FilterType;
}

export type FilterOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'starts_with' 
  | 'ends_with'
  | 'greater_than' 
  | 'less_than' 
  | 'greater_equal' 
  | 'less_equal'
  | 'in' 
  | 'not_in' 
  | 'is_null' 
  | 'is_not_null'
  | 'between' 
  | 'date_range';

export type FilterValue = string | number | boolean | Date | string[] | number[] | null;

export type FilterType = 
  | 'text' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'select' 
  | 'multiselect'
  | 'nip' 
  | 'regon' 
  | 'email' 
  | 'phone';

// Filter configuration
export interface FilterConfig {
  enableServerSide: boolean;
  debounceMs: number;
  maxFilters: number;
  enableCaching: boolean;
  cacheTimeout: number;
}

// Filter result
export interface FilterResult<T> {
  data: T[];
  totalCount: number;
  filteredCount: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

// Hook options
export interface UseServerSideFilterOptions {
  config?: Partial<FilterConfig>;
  onFilterChange?: (filters: ServerSideFilter[]) => void;
  onError?: (error: Error) => void;
}

// Default configuration
const DEFAULT_CONFIG: FilterConfig = {
  enableServerSide: true,
  debounceMs: 300,
  maxFilters: 10,
  enableCaching: true,
  cacheTimeout: 300000, // 5 minutes
};

/**
 * Main server-side filter hook
 */
export const useServerSideFilter = <T>(
  fetchFunction: (filters: ServerSideFilter[], page: number, pageSize: number) => Promise<FilterResult<T>>,
  options: UseServerSideFilterOptions = {}
) => {
  const {
    config = {},
    onFilterChange,
    onError,
  } = options;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [filters, setFilters] = useState<ServerSideFilter[]>([]);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  // Cache for filter results
  const [cache, setCache] = useState<Map<string, { result: FilterResult<T>; timestamp: number }>>(new Map());

  /**
   * Generate cache key from filters and pagination
   */
  const generateCacheKey = useCallback((filters: ServerSideFilter[], page: number, pageSize: number) => {
    return JSON.stringify({ filters, page, pageSize });
  }, []);

  /**
   * Check if cache entry is valid
   */
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < finalConfig.cacheTimeout;
  }, [finalConfig.cacheTimeout]);

  /**
   * Execute filter query
   */
  const executeFilter = useCallback(async (
    filtersToApply: ServerSideFilter[],
    pageToLoad: number = 1,
    pageSizeToUse: number = pageSize
  ) => {
    if (!finalConfig.enableServerSide) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cacheKey = generateCacheKey(filtersToApply, pageToLoad, pageSizeToUse);
      
      // Check cache first
      if (finalConfig.enableCaching && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        if (isCacheValid(cached.timestamp)) {
          const result = cached.result;
          setData(result.data);
          setTotalCount(result.totalCount);
          setFilteredCount(result.filteredCount);
          setHasMore(result.hasMore);
          setPage(result.page);
          setLoading(false);
          return;
        }
      }

      // Fetch from server
      const result = await fetchFunction(filtersToApply, pageToLoad, pageSizeToUse);
      
      // Update state
      setData(result.data);
      setTotalCount(result.totalCount);
      setFilteredCount(result.filteredCount);
      setHasMore(result.hasMore);
      setPage(result.page);

      // Cache result
      if (finalConfig.enableCaching) {
        setCache(prev => new Map(prev).set(cacheKey, {
          result,
          timestamp: Date.now()
        }));
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Filter execution failed');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, finalConfig, pageSize, cache, generateCacheKey, isCacheValid, onError]);

  /**
   * Add filter
   */
  const addFilter = useCallback((filter: ServerSideFilter) => {
    if (filters.length >= finalConfig.maxFilters) {
      const error = new Error(`Maximum ${finalConfig.maxFilters} filters allowed`);
      setError(error);
      onError?.(error);
      return;
    }

    const newFilters = [...filters, filter];
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    executeFilter(newFilters, 1, pageSize);
  }, [filters, finalConfig.maxFilters, onFilterChange, executeFilter, pageSize, onError]);

  /**
   * Update filter
   */
  const updateFilter = useCallback((index: number, filter: Partial<ServerSideFilter>) => {
    const newFilters = filters.map((f, i) => i === index ? { ...f, ...filter } : f);
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    executeFilter(newFilters, 1, pageSize);
  }, [filters, onFilterChange, executeFilter, pageSize]);

  /**
   * Remove filter
   */
  const removeFilter = useCallback((index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    executeFilter(newFilters, 1, pageSize);
  }, [filters, onFilterChange, executeFilter, pageSize]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters([]);
    onFilterChange?.([]);
    executeFilter([], 1, pageSize);
  }, [onFilterChange, executeFilter, pageSize]);

  /**
   * Change page
   */
  const changePage = useCallback((newPage: number) => {
    executeFilter(filters, newPage, pageSize);
  }, [filters, executeFilter, pageSize]);

  /**
   * Change page size
   */
  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    executeFilter(filters, 1, newPageSize);
  }, [filters, executeFilter]);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    setCache(new Map()); // Clear cache
    executeFilter(filters, page, pageSize);
  }, [filters, page, pageSize, executeFilter]);

  // Initial load
  useEffect(() => {
    executeFilter([], 1, pageSize);
  }, [executeFilter, pageSize]);

  return {
    // Data
    data,
    loading,
    error,
    totalCount,
    filteredCount,
    hasMore,
    page,
    pageSize,

    // Filters
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,

    // Pagination
    changePage,
    changePageSize,

    // Actions
    refresh,
    clearError: () => setError(null),

    // Utilities
    hasFilters: filters.length > 0,
    canAddFilter: filters.length < finalConfig.maxFilters,
    isEmpty: data.length === 0 && !loading,
  };
};
