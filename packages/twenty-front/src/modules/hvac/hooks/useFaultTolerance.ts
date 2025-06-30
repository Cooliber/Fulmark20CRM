/**
 * useFaultTolerance Hook - Comprehensive Fault Tolerance
 * "Pasja rodzi profesjonalizm" - Professional Fault Tolerance Management
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization with circuit breaker and retry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  CircuitBreakerService, 
  hvacApiCircuitBreaker, 
  weaviateCircuitBreaker,
  searchCircuitBreaker,
  type CircuitBreakerState 
} from '../services/CircuitBreakerService';
import { 
  RetryService, 
  networkRetryService, 
  apiRetryService,
  searchRetryService,
  type RetryConfig,
  type RetryResult 
} from '../services/RetryService';
import { trackHVACUserAction } from '../index';

// Types
export type FaultToleranceConfig = {
  enableCircuitBreaker: boolean;
  enableRetry: boolean;
  enableFallback: boolean;
  circuitBreakerService?: CircuitBreakerService;
  retryService?: RetryService;
  retryConfig?: Partial<RetryConfig>;
  fallbackValue?: any;
  onError?: (error: Error, context: string) => void;
  onFallback?: (context: string) => void;
};

export type FaultToleranceResult<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
  circuitState: CircuitBreakerState;
  retryCount: number;
  usedFallback: boolean;
  execute: () => Promise<void>;
  reset: () => void;
};

export type ServiceType = 'api' | 'weaviate' | 'search' | 'custom';

// Default configuration
const DEFAULT_CONFIG: FaultToleranceConfig = {
  enableCircuitBreaker: true,
  enableRetry: true,
  enableFallback: true,
};

/**
 * Comprehensive fault tolerance hook
 */
export const useFaultTolerance = <T>(
  operation: () => Promise<T>,
  operationName: string,
  serviceType: ServiceType = 'api',
  config: Partial<FaultToleranceConfig> = {}
): FaultToleranceResult<T> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State management
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [circuitState, setCircuitState] = useState<CircuitBreakerState>('CLOSED');
  const [retryCount, setRetryCount] = useState(0);
  const [usedFallback, setUsedFallback] = useState(false);

  // Service references
  const circuitBreakerRef = useRef<CircuitBreakerService>();
  const retryServiceRef = useRef<RetryService>();

  // Initialize services based on service type
  useEffect(() => {
    if (finalConfig.enableCircuitBreaker) {
      switch (serviceType) {
        case 'api':
          circuitBreakerRef.current = finalConfig.circuitBreakerService || hvacApiCircuitBreaker;
          break;
        case 'weaviate':
          circuitBreakerRef.current = finalConfig.circuitBreakerService || weaviateCircuitBreaker;
          break;
        case 'search':
          circuitBreakerRef.current = finalConfig.circuitBreakerService || searchCircuitBreaker;
          break;
        default:
          circuitBreakerRef.current = finalConfig.circuitBreakerService || hvacApiCircuitBreaker;
      }
    }

    if (finalConfig.enableRetry) {
      switch (serviceType) {
        case 'api':
          retryServiceRef.current = finalConfig.retryService || apiRetryService;
          break;
        case 'weaviate':
          retryServiceRef.current = finalConfig.retryService || networkRetryService;
          break;
        case 'search':
          retryServiceRef.current = finalConfig.retryService || searchRetryService;
          break;
        default:
          retryServiceRef.current = finalConfig.retryService || networkRetryService;
      }
    }
  }, [serviceType, finalConfig]);

  // Execute operation with fault tolerance
  const execute = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setUsedFallback(false);
    setRetryCount(0);

    try {
      let result: T;

      // Execute with circuit breaker and retry
      if (finalConfig.enableCircuitBreaker && circuitBreakerRef.current) {
        if (finalConfig.enableRetry && retryServiceRef.current) {
          // Both circuit breaker and retry
          result = await circuitBreakerRef.current.execute(
            async () => {
              const retryResult = await retryServiceRef.current!.executeWithResult(
                operation,
                operationName,
                finalConfig.retryConfig
              );
              
              setRetryCount(retryResult.attempts - 1);
              
              if (!retryResult.success) {
                throw retryResult.error!;
              }
              
              return retryResult.result!;
            },
            operationName
          );
        } else {
          // Only circuit breaker
          result = await circuitBreakerRef.current.execute(operation, operationName);
        }
        
        setCircuitState(circuitBreakerRef.current.getState());
      } else if (finalConfig.enableRetry && retryServiceRef.current) {
        // Only retry
        const retryResult = await retryServiceRef.current.executeWithResult(
          operation,
          operationName,
          finalConfig.retryConfig
        );
        
        setRetryCount(retryResult.attempts - 1);
        
        if (!retryResult.success) {
          throw retryResult.error!;
        }
        
        result = retryResult.result!;
      } else {
        // No fault tolerance
        result = await operation();
      }

      setData(result);
      
      trackHVACUserAction('fault_tolerance_success', 'FAULT_TOLERANCE', {
        operationName,
        serviceType,
        retryCount,
        circuitState,
        usedFallback: false,
      });
    } catch (operationError) {
      const err = operationError as Error;
      
      // Try fallback if enabled
      if (finalConfig.enableFallback && finalConfig.fallbackValue !== undefined) {
        setData(finalConfig.fallbackValue);
        setUsedFallback(true);
        
        if (finalConfig.onFallback) {
          finalConfig.onFallback(operationName);
        }
        
        trackHVACUserAction('fault_tolerance_fallback', 'FAULT_TOLERANCE', {
          operationName,
          serviceType,
          error: err.message,
          retryCount,
          circuitState,
        });
      } else {
        setError(err);
        
        if (finalConfig.onError) {
          finalConfig.onError(err, operationName);
        }
        
        trackHVACUserAction('fault_tolerance_failure', 'FAULT_TOLERANCE', {
          operationName,
          serviceType,
          error: err.message,
          retryCount,
          circuitState,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [operation, operationName, serviceType, finalConfig, retryCount, circuitState]);

  // Reset state
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setRetryCount(0);
    setUsedFallback(false);
    
    if (circuitBreakerRef.current) {
      setCircuitState(circuitBreakerRef.current.getState());
    }
  }, []);

  return {
    data,
    error,
    loading,
    circuitState,
    retryCount,
    usedFallback,
    execute,
    reset,
  };
};

