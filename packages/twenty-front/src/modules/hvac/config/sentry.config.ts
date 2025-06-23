/**
 * Unified Sentry Configuration for HVAC CRM
 * "Pasja rodzi profesjonalizm" - Comprehensive error tracking and monitoring
 * 
 * This module provides centralized Sentry configuration following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Polish business context
 */

import * as Sentry from '@sentry/nextjs';
import { BrowserOptions } from '@sentry/react';

// HVAC-specific error contexts for better categorization
export const HVACErrorContexts = {
  CUSTOMER_360: 'customer_360',
  EQUIPMENT_MANAGEMENT: 'equipment_management', 
  SERVICE_TICKETS: 'service_tickets',
  SEMANTIC_SEARCH: 'semantic_search',
  WEAVIATE_INTEGRATION: 'weaviate_integration',
  API_INTEGRATION: 'api_integration',
  AUTHENTICATION: 'authentication',
  DATA_SYNC: 'data_sync',
  PERFORMANCE: 'performance',
  UI_COMPONENT: 'ui_component',
} as const;

export type HVACErrorContext = keyof typeof HVACErrorContexts;

// Polish business-specific error tags
export const PolishBusinessTags = {
  NIP_VALIDATION: 'nip_validation',
  REGON_VALIDATION: 'regon_validation', 
  VAT_CALCULATION: 'vat_calculation',
  INVOICE_GENERATION: 'invoice_generation',
  COMPLIANCE_CHECK: 'compliance_check',
} as const;

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Sentry DSN from environment
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Performance sampling rates
const PERFORMANCE_CONFIG = {
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  profilesSampleRate: isProduction ? 0.1 : 1.0,
  replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
};

// Error filtering configuration
const ERROR_FILTERS = {
  beforeSend(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
    // Filter out development-only errors in production
    if (isProduction && hint.originalException) {
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Skip hydration errors, HMR errors, and development warnings
        if (
          error.message.includes('hydration') ||
          error.message.includes('HMR') ||
          error.message.includes('development') ||
          error.message.includes('ResizeObserver loop limit exceeded')
        ) {
          return null;
        }
      }
    }

    // Add HVAC CRM context to all events
    event.tags = {
      ...event.tags,
      application: 'hvac-crm',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      region: 'PL',
      language: 'pl',
    };

    // Add Polish business context
    event.contexts = {
      ...event.contexts,
      business: {
        country: 'Poland',
        currency: 'PLN',
        timezone: 'Europe/Warsaw',
        compliance: 'EU_GDPR',
      },
    };

    return event;
  },

  beforeSendTransaction(event: Sentry.Event): Sentry.Event | null {
    // Filter out health check and development transactions
    if (
      event.transaction === 'GET /api/health' ||
      event.transaction === 'GET /_next/static' ||
      event.transaction?.includes('hot-update')
    ) {
      return null;
    }

    return event;
  },
};

// Main Sentry configuration
export const hvacSentryConfig: BrowserOptions = {
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  debug: isDevelopment,

  // Performance monitoring
  ...PERFORMANCE_CONFIG,

  // Error filtering
  ...ERROR_FILTERS,

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration({
      tracePropagationTargets: [
        'localhost:3001',
        'localhost:3002', 
        process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'http://localhost:3001',
      ],
    }),
    Sentry.replayIntegration(),
  ],

  // Additional configuration
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  
  // Initial scope
  initialScope: {
    tags: {
      component: 'hvac-crm-frontend',
      framework: 'nextjs',
      ui_library: 'primereact',
    },
  },
};

// Initialize Sentry for HVAC CRM
export const initHVACSentry = (): void => {
  if (!SENTRY_DSN) {
    console.warn('🚨 Sentry DSN not configured for HVAC CRM');
    return;
  }

  try {
    Sentry.init(hvacSentryConfig);
    
    // Set application context
    Sentry.setContext('application', {
      name: 'HVAC CRM',
      version: hvacSentryConfig.release,
      environment: hvacSentryConfig.environment,
      framework: 'Next.js + Twenty CRM',
    });

    console.log('✅ Sentry initialized for HVAC CRM');
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
};

// Custom error reporting functions for HVAC CRM
export const reportHVACError = (
  error: Error,
  context: HVACErrorContext,
  additionalData?: Record<string, any>
): void => {
  Sentry.withScope((scope) => {
    scope.setTag('hvac_context', HVACErrorContexts[context]);
    scope.setContext('hvac_operation', {
      context: HVACErrorContexts[context],
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
    
    // Add specific fingerprinting for HVAC errors
    scope.setFingerprint([HVACErrorContexts[context], error.name, error.message]);
    
    Sentry.captureException(error);
  });
};

export const reportHVACMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: HVACErrorContext,
  additionalData?: Record<string, any>
): void => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setTag('hvac_context', HVACErrorContexts[context]);
    }
    
    if (additionalData) {
      scope.setContext('custom', additionalData);
    }
    
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
};

// Polish business compliance error reporting
export const reportPolishBusinessError = (
  error: Error,
  businessContext: keyof typeof PolishBusinessTags,
  additionalData?: Record<string, any>
): void => {
  Sentry.withScope((scope) => {
    scope.setTag('polish_business_context', PolishBusinessTags[businessContext]);
    scope.setTag('compliance_issue', true);
    
    scope.setContext('polish_business', {
      context: PolishBusinessTags[businessContext],
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
    
    scope.setFingerprint(['polish_business', businessContext, error.message]);
    
    Sentry.captureException(error);
  });
};

// Performance monitoring helpers
export const startHVACTransaction = (name: string, operation: string) => {
  return Sentry.startTransaction({
    name,
    op: operation,
    tags: {
      component: 'hvac-crm',
    },
  });
};

export const addHVACBreadcrumb = (
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void => {
  Sentry.addBreadcrumb({
    message,
    category: `hvac.${category}`,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

// User context helpers
export const setHVACUserContext = (user: {
  id: string;
  email?: string;
  role?: string;
  company?: string;
}): void => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
    role: user.role,
    company: user.company,
  });
};

export const clearHVACUserContext = (): void => {
  Sentry.setUser(null);
};
