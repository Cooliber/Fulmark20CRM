/**
 * HVAC Performance Monitoring Hook
 * "Pasja rodzi profesjonalizm" - Performance tracking and optimization
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Performance optimization with 300ms debouncing
 */

import { useCallback, useRef, useEffect } from 'react';
import { 
  startHVACTransaction, 
  addHVACBreadcrumb,
  reportHVACMessage,
  HVACErrorContext 
} from '../config/sentry.config';

// Performance metrics interface
interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operation: string;
  context: HVACErrorContext;
  metadata?: Record<string, any>;
}

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  FAST: 100,
  ACCEPTABLE: 300,
  SLOW: 1000,
  CRITICAL: 3000,
} as const;

// Hook return interface
interface HVACPerformanceMonitoring {
  startOperation: (operation: string, context: HVACErrorContext, metadata?: Record<string, any>) => string;
  endOperation: (operationId: string, additionalMetadata?: Record<string, any>) => void;
  measureAsync: <T>(
    operation: string,
    context: HVACErrorContext,
    asyncFn: () => Promise<T>,
    metadata?: Record<string, any>
  ) => Promise<T>;
  measureSync: <T>(
    operation: string,
    context: HVACErrorContext,
    syncFn: () => T,
    metadata?: Record<string, any>
  ) => T;
  addPerformanceBreadcrumb: (message: string, data?: Record<string, any>) => void;
}

// Active operations tracking
const activeOperations = new Map<string, PerformanceMetrics>();

// Generate unique operation ID
const generateOperationId = (): string => {
  return `hvac_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Determine performance level based on duration
const getPerformanceLevel = (duration: number): 'fast' | 'acceptable' | 'slow' | 'critical' => {
  if (duration <= PERFORMANCE_THRESHOLDS.FAST) return 'fast';
  if (duration <= PERFORMANCE_THRESHOLDS.ACCEPTABLE) return 'acceptable';
  if (duration <= PERFORMANCE_THRESHOLDS.SLOW) return 'slow';
  return 'critical';
};

// Report performance metrics to Sentry
const reportPerformanceMetrics = (metrics: PerformanceMetrics): void => {
  const { duration, operation, context, metadata } = metrics;
  
  if (!duration) return;

  const performanceLevel = getPerformanceLevel(duration);
  
  // Add performance breadcrumb
  addHVACBreadcrumb(
    `Operation completed: ${operation}`,
    'performance',
    performanceLevel === 'critical' ? 'warning' : 'info',
    {
      duration,
      performanceLevel,
      context,
      ...metadata,
    }
  );

  // Report slow operations as messages
  if (performanceLevel === 'slow' || performanceLevel === 'critical') {
    reportHVACMessage(
      `Slow operation detected: ${operation} took ${duration}ms`,
      performanceLevel === 'critical' ? 'warning' : 'info',
      context,
      {
        duration,
        performanceLevel,
        operation,
        threshold: performanceLevel === 'critical' ? PERFORMANCE_THRESHOLDS.CRITICAL : PERFORMANCE_THRESHOLDS.SLOW,
        ...metadata,
      }
    );
  }

  // Start Sentry transaction for detailed tracking
  const transaction = startHVACTransaction(operation, `hvac.${context}`);
  transaction.setData('duration', duration);
  transaction.setData('performanceLevel', performanceLevel);
  transaction.setData('context', context);
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      transaction.setData(key, value);
    });
  }
  transaction.finish();
};

// Main hook implementation
export const useHVACPerformanceMonitoring = (): HVACPerformanceMonitoring => {
  const operationsRef = useRef<Map<string, PerformanceMetrics>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Report any unfinished operations
      operationsRef.current.forEach((metrics, operationId) => {
        if (!metrics.endTime) {
          addHVACBreadcrumb(
            `Unfinished operation detected: ${metrics.operation}`,
            'performance',
            'warning',
            {
              operationId,
              context: metrics.context,
              startTime: metrics.startTime,
            }
          );
        }
      });
      operationsRef.current.clear();
    };
  }, []);

  // Start performance tracking for an operation
  const startOperation = useCallback((
    operation: string,
    context: HVACErrorContext,
    metadata?: Record<string, any>
  ): string => {
    const operationId = generateOperationId();
    const startTime = performance.now();

    const metrics: PerformanceMetrics = {
      startTime,
      operation,
      context,
      metadata,
    };

    operationsRef.current.set(operationId, metrics);
    activeOperations.set(operationId, metrics);

    // Add breadcrumb for operation start
    addHVACBreadcrumb(
      `Operation started: ${operation}`,
      'performance',
      'info',
      {
        operationId,
        context,
        ...metadata,
      }
    );

    return operationId;
  }, []);

  // End performance tracking for an operation
  const endOperation = useCallback((
    operationId: string,
    additionalMetadata?: Record<string, any>
  ): void => {
    const metrics = operationsRef.current.get(operationId);
    
    if (!metrics) {
      console.warn(`Performance monitoring: Operation ${operationId} not found`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metrics.startTime;

    const completedMetrics: PerformanceMetrics = {
      ...metrics,
      endTime,
      duration,
      metadata: {
        ...metrics.metadata,
        ...additionalMetadata,
      },
    };

    // Report metrics
    reportPerformanceMetrics(completedMetrics);

    // Cleanup
    operationsRef.current.delete(operationId);
    activeOperations.delete(operationId);
  }, []);

  // Measure async operation performance
  const measureAsync = useCallback(async <T>(
    operation: string,
    context: HVACErrorContext,
    asyncFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const operationId = startOperation(operation, context, metadata);

    try {
      const result = await asyncFn();
      endOperation(operationId, { success: true });
      return result;
    } catch (error) {
      endOperation(operationId, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, [startOperation, endOperation]);

  // Measure synchronous operation performance
  const measureSync = useCallback(<T>(
    operation: string,
    context: HVACErrorContext,
    syncFn: () => T,
    metadata?: Record<string, any>
  ): T => {
    const operationId = startOperation(operation, context, metadata);

    try {
      const result = syncFn();
      endOperation(operationId, { success: true });
      return result;
    } catch (error) {
      endOperation(operationId, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, [startOperation, endOperation]);

  // Add performance-related breadcrumb
  const addPerformanceBreadcrumb = useCallback((
    message: string,
    data?: Record<string, any>
  ): void => {
    addHVACBreadcrumb(message, 'performance', 'info', data);
  }, []);

  return {
    startOperation,
    endOperation,
    measureAsync,
    measureSync,
    addPerformanceBreadcrumb,
  };
};

// Utility hook for debounced operations (300ms as per cursor rules)
export const useHVACDebouncedPerformance = () => {
  const { measureAsync } = useHVACPerformanceMonitoring();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedMeasure = useCallback(async <T>(
    operation: string,
    context: HVACErrorContext,
    asyncFn: () => Promise<T>,
    delay: number = 300,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await measureAsync(
            `${operation} (debounced)`,
            context,
            asyncFn,
            { ...metadata, debounceDelay: delay }
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }, [measureAsync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedMeasure };
};

// Export performance thresholds for external use
export { PERFORMANCE_THRESHOLDS };