/**
 * Hook for monitoring fault tolerance health across services
 */
export const useFaultToleranceHealth = () => {
  const [healthStatus, setHealthStatus] = useState({
    api: hvacApiCircuitBreaker.getHealthStatus(),
    weaviate: weaviateCircuitBreaker.getHealthStatus(),
    search: searchCircuitBreaker.getHealthStatus(),
  });

  const refreshHealth = useCallback(() => {
    setHealthStatus({
      api: hvacApiCircuitBreaker.getHealthStatus(),
      weaviate: weaviateCircuitBreaker.getHealthStatus(),
      search: searchCircuitBreaker.getHealthStatus(),
    });
  }, []);

  // Auto-refresh health status
  useEffect(() => {
    const interval = setInterval(refreshHealth, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [refreshHealth]);

  const overallHealth = {
    isHealthy: Object.values(healthStatus).every(status => status.isHealthy),
    criticalServices: Object.entries(healthStatus)
      .filter(([, status]) => !status.isHealthy)
      .map(([service]) => service),
    message: Object.values(healthStatus).every(status => status.isHealthy)
      ? 'Wszystkie usługi działają prawidłowo'
      : 'Niektóre usługi wymagają uwagi',
  };

  return {
    healthStatus,
    overallHealth,
    refreshHealth,
  };
};

/**
 * Hook for creating fault-tolerant API calls
 */
export const useFaultTolerantApi = <T>(
  apiCall: () => Promise<T>,
  operationName: string,
  options: {
    fallbackValue?: T;
    enableFallback?: boolean;
    retryConfig?: Partial<RetryConfig>;
  } = {}
) => {
  return useFaultTolerance(
    apiCall,
    operationName,
    'api',
    {
      enableCircuitBreaker: true,
      enableRetry: true,
      enableFallback: options.enableFallback ?? true,
      fallbackValue: options.fallbackValue,
      retryConfig: options.retryConfig,
    }
  );
};

/**
 * Hook for creating fault-tolerant search operations
 */
export const useFaultTolerantSearch = <T>(
  searchOperation: () => Promise<T>,
  operationName: string,
  fallbackResults: T
) => {
  return useFaultTolerance(
    searchOperation,
    operationName,
    'search',
    {
      enableCircuitBreaker: true,
      enableRetry: true,
      enableFallback: true,
      fallbackValue: fallbackResults,
      retryConfig: {
        maxAttempts: 2,
        baseDelay: 300,
        strategy: 'FIXED',
      },
    }
  );
};
