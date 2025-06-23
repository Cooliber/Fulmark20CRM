/**
 * HVAC CRM Sentry Initialization
 * "Pasja rodzi profesjonalizm" - Centralized error tracking initialization
 * 
 * This module handles the complete initialization of Sentry for HVAC CRM
 * following Twenty CRM cursor rules and Polish business requirements.
 */

import { 
  initHVACSentry,
  setHVACUserContext,
  clearHVACUserContext,
  addHVACBreadcrumb,
  reportHVACMessage,
  HVACErrorContexts 
} from '../config/sentry.config';

// User context interface for HVAC CRM
interface HVACUser {
  id: string;
  email?: string;
  role?: 'admin' | 'technician' | 'manager' | 'customer';
  company?: string;
  permissions?: string[];
}

// Application context interface
interface HVACAppContext {
  version: string;
  environment: string;
  buildTime?: string;
  gitCommit?: string;
  features?: string[];
}

// Initialization options
interface HVACSentryInitOptions {
  user?: HVACUser;
  appContext?: HVACAppContext;
  enablePerformanceMonitoring?: boolean;
  enableUserFeedback?: boolean;
  customTags?: Record<string, string>;
}

// Global initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Initialize Sentry for HVAC CRM with comprehensive setup
export const initializeHVACSentry = async (
  options: HVACSentryInitOptions = {}
): Promise<void> => {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log('✅ Sentry already initialized for HVAC CRM');
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = performInitialization(options);
  return initializationPromise;
};

// Perform the actual initialization
const performInitialization = async (options: HVACSentryInitOptions): Promise<void> => {
  try {
    // Initialize base Sentry configuration
    initHVACSentry();

    // Set user context if provided
    if (options.user) {
      setHVACUserContext(options.user);
      addHVACBreadcrumb(
        'User context set',
        'initialization',
        'info',
        { userId: options.user.id, role: options.user.role }
      );
    }

    // Set application context
    if (options.appContext) {
      addHVACBreadcrumb(
        'Application context set',
        'initialization',
        'info',
        options.appContext
      );
    }

    // Add custom tags if provided
    if (options.customTags) {
      addHVACBreadcrumb(
        'Custom tags applied',
        'initialization',
        'info',
        { tagsCount: Object.keys(options.customTags).length }
      );
    }

    // Report successful initialization
    reportHVACMessage(
      'HVAC CRM Sentry initialized successfully',
      'info',
      'AUTHENTICATION',
      {
        hasUser: !!options.user,
        hasAppContext: !!options.appContext,
        performanceMonitoring: options.enablePerformanceMonitoring ?? true,
        userFeedback: options.enableUserFeedback ?? true,
      }
    );

    isInitialized = true;
    console.log('✅ HVAC CRM Sentry initialization completed');

  } catch (error) {
    console.error('❌ Failed to initialize HVAC CRM Sentry:', error);
    
    // Report initialization failure
    if (typeof window !== 'undefined') {
      reportHVACMessage(
        'HVAC CRM Sentry initialization failed',
        'error',
        'AUTHENTICATION',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
    
    throw error;
  }
};

// Update user context during runtime
export const updateHVACUserContext = (user: HVACUser): void => {
  if (!isInitialized) {
    console.warn('⚠️ Sentry not initialized, cannot update user context');
    return;
  }

  setHVACUserContext(user);
  
  addHVACBreadcrumb(
    'User context updated',
    'user_management',
    'info',
    { userId: user.id, role: user.role }
  );
};

// Clear user context (e.g., on logout)
export const clearHVACUserSession = (): void => {
  if (!isInitialized) {
    console.warn('⚠️ Sentry not initialized, cannot clear user context');
    return;
  }

  clearHVACUserContext();
  
  addHVACBreadcrumb(
    'User session cleared',
    'user_management',
    'info'
  );
};

// Track user actions for better error context
export const trackHVACUserAction = (
  action: string,
  context: keyof typeof HVACErrorContexts,
  metadata?: Record<string, any>
): void => {
  if (!isInitialized) {
    return;
  }

  addHVACBreadcrumb(
    `User action: ${action}`,
    'user_action',
    'info',
    {
      action,
      context: HVACErrorContexts[context],
      timestamp: new Date().toISOString(),
      ...metadata,
    }
  );
};

// Track navigation for better error context
export const trackHVACNavigation = (
  from: string,
  to: string,
  metadata?: Record<string, any>
): void => {
  if (!isInitialized) {
    return;
  }

  addHVACBreadcrumb(
    `Navigation: ${from} → ${to}`,
    'navigation',
    'info',
    {
      from,
      to,
      timestamp: new Date().toISOString(),
      ...metadata,
    }
  );
};

// Track API calls for better error context
export const trackHVACAPICall = (
  method: string,
  endpoint: string,
  status?: number,
  duration?: number,
  metadata?: Record<string, any>
): void => {
  if (!isInitialized) {
    return;
  }

  const level = status && status >= 400 ? 'warning' : 'info';

  addHVACBreadcrumb(
    `API Call: ${method} ${endpoint}`,
    'api_call',
    level,
    {
      method,
      endpoint,
      status,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    }
  );
};

// Track business operations for Polish compliance
export const trackPolishBusinessOperation = (
  operation: string,
  data: Record<string, any>
): void => {
  if (!isInitialized) {
    return;
  }

  addHVACBreadcrumb(
    `Polish Business Operation: ${operation}`,
    'business_operation',
    'info',
    {
      operation,
      country: 'Poland',
      currency: 'PLN',
      timezone: 'Europe/Warsaw',
      timestamp: new Date().toISOString(),
      ...data,
    }
  );
};

// Get initialization status
export const isHVACSentryInitialized = (): boolean => {
  return isInitialized;
};

// Force re-initialization (use with caution)
export const reinitializeHVACSentry = async (
  options: HVACSentryInitOptions = {}
): Promise<void> => {
  isInitialized = false;
  initializationPromise = null;
  
  return initializeHVACSentry(options);
};

// Export utility functions for external use
export {
  addHVACBreadcrumb,
  reportHVACMessage,
  HVACErrorContexts,
} from '../config/sentry.config';
