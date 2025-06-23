/**
 * useDebounce Hook - Performance Optimization for HVAC CRM
 * "Pasja rodzi profesjonalizm" - Professional debouncing implementation
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization with 300ms debouncing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackHVACUserAction } from '../index';

// Debounce hook options
interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

// Debounced search hook options
interface UseDebounceSearchOptions extends UseDebounceOptions {
  minLength?: number;
  onSearch?: (query: string) => void;
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
    const timeSinceLastCall = now - lastCallTimeRef.current;

    // Handle leading edge
    if (leading && timeSinceLastCall >= delay) {
      setDebouncedValue(value);
      lastCallTimeRef.current = now;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Handle trailing edge
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastCallTimeRef.current = Date.now();
      }, delay);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing]);

  return debouncedValue;
};

/**
 * Specialized debounced search hook for HVAC CRM
 * Implements server-side filtering with performance tracking
 */
export const useDebounceSearch = (
  options: UseDebounceSearchOptions = {}
) => {
  const {
    delay = 300,
    minLength = 2,
    onSearch,
    onClear,
    ...debounceOptions
  } = options;

  const [query, setQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
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
        // Track search performance
        trackHVACUserAction('debounced_search_executed', 'PERFORMANCE', {
          query: debouncedQuery.substring(0, 10), // First 10 chars for privacy
          queryLength: debouncedQuery.length,
          delay,
          minLength,
        });

        await onSearch?.(debouncedQuery);

        // Track search completion
        const searchDuration = Date.now() - searchStartTimeRef.current;
        trackHVACUserAction('debounced_search_completed', 'PERFORMANCE', {
          duration: searchDuration,
          queryLength: debouncedQuery.length,
        });

      } catch (error) {
        trackHVACUserAction('debounced_search_error', 'PERFORMANCE', {
          error: error instanceof Error ? error.message : 'Unknown error',
          queryLength: debouncedQuery.length,
        });
      } finally {
        setIsSearching(false);
      }
    };

    executeSearch();
  }, [debouncedQuery, minLength, onSearch, onClear, delay]);

  // Handle query change with immediate UI update
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    
    // Track user input
    trackHVACUserAction('search_input_changed', 'USER_INTERACTION', {
      queryLength: newQuery.length,
      hasMinLength: newQuery.length >= minLength,
    });
  }, [minLength]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    onClear?.();
    
    trackHVACUserAction('search_cleared', 'USER_INTERACTION', {});
  }, [onClear]);

  return {
    query,
    debouncedQuery,
    isSearching,
    handleQueryChange,
    clearSearch,
    hasMinLength: query.length >= minLength,
  };
};
