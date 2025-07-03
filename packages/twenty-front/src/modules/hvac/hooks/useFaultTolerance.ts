/**
 * HVAC Fault Tolerance Hooks
 * "Pasja rodzi profesjonalizm" - Professional fault tolerance for HVAC systems
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - Functional components only
 */

import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

// Types
export interface FaultToleranceConfig {
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  healthCheckInterval: number;
  enableLogging: boolean;
}

export interface FaultToleranceResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  retry: () => void;
  isHealthy: boolean;
}

export type ServiceType = 'api' | 'search' | 'auth' | 'graphql' | 'external';

// Default configuration
const DEFAULT_CONFIG: FaultToleranceConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  healthCheckInterval: 30000,
  enableLogging: true,
};

/**
 * Main fault tolerance hook
 */
export const useFaultTolerance = <T>(
  operation: () => Promise<T>,
  config: Partial<FaultToleranceConfig> = {}
): FaultToleranceResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const executeOperation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (retryCount < finalConfig.maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          executeOperation();
        }, finalConfig.retryDelay * Math.pow(2, retryCount));
      }
    } finally {
      setIsLoading(false);
    }
  }, [operation, retryCount, finalConfig]);

  const retry = useCallback(() => {
    setRetryCount(0);
    executeOperation();
  }, [executeOperation]);

  return {
    data,
    error,
    isLoading,
    retry,
    isHealthy: error === null && retryCount < finalConfig.circuitBreakerThreshold,
  };
};

/**
 * Health monitoring hook
 */
export const useFaultToleranceHealth = (
  serviceType: ServiceType,
  config: Partial<FaultToleranceConfig> = {}
) => {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [errorCount, setErrorCount] = useState(0);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    const interval = setInterval(() => {
      // Simple health check - in real implementation would ping actual service
      const healthStatus = errorCount < finalConfig.circuitBreakerThreshold;
      setIsHealthy(healthStatus);
      setLastCheck(new Date());
    }, finalConfig.healthCheckInterval);

    return () => clearInterval(interval);
  }, [errorCount, finalConfig]);

  return {
    isHealthy,
    lastCheck,
    errorCount,
    serviceType,
  };
};

/**
 * Fault tolerant API hook
 */
export const useFaultTolerantApi = <T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = []
) => {
  return useFaultTolerance(apiCall, {
    maxRetries: 3,
    retryDelay: 1000,
    enableLogging: true,
  });
};

/**
 * Fault tolerant search hook
 */
export const useFaultTolerantSearch = <T>(
  searchFunction: (query: string) => Promise<T>,
  query: string
) => {
  const searchOperation = useCallback(() => {
    return searchFunction(query);
  }, [searchFunction, query]);

  return useFaultTolerance(searchOperation, {
    maxRetries: 2,
    retryDelay: 500,
    enableLogging: false, // Search errors are less critical
  });
};
