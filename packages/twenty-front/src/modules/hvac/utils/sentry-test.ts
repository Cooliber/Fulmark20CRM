/**
 * Sentry Test Utilities for HVAC CRM
 * "Pasja rodzi profesjonalizm" - Quality through monitoring
 */

import * as Sentry from '@sentry/react';

export interface SentryTestResult {
  isConfigured: boolean;
  dsn?: string;
  environment?: string;
  release?: string;
  lastEventId?: string;
  error?: string;
}

/**
 * Test Sentry configuration and send a test event
 */
export const testSentryConfiguration = async (): Promise<SentryTestResult> => {
  try {
    // Check if Sentry is configured
    const client = Sentry.getClient();
    if (!client) {
      return {
        isConfigured: false,
        error: 'Sentry client not initialized'
      };
    }

    const options = client.getOptions();
    
    // Send a test event
    const eventId = Sentry.captureMessage('HVAC CRM Sentry Test - System Working Properly', 'info');
    
    // Add HVAC-specific context
    Sentry.setContext('hvac_test', {
      component: 'sentry-test',
      timestamp: new Date().toISOString(),
      system: 'Fulmark20CRM',
      quality_standard: 'Pasja rodzi profesjonalizm'
    });

    return {
      isConfigured: true,
      dsn: options.dsn ? `${options.dsn.substring(0, 20)}...` : undefined,
      environment: options.environment,
      release: options.release,
      lastEventId: eventId
    };
  } catch (error) {
    return {
      isConfigured: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test error reporting functionality
 */
export const testSentryErrorReporting = (): string => {
  try {
    // Create a test error with HVAC context
    const testError = new Error('HVAC CRM Test Error - Error Reporting Working');
    testError.name = 'HVACTestError';
    
    // Add HVAC-specific tags
    Sentry.setTag('component', 'hvac-test');
    Sentry.setTag('system', 'fulmark20crm');
    Sentry.setTag('quality_check', 'error_reporting');
    
    // Capture the error
    const eventId = Sentry.captureException(testError);
    
    return eventId;
  } catch (error) {
    throw new Error(`Failed to test error reporting: ${error}`);
  }
};

/**
 * Test performance monitoring
 */
export const testSentryPerformance = (): string => {
  // Use startSpan for performance monitoring
  const spanId = Sentry.startSpan({
    name: 'HVAC CRM Performance Test',
    op: 'test'
  }, (span) => {
    // Add HVAC-specific data
    // Modern Sentry API doesn't use setData on spans
    // Data is set via attributes in startSpan options
    span?.setAttributes({
      'system': 'Fulmark20CRM',
      'component': 'performance-test',
      'quality_standard': 'Pasja rodzi profesjonalizm'
    });

    // Simulate some work
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(span?.spanContext().traceId || 'test-trace-id');
      }, 100);
    });
  });

  return typeof spanId === 'string' ? spanId : 'test-trace-id';
};

/**
 * Set HVAC-specific user context
 */
export const setSentryHVACContext = (userInfo: {
  id?: string;
  email?: string;
  role?: string;
  company?: string;
}) => {
  Sentry.setUser({
    id: userInfo.id,
    email: userInfo.email,
    role: userInfo.role
  });
  
  Sentry.setContext('hvac_context', {
    company: userInfo.company || 'Fulmark HVAC',
    system: 'Fulmark20CRM',
    industry: 'HVAC',
    region: 'Poland',
    quality_standard: 'Pasja rodzi profesjonalizm'
  });
  
  Sentry.setTag('industry', 'hvac');
  Sentry.setTag('region', 'poland');
  Sentry.setTag('system', 'fulmark20crm');
};

/**
 * Log HVAC-specific breadcrumb
 */
export const addHVACBreadcrumb = (
  message: string,
  category: 'navigation' | 'user' | 'system' | 'hvac' = 'hvac',
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: {
      ...data,
      system: 'Fulmark20CRM',
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Capture HVAC-specific metric
 */
export const captureHVACMetric = (
  name: string,
  value: number,
  unit: string = 'none',
  tags?: Record<string, string>
) => {
  // Note: This would require Sentry's metrics feature
  // For now, we'll use a custom event
  Sentry.captureMessage(`HVAC Metric: ${name} = ${value} ${unit}`, 'info');
  
  Sentry.setContext('hvac_metric', {
    name,
    value,
    unit,
    timestamp: new Date().toISOString(),
    system: 'Fulmark20CRM',
    ...tags
  });
};
