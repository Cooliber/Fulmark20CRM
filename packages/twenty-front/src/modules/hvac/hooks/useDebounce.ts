/**
 * HVAC Debounce Hooks
 * "Pasja rodzi profesjonalizm" - Professional debouncing for HVAC CRM
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - 300ms debouncing for optimal performance
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Debounce hook options
export interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

// Debounced search hook options
export interface UseDebounceSearchOptions extends UseDebounceOptions {
  minLength?: number;
  onSearch?: (query: string) => void | Promise<void>;
  onClear?: () => void;
}

/**
 * Generic debounce hook for any value
 * Implements 300ms default delay for HVAC CRM performance standards
 */
export const useDebounce = <T>(
  value: T,
  options: UseDebounceOptions = {}
): T => {
  const {
    delay = 300, // 300ms default for HVAC CRM performance
    leading = false,
    trailing = true,
  } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTimeRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Leading edge execution
    if (leading && now - lastCallTimeRef.current > delay) {
      setDebouncedValue(value);
      lastCallTimeRef.current = now;
      return;
    }

    // Trailing edge execution
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastCallTimeRef.current = Date.now();
      }, delay);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing]);

  return debouncedValue;
};

/**
 * Specialized debounce hook for search functionality
 * Optimized for HVAC CRM search performance with 300ms delay
 */
export const useDebounceSearch = (
  options: UseDebounceSearchOptions = {}
): {
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
  isSearching: boolean;
  clearSearch: () => void;
  searchPerformance: {
    lastSearchTime: number;
    averageSearchTime: number;
    searchCount: number;
  };
} => {
  const {
    delay = 300, // 300ms for optimal HVAC search performance
    minLength = 2,
    onSearch,
    onClear,
    ...debounceOptions
  } = options;

  const [query, setQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchPerformance, setSearchPerformance] = useState({
    lastSearchTime: 0,
    averageSearchTime: 0,
    searchCount: 0,
  });

  const debouncedQuery = useDebounce(query, { delay, ...debounceOptions });
  const searchStartTimeRef = useRef<number>(0);

  // Handle search execution
  useEffect(() => {
    const executeSearch = async () => {
      if (debouncedQuery.length === 0) {
        onClear?.();
        setIsSearching(false);
        return;
      }

      if (debouncedQuery.length < minLength) {
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      searchStartTimeRef.current = Date.now();

      try {
        await onSearch?.(debouncedQuery);
      } catch (error) {
        console.warn('Search error:', error);
      } finally {
        const searchTime = Date.now() - searchStartTimeRef.current;
        
        // Update performance metrics
        setSearchPerformance(prev => {
          const newCount = prev.searchCount + 1;
          const newAverage = (prev.averageSearchTime * prev.searchCount + searchTime) / newCount;
          
          return {
            lastSearchTime: searchTime,
            averageSearchTime: Math.round(newAverage),
            searchCount: newCount,
          };
        });

        setIsSearching(false);
      }
    };

    executeSearch();
  }, [debouncedQuery, minLength, onSearch, onClear]);

  const clearSearch = useCallback(() => {
    setQuery('');
    onClear?.();
  }, [onClear]);

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching,
    clearSearch,
    searchPerformance,
  };
};

/**
 * Debounced callback hook
 * For debouncing function calls rather than values
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Debounced state hook
 * Combines state management with debouncing
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] => {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, { delay });

  return [value, debouncedValue, setValue];
};

/**
 * HVAC-specific search debounce hook
 * Optimized for HVAC customer and equipment search
 */
export const useHvacSearchDebounce = (
  searchFunction: (query: string) => Promise<unknown[]>,
  options: {
    delay?: number;
    minLength?: number;
    enablePerformanceTracking?: boolean;
  } = {}
) => {
  const {
    delay = 300,
    minLength = 2,
    enablePerformanceTracking = true,
  } = options;

  const [results, setResults] = useState<unknown[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const searchWithDebounce = useDebounceSearch({
    delay,
    minLength,
    onSearch: async (query: string) => {
      try {
        setError(null);
        const searchResults = await searchFunction(query);
        setResults(searchResults);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Search failed');
        setError(error);
        setResults([]);
      }
    },
    onClear: () => {
      setResults([]);
      setError(null);
    },
  });

  return {
    ...searchWithDebounce,
    results,
    error,
    hasResults: results.length > 0,
    isEmpty: results.length === 0 && searchWithDebounce.debouncedQuery.length >= minLength,
  };
};
