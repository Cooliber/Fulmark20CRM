/**
 * HVAC Debounced Performance Hook
 * "Pasja rodzi profesjonalizm" - Optimized performance with intelligent debouncing
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - 300ms debouncing for search performance
 * - Performance monitoring and optimization
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { hvacPerformanceOptimizer } from '../services/HvacPerformanceOptimizer';
import { trackHVACUserAction } from '../utils/sentry-init';
import { HVACErrorContext } from '../config/sentry.config';

// Performance configuration
interface PerformanceConfig {
  debounceDelay: number;
  throttleDelay: number;
  enableCaching: boolean;
  enableMetrics: boolean;
  performanceThreshold: number;
}

// Performance metrics
interface PerformanceMetrics {
  operationCount: number;
  averageTime: number;
  cacheHitRate: number;
  debounceEfficiency: number;
  slowOperations: number;
}

// Hook options
interface UseHVACDebouncedPerformanceOptions {
  debounceDelay?: number;
  throttleDelay?: number;
  enableCaching?: boolean;
  enableMetrics?: boolean;
  performanceThreshold?: number;
  context?: HVACErrorContext;
}

// Hook return type
interface HVACDebouncedPerformance {
  // Debounced operations
  debouncedSearch: <T>(
    searchFn: () => Promise<T>,
    searchKey?: string
  ) => Promise<T>;
  
  debouncedFilter: <T>(
    filterFn: () => T,
    filterKey?: string
  ) => T | undefined;
  
  debouncedUpdate: <T>(
    updateFn: () => Promise<T>,
    updateKey?: string
  ) => Promise<T>;

  // Throttled operations
  throttledAction: <T>(
    actionFn: () => T,
    actionKey?: string
  ) => T | undefined;

  // Performance monitoring
  measureOperation: <T>(
    operation: string,
    operationFn: () => Promise<T>
  ) => Promise<T>;

  measureSync: <T>(
    operation: string,
    operationFn: () => T
  ) => T;

  // Cache operations
  getCached: <T>(key: string) => T | null;
  setCached: <T>(key: string, value: T, ttl?: number) => void;
  clearCache: (pattern?: string) => void;

  // Metrics and status
  getMetrics: () => PerformanceMetrics;
  isOperationPending: (key: string) => boolean;
  cancelOperation: (key: string) => void;
  
  // Performance optimization
  preloadOperation: (key: string, operationFn: () => Promise<any>) => void;
  optimizeMemory: () => void;
}

// Default configuration
const DEFAULT_CONFIG: PerformanceConfig = {
  debounceDelay: 300, // 300ms for search as per Twenty CRM rules
  throttleDelay: 100,
  enableCaching: true,
  enableMetrics: true,
  performanceThreshold: 300,
};

export const useHVACDebouncedPerformance = (
  options: UseHVACDebouncedPerformanceOptions = {}
): HVACDebouncedPerformance => {
  const config: PerformanceConfig = {
    ...DEFAULT_CONFIG,
    ...options,
  };

  // Refs for timers and state
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const throttleTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const cache = useRef<Map<string, { value: any; timestamp: number; ttl: number }>>(new Map());
  const pendingOperations = useRef<Set<string>>(new Set());
  const metrics = useRef<PerformanceMetrics>({
    operationCount: 0,
    averageTime: 0,
    cacheHitRate: 0,
    debounceEfficiency: 0,
    slowOperations: 0,
  });

  // State for reactive updates
  const [, forceUpdate] = useState({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      throttleTimers.current.forEach(timer => clearTimeout(timer));
      
      // Clear cache
      cache.current.clear();
      pendingOperations.current.clear();
    };
  }, []);

  // Debounced search with caching and performance monitoring
  const debouncedSearch = useCallback(<T>(
    searchFn: () => Promise<T>,
    searchKey: string = 'default_search'
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (debounceTimers.current.has(searchKey)) {
        clearTimeout(debounceTimers.current.get(searchKey)!);
      }

      // Check cache first
      if (config.enableCaching) {
        const cached = getCachedValue<T>(`search:${searchKey}`);
        if (cached) {
          updateCacheHitRate(true);
          resolve(cached);
          return;
        }
      }

      // Set pending operation
      pendingOperations.current.add(searchKey);

      // Create debounced timer
      const timer = setTimeout(async () => {
        try {
          const startTime = performance.now();
          const result = await searchFn();
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Update metrics
          updateMetrics(duration);
          updateCacheHitRate(false);

          // Cache result
          if (config.enableCaching) {
            setCachedValue(`search:${searchKey}`, result, 300000); // 5 minutes
          }

          // Track performance
          if (config.enableMetrics) {
            trackSearchPerformance(searchKey, duration);
          }

          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          pendingOperations.current.delete(searchKey);
          debounceTimers.current.delete(searchKey);
        }
      }, config.debounceDelay);

      debounceTimers.current.set(searchKey, timer);
    });
  }, [config]);

  // Debounced filter
  const debouncedFilter = useCallback(<T>(
    filterFn: () => T,
    filterKey: string = 'default_filter'
  ): T | undefined => {
    // Clear existing timer
    if (debounceTimers.current.has(filterKey)) {
      clearTimeout(debounceTimers.current.get(filterKey)!);
    }

    let result: T | undefined;

    const timer = setTimeout(() => {
      const startTime = performance.now();
      result = filterFn();
      const duration = performance.now() - startTime;

      updateMetrics(duration);
      
      if (config.enableMetrics) {
        trackFilterPerformance(filterKey, duration);
      }

      debounceTimers.current.delete(filterKey);
      forceUpdate({});
    }, config.debounceDelay);

    debounceTimers.current.set(filterKey, timer);
    return result;
  }, [config]);

  // Debounced update
  const debouncedUpdate = useCallback(<T>(
    updateFn: () => Promise<T>,
    updateKey: string = 'default_update'
  ): Promise<T> => {
    return hvacPerformanceOptimizer.optimizeSearch(
      updateKey,
      updateFn,
      { debounceDelay: config.debounceDelay }
    );
  }, [config]);

  // Throttled action
  const throttledAction = useCallback(<T>(
    actionFn: () => T,
    actionKey: string = 'default_action'
  ): T | undefined => {
    if (throttleTimers.current.has(actionKey)) {
      return undefined; // Action is throttled
    }

    const result = actionFn();
    
    const timer = setTimeout(() => {
      throttleTimers.current.delete(actionKey);
    }, config.throttleDelay);

    throttleTimers.current.set(actionKey, timer);
    return result;
  }, [config]);

  // Measure async operation
  const measureOperation = useCallback(async <T>(
    operation: string,
    operationFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operationFn();
      const duration = performance.now() - startTime;
      
      updateMetrics(duration);
      
      if (config.enableMetrics) {
        trackOperationPerformance(operation, duration);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      updateMetrics(duration);
      
      trackHVACUserAction('operation_error', 'ERROR', {
        operation,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }, [config]);

  // Measure sync operation
  const measureSync = useCallback(<T>(
    operation: string,
    operationFn: () => T
  ): T => {
    const startTime = performance.now();
    
    try {
      const result = operationFn();
      const duration = performance.now() - startTime;
      
      updateMetrics(duration);
      
      if (config.enableMetrics) {
        trackOperationPerformance(operation, duration);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      updateMetrics(duration);
      
      trackHVACUserAction('sync_operation_error', 'ERROR', {
        operation,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }, [config]);

  // Cache operations
  const getCached = useCallback(<T>(key: string): T | null => {
    return getCachedValue<T>(key);
  }, []);

  const setCached = useCallback(<T>(key: string, value: T, ttl?: number): void => {
    setCachedValue(key, value, ttl || 300000);
  }, []);

  const clearCache = useCallback((pattern?: string): void => {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of cache.current) {
        if (regex.test(key)) {
          cache.current.delete(key);
        }
      }
    } else {
      cache.current.clear();
    }
  }, []);

  // Utility functions
  const getCachedValue = <T>(key: string): T | null => {
    const cached = cache.current.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      cache.current.delete(key);
      return null;
    }
    
    return cached.value;
  };

  const setCachedValue = <T>(key: string, value: T, ttl: number): void => {
    cache.current.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  };

  const updateMetrics = (duration: number): void => {
    const current = metrics.current;
    current.operationCount++;
    current.averageTime = (current.averageTime * (current.operationCount - 1) + duration) / current.operationCount;
    
    if (duration > config.performanceThreshold) {
      current.slowOperations++;
    }
  };

  const updateCacheHitRate = (hit: boolean): void => {
    const current = metrics.current;
    const totalOperations = current.operationCount + 1;
    const currentHits = current.cacheHitRate * current.operationCount;
    current.cacheHitRate = (currentHits + (hit ? 1 : 0)) / totalOperations;
  };

  const trackSearchPerformance = (searchKey: string, duration: number): void => {
    trackHVACUserAction('search_performance', 'PERFORMANCE', {
      searchKey,
      duration,
      threshold: config.performanceThreshold,
      context: options.context || HVACErrorContext.HVAC_SEARCH,
    });
  };

  const trackFilterPerformance = (filterKey: string, duration: number): void => {
    trackHVACUserAction('filter_performance', 'PERFORMANCE', {
      filterKey,
      duration,
      threshold: config.performanceThreshold,
    });
  };

  const trackOperationPerformance = (operation: string, duration: number): void => {
    trackHVACUserAction('operation_performance', 'PERFORMANCE', {
      operation,
      duration,
      threshold: config.performanceThreshold,
    });
  };

  // Status and control functions
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metrics.current };
  }, []);

  const isOperationPending = useCallback((key: string): boolean => {
    return pendingOperations.current.has(key);
  }, []);

  const cancelOperation = useCallback((key: string): void => {
    if (debounceTimers.current.has(key)) {
      clearTimeout(debounceTimers.current.get(key)!);
      debounceTimers.current.delete(key);
    }
    pendingOperations.current.delete(key);
  }, []);

  const preloadOperation = useCallback((key: string, operationFn: () => Promise<any>): void => {
    setTimeout(() => {
      operationFn().catch(() => {
        // Ignore preload errors
      });
    }, 2000);
  }, []);

  const optimizeMemory = useCallback((): void => {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, cached] of cache.current) {
      if (now - cached.timestamp > cached.ttl) {
        cache.current.delete(key);
      }
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }, []);

  return {
    debouncedSearch,
    debouncedFilter,
    debouncedUpdate,
    throttledAction,
    measureOperation,
    measureSync,
    getCached,
    setCached,
    clearCache,
    getMetrics,
    isOperationPending,
    cancelOperation,
    preloadOperation,
    optimizeMemory,
  };
};
