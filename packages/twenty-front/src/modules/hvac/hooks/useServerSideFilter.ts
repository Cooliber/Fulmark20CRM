/**
 * useServerSideFilter Hook - Server-side Filtering for HVAC CRM
 * "Pasja rodzi profesjonalizm" - Professional server-side filtering with debouncing
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - 300ms debouncing for performance
 */

import { useState, useCallback, useRef } from 'react';
import { useDebounceSearch } from './useDebounce';
import { trackHVACUserAction } from '../index';

// Filter configuration
interface FilterConfig {
  field: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
}

// Sort configuration
interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Pagination configuration
interface PaginationConfig {
  page: number;
  limit: number;
  offset?: number;
}

// Server-side filter options
interface UseServerSideFilterOptions<T> {
  apiEndpoint: string;
  initialFilters?: FilterConfig[];
  initialSort?: SortConfig;
  initialPagination?: PaginationConfig;
  searchFields?: string[];
  debounceDelay?: number;
  onDataLoaded?: (data: T[], total: number) => void;
  onError?: (error: Error) => void;
}

// Filter state
interface FilterState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  total: number;
  filters: FilterConfig[];
  sort: SortConfig | null;
  pagination: PaginationConfig;
  searchQuery: string;
}

/**
 * Server-side filtering hook with debouncing and performance optimization
 * Implements HVAC CRM performance standards with 300ms debouncing
 */
export const useServerSideFilter = <T>(
  options: UseServerSideFilterOptions<T>
) => {
  const {
    apiEndpoint,
    initialFilters = [],
    initialSort = null,
    initialPagination = { page: 1, limit: 20 },
    searchFields = [],
    debounceDelay = 300,
    onDataLoaded,
    onError,
  } = options;

  // State management
  const [state, setState] = useState<FilterState<T>>({
    data: [],
    loading: false,
    error: null,
    total: 0,
    filters: initialFilters,
    sort: initialSort,
    pagination: initialPagination,
    searchQuery: '',
  });

  const abortControllerRef = useRef<AbortController>();

  // Build query parameters for API call
  const buildQueryParams = useCallback((
    filters: FilterConfig[],
    sort: SortConfig | null,
    pagination: PaginationConfig,
    searchQuery: string
  ): URLSearchParams => {
    const params = new URLSearchParams();

    // Add pagination
    params.append('page', pagination.page.toString());
    params.append('limit', pagination.limit.toString());
    if (pagination.offset) {
      params.append('offset', pagination.offset.toString());
    }

    // Add sorting
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortDirection', sort.direction);
    }

    // Add filters
    filters.forEach((filter, index) => {
      params.append(`filter[${index}][field]`, filter.field);
      params.append(`filter[${index}][operator]`, filter.operator);
      params.append(`filter[${index}][value]`, filter.value.toString());
    });

    // Add search query
    if (searchQuery && searchFields.length > 0) {
      params.append('search', searchQuery);
      params.append('searchFields', searchFields.join(','));
    }

    return params;
  }, [searchFields]);

  // Execute API call with current state
  const executeFilter = useCallback(async (
    filters: FilterConfig[],
    sort: SortConfig | null,
    pagination: PaginationConfig,
    searchQuery: string
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const queryParams = buildQueryParams(filters, sort, pagination, searchQuery);
      const url = `${apiEndpoint}?${queryParams.toString()}`;

      trackHVACUserAction('server_filter_request', 'API_REQUEST', {
        endpoint: apiEndpoint,
        filtersCount: filters.length,
        hasSort: !!sort,
        hasSearch: !!searchQuery,
        page: pagination.page,
        limit: pagination.limit,
      });

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const { data, total } = result;

      setState(prev => ({
        ...prev,
        data,
        total,
        loading: false,
        filters,
        sort,
        pagination,
        searchQuery,
      }));

      onDataLoaded?.(data, total);

      trackHVACUserAction('server_filter_success', 'API_SUCCESS', {
        endpoint: apiEndpoint,
        resultCount: data.length,
        total,
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, don't update state
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));

      trackHVACUserAction('server_filter_error', 'API_ERROR', {
        endpoint: apiEndpoint,
        error: errorMessage,
      });
    }
  }, [apiEndpoint, buildQueryParams, onDataLoaded, onError]);

  // Debounced search implementation
  const { handleQueryChange, clearSearch, isSearching } = useDebounceSearch({
    delay: debounceDelay,
    minLength: 2,
    onSearch: useCallback((query: string) => {
      executeFilter(state.filters, state.sort, state.pagination, query);
    }, [executeFilter, state.filters, state.sort, state.pagination]),
    onClear: useCallback(() => {
      executeFilter(state.filters, state.sort, state.pagination, '');
    }, [executeFilter, state.filters, state.sort, state.pagination]),
  });

  // Filter management functions
  const addFilter = useCallback((filter: FilterConfig) => {
    const newFilters = [...state.filters, filter];
    const resetPagination = { ...state.pagination, page: 1 };
    executeFilter(newFilters, state.sort, resetPagination, state.searchQuery);
  }, [executeFilter, state.filters, state.sort, state.pagination, state.searchQuery]);

  const removeFilter = useCallback((index: number) => {
    const newFilters = state.filters.filter((_, i) => i !== index);
    const resetPagination = { ...state.pagination, page: 1 };
    executeFilter(newFilters, state.sort, resetPagination, state.searchQuery);
  }, [executeFilter, state.filters, state.sort, state.pagination, state.searchQuery]);

  const updateFilter = useCallback((index: number, filter: FilterConfig) => {
    const newFilters = [...state.filters];
    newFilters[index] = filter;
    const resetPagination = { ...state.pagination, page: 1 };
    executeFilter(newFilters, state.sort, resetPagination, state.searchQuery);
  }, [executeFilter, state.filters, state.sort, state.pagination, state.searchQuery]);

  const clearFilters = useCallback(() => {
    const resetPagination = { ...state.pagination, page: 1 };
    executeFilter([], state.sort, resetPagination, state.searchQuery);
  }, [executeFilter, state.sort, state.pagination, state.searchQuery]);

  // Sort management
  const updateSort = useCallback((sort: SortConfig | null) => {
    const resetPagination = { ...state.pagination, page: 1 };
    executeFilter(state.filters, sort, resetPagination, state.searchQuery);
  }, [executeFilter, state.filters, state.pagination, state.searchQuery]);

  // Pagination management
  const updatePagination = useCallback((pagination: Partial<PaginationConfig>) => {
    const newPagination = { ...state.pagination, ...pagination };
    executeFilter(state.filters, state.sort, newPagination, state.searchQuery);
  }, [executeFilter, state.filters, state.sort, state.searchQuery]);

  const goToPage = useCallback((page: number) => {
    updatePagination({ page });
  }, [updatePagination]);

  const changePageSize = useCallback((limit: number) => {
    updatePagination({ page: 1, limit });
  }, [updatePagination]);

  // Refresh data
  const refresh = useCallback(() => {
    executeFilter(state.filters, state.sort, state.pagination, state.searchQuery);
  }, [executeFilter, state.filters, state.sort, state.pagination, state.searchQuery]);

  return {
    // State
    data: state.data,
    loading: state.loading || isSearching,
    error: state.error,
    total: state.total,
    filters: state.filters,
    sort: state.sort,
    pagination: state.pagination,
    searchQuery: state.searchQuery,

    // Search functions
    handleSearchChange: handleQueryChange,
    clearSearch,

    // Filter functions
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,

    // Sort functions
    updateSort,

    // Pagination functions
    updatePagination,
    goToPage,
    changePageSize,

    // Utility functions
    refresh,
  };
};
