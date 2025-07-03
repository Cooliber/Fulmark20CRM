/**
 * HVAC Placeholder Functions
 * "Pasja rodzi profesjonalizm" - Temporary placeholder functions for HVAC
 * 
 * These are temporary placeholder functions to enable build success
 * while we implement the full HVAC functionality.
 */

// Placeholder performance monitoring hook
export const useHVACPerformanceMonitoring = () => {
  return {
    metrics: {
      loadTime: 0,
      renderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
    },
    isMonitoring: false,
    startMonitoring: () => {},
    stopMonitoring: () => {},
    getMetrics: () => ({}),
    addPerformanceBreadcrumb: (message: string, data?: Record<string, unknown>) => {
      console.log('HVAC Performance Breadcrumb:', { message, data });
    },
  };
};

// Placeholder tracking function
export const trackHVACUserAction = (action: string, context: string, data?: Record<string, unknown>) => {
  console.log('HVAC User Action:', { action, context, data });
};

// Placeholder error reporting hook
export const useHVACErrorReporting = () => {
  return {
    reportError: (error: Error | string, context?: string) => {
      console.error('HVAC Error:', { error, context });
    },
    reportWarning: (message: string, context?: string) => {
      console.warn('HVAC Warning:', { message, context });
    },
    reportInfo: (message: string, context?: string) => {
      console.info('HVAC Info:', { message, context });
    },
  };
};

// Placeholder performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  LOAD_TIME: 3000,
  RENDER_TIME: 100,
  BUNDLE_SIZE: 4700000, // 4.7MB
  MEMORY_USAGE: 50000000, // 50MB
} as const;
