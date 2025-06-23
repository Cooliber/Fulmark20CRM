/**
 * useDataLoader Hook - Performance Optimization for HVAC CRM
 * "Pasja rodzi profesjonalizm" - Professional data loading with N+1 query prevention
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization with batching
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { trackHVACUserAction } from '../index';

// Data loader configuration
interface DataLoaderConfig<T> {
  batchSize?: number;
  batchDelay?: number;
  cacheTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Batch request item
interface BatchRequestItem<T> {
  id: string;
  resolve: (data: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

// Cache entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Hook state
interface UseDataLoaderState<T> {
  loading: boolean;
  error: string | null;
  cache: Map<string, CacheEntry<T>>;
  pendingRequests: Map<string, BatchRequestItem<T>>;
}

// Hook options
interface UseDataLoaderOptions<T> extends DataLoaderConfig<T> {
  fetcher: (ids: string[]) => Promise<T[]>;
  keyExtractor: (item: T) => string;
  onError?: (error: Error) => void;
  onBatchComplete?: (items: T[], requestCount: number) => void;
}

/**
 * Data loader hook with batching and caching to prevent N+1 queries
 * Implements HVAC CRM performance standards
 */
export const useDataLoader = <T>(
  options: UseDataLoaderOptions<T>
) => {
  const {
    fetcher,
    keyExtractor,
    batchSize = 50,
    batchDelay = 10, // 10ms batching window
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000,
    onError,
    onBatchComplete,
  } = options;

  // State management
  const [state, setState] = useState<UseDataLoaderState<T>>({
    loading: false,
    error: null,
    cache: new Map(),
    pendingRequests: new Map(),
  });

  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // Check if data is cached and valid
  const getCachedData = useCallback((id: string): T | null => {
    const cached = state.cache.get(id);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    return null;
  }, [state.cache]);

  // Cache data with expiration
  const setCachedData = useCallback((items: T[]) => {
    setState(prev => {
      const newCache = new Map(prev.cache);
      const now = Date.now();
      
      items.forEach(item => {
        const key = keyExtractor(item);
        newCache.set(key, {
          data: item,
          timestamp: now,
          expiresAt: now + cacheTimeout,
        });
      });

      return { ...prev, cache: newCache };
    });
  }, [keyExtractor, cacheTimeout]);

  // Execute batch request
  const executeBatch = useCallback(async (requestIds: string[]) => {
    if (requestIds.length === 0) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const startTime = Date.now();
    let attempt = 0;

    const executeWithRetry = async (): Promise<T[]> => {
      try {
        trackHVACUserAction('data_loader_batch_started', 'PERFORMANCE', {
          requestCount: requestIds.length,
          batchSize,
          attempt: attempt + 1,
        });

        const results = await fetcher(requestIds);

        const duration = Date.now() - startTime;
        trackHVACUserAction('data_loader_batch_success', 'PERFORMANCE', {
          requestCount: requestIds.length,
          resultCount: results.length,
          duration,
          attempt: attempt + 1,
        });

        return results;

      } catch (error) {
        attempt++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        trackHVACUserAction('data_loader_batch_error', 'PERFORMANCE', {
          requestCount: requestIds.length,
          error: errorMessage,
          attempt,
        });

        if (attempt < retryAttempts) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeWithRetry();
        }

        throw error;
      }
    };

    try {
      const results = await executeWithRetry();

      // Cache results
      setCachedData(results);

      // Create result map for quick lookup
      const resultMap = new Map<string, T>();
      results.forEach(item => {
        resultMap.set(keyExtractor(item), item);
      });

      // Resolve pending requests
      setState(prev => {
        const newPendingRequests = new Map(prev.pendingRequests);
        
        requestIds.forEach(id => {
          const request = newPendingRequests.get(id);
          if (request) {
            const result = resultMap.get(id);
            if (result) {
              request.resolve(result);
            } else {
              request.reject(new Error(`No data found for ID: ${id}`));
            }
            newPendingRequests.delete(id);
          }
        });

        return {
          ...prev,
          pendingRequests: newPendingRequests,
          loading: newPendingRequests.size > 0,
        };
      });

      // Reset retry counts for successful requests
      requestIds.forEach(id => {
        retryCountRef.current.delete(id);
      });

      onBatchComplete?.(results, requestIds.length);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setState(prev => {
        const newPendingRequests = new Map(prev.pendingRequests);
        
        requestIds.forEach(id => {
          const request = newPendingRequests.get(id);
          if (request) {
            request.reject(error instanceof Error ? error : new Error(errorMessage));
            newPendingRequests.delete(id);
          }
        });

        return {
          ...prev,
          pendingRequests: newPendingRequests,
          loading: newPendingRequests.size > 0,
          error: errorMessage,
        };
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [
    fetcher,
    keyExtractor,
    batchSize,
    retryAttempts,
    retryDelay,
    setCachedData,
    onError,
    onBatchComplete,
  ]);

  // Schedule batch execution
  const scheduleBatch = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      const requestIds = Array.from(state.pendingRequests.keys());
      if (requestIds.length > 0) {
        // Split into batches if needed
        const batches: string[][] = [];
        for (let i = 0; i < requestIds.length; i += batchSize) {
          batches.push(requestIds.slice(i, i + batchSize));
        }

        // Execute batches
        batches.forEach(batch => {
          executeBatch(batch);
        });
      }
    }, batchDelay);
  }, [state.pendingRequests, batchSize, batchDelay, executeBatch]);

  // Load single item
  const load = useCallback((id: string): Promise<T> => {
    // Check cache first
    const cached = getCachedData(id);
    if (cached) {
      trackHVACUserAction('data_loader_cache_hit', 'PERFORMANCE', { id });
      return Promise.resolve(cached);
    }

    // Check if already pending
    const existing = state.pendingRequests.get(id);
    if (existing) {
      return new Promise((resolve, reject) => {
        // Replace callbacks to handle multiple requests for same ID
        const originalResolve = existing.resolve;
        const originalReject = existing.reject;
        
        existing.resolve = (data: T) => {
          originalResolve(data);
          resolve(data);
        };
        
        existing.reject = (error: Error) => {
          originalReject(error);
          reject(error);
        };
      });
    }

    // Add to pending requests
    return new Promise((resolve, reject) => {
      setState(prev => {
        const newPendingRequests = new Map(prev.pendingRequests);
        newPendingRequests.set(id, {
          id,
          resolve,
          reject,
          timestamp: Date.now(),
        });

        return {
          ...prev,
          pendingRequests: newPendingRequests,
          loading: true,
        };
      });

      // Schedule batch execution
      scheduleBatch();
    });
  }, [getCachedData, state.pendingRequests, scheduleBatch]);

  // Load multiple items
  const loadMany = useCallback(async (ids: string[]): Promise<T[]> => {
    const promises = ids.map(id => load(id));
    return Promise.all(promises);
  }, [load]);

  // Clear cache
  const clearCache = useCallback((pattern?: string) => {
    setState(prev => {
      const newCache = new Map(prev.cache);
      
      if (pattern) {
        for (const key of newCache.keys()) {
          if (key.includes(pattern)) {
            newCache.delete(key);
          }
        }
      } else {
        newCache.clear();
      }

      return { ...prev, cache: newCache };
    });

    trackHVACUserAction('data_loader_cache_cleared', 'PERFORMANCE', {
      pattern: pattern || 'all',
    });
  }, []);

  // Preload data
  const preload = useCallback((ids: string[]) => {
    const uncachedIds = ids.filter(id => !getCachedData(id));
    if (uncachedIds.length > 0) {
      loadMany(uncachedIds).catch(() => {
        // Ignore preload errors
      });
    }
  }, [getCachedData, loadMany]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    loading: state.loading,
    error: state.error,
    cacheSize: state.cache.size,
    pendingCount: state.pendingRequests.size,

    // Loading functions
    load,
    loadMany,
    preload,

    // Cache management
    clearCache,
    getCachedData,

    // Utility functions
    isLoading: (id: string) => state.pendingRequests.has(id),
    isCached: (id: string) => !!getCachedData(id),
  };
};
