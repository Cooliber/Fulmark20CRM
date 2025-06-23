/**
 * useCustomer360 Hook - Customer 360 Data Management
 * "Pasja rodzi profesjonalizm" - Professional React hook architecture
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper error handling
 * - Performance optimization with debouncing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  customerAPIService, 
  Customer360Data, 
  Customer,
  type CustomerAPIService 
} from '../services/CustomerAPIService';
import { useHVACErrorReporting, useHVACPerformanceMonitoring } from '../index';

// Hook state interface
interface UseCustomer360State {
  data: Customer360Data | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

// Hook return interface
interface UseCustomer360Return extends UseCustomer360State {
  loadCustomerData: () => Promise<void>;
  refreshCustomerData: () => Promise<void>;
  updateCustomer: (updates: Partial<Customer>) => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

// Hook options interface
interface UseCustomer360Options {
  autoLoad?: boolean;
  enableCache?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  onDataLoaded?: (data: Customer360Data) => void;
}

/**
 * Custom hook for managing Customer 360 data
 * Implements proper loading states, error handling, and caching
 */
export const useCustomer360 = (
  customerId: string,
  options: UseCustomer360Options = {}
): UseCustomer360Return => {
  const {
    autoLoad = true,
    enableCache = true,
    refreshInterval,
    onError,
    onDataLoaded,
  } = options;

  // State management
  const [state, setState] = useState<UseCustomer360State>({
    data: null,
    loading: false,
    error: null,
    refreshing: false,
  });

  // HVAC monitoring hooks
  const { reportError, addBreadcrumb } = useHVACErrorReporting();
  const { measureAsync } = useHVACPerformanceMonitoring();

  // Refs for cleanup and debouncing
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load customer data with performance monitoring and error handling
   */
  const loadCustomerData = useCallback(async (): Promise<void> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({ 
        ...prev, 
        loading: !prev.data, // Don't show loading if we have cached data
        error: null 
      }));

      addBreadcrumb(`Loading Customer 360 data for: ${customerId}`, 'data_loading');

      const data = await measureAsync(
        'customer_360_load',
        'CUSTOMER_360',
        async () => {
          if (!enableCache) {
            // Clear cache if caching is disabled
            customerAPIService['invalidateCustomerCache'](customerId);
          }
          
          return await customerAPIService.getCustomer360Data(customerId);
        },
        { customerId, enableCache }
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        refreshing: false,
        error: null,
      }));

      addBreadcrumb('Customer 360 data loaded successfully', 'data_loading');
      onDataLoaded?.(data);

    } catch (error) {
      // Don't update state if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to load customer data';
      
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: errorMessage,
      }));

      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      reportError(errorObj, 'CUSTOMER_360', { 
        customerId, 
        operation: 'load_data',
        enableCache 
      });
      
      onError?.(errorObj);
    }
  }, [customerId, enableCache, measureAsync, addBreadcrumb, reportError, onError, onDataLoaded]);

  /**
   * Refresh customer data (force reload from API)
   */
  const refreshCustomerData = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, refreshing: true }));
    
    // Clear cache for fresh data
    customerAPIService['invalidateCustomerCache'](customerId);
    
    await loadCustomerData();
  }, [customerId, loadCustomerData]);

  /**
   * Update customer information
   */
  const updateCustomer = useCallback(async (updates: Partial<Customer>): Promise<void> => {
    try {
      addBreadcrumb(`Updating customer: ${customerId}`, 'data_update');

      const updatedCustomer = await measureAsync(
        'customer_update',
        'CUSTOMER_360',
        () => customerAPIService.updateCustomer(customerId, updates),
        { customerId, updates: Object.keys(updates) }
      );

      // Update local state
      setState(prev => ({
        ...prev,
        data: prev.data ? {
          ...prev.data,
          customer: updatedCustomer,
        } : null,
      }));

      addBreadcrumb('Customer updated successfully', 'data_update');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      
      reportError(errorObj, 'CUSTOMER_360', { 
        customerId, 
        operation: 'update_customer',
        updates: Object.keys(updates)
      });
      
      throw errorObj;
    }
  }, [customerId, measureAsync, addBreadcrumb, reportError]);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Invalidate cache manually
   */
  const invalidateCache = useCallback((): void => {
    customerAPIService['invalidateCustomerCache'](customerId);
    addBreadcrumb(`Cache invalidated for customer: ${customerId}`, 'cache_management');
  }, [customerId, addBreadcrumb]);

  /**
   * Auto-load data on mount if enabled
   */
  useEffect(() => {
    if (autoLoad && customerId) {
      loadCustomerData();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoLoad, customerId, loadCustomerData]);

  /**
   * Set up auto-refresh if interval is specified
   */
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        if (!state.loading && !state.refreshing) {
          refreshCustomerData();
        }
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, refreshCustomerData, state.loading, state.refreshing]);

  return {
    ...state,
    loadCustomerData,
    refreshCustomerData,
    updateCustomer,
    clearError,
    invalidateCache,
  };
};

/**
 * Hook for managing multiple customers (for lists, etc.)
 */
export const useCustomerList = () => {
  // TODO: Implement customer list management
  // This will be used for customer search, filtering, and pagination
  return {
    customers: [],
    loading: false,
    error: null,
    searchCustomers: async () => {},
    loadMore: async () => {},
  };
};
