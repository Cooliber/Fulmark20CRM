/**
 * HVAC Enhanced Error Handling Service
 * "Pasja rodzi profesjonalizm" - Professional error handling for Polish HVAC systems
 * 
 * Implements HVAC-specific error types with recovery strategies and structured logging
 * with correlation IDs for comprehensive troubleshooting
 */

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';

// HVAC-specific error types
export enum HvacErrorType {
  EQUIPMENT_CONNECTION_ERROR = 'EQUIPMENT_CONNECTION_ERROR',
  MAINTENANCE_SCHEDULE_ERROR = 'MAINTENANCE_SCHEDULE_ERROR',
  CUSTOMER_DATA_ERROR = 'CUSTOMER_DATA_ERROR',
  WEATHER_API_ERROR = 'WEATHER_API_ERROR',
  BILLING_INTEGRATION_ERROR = 'BILLING_INTEGRATION_ERROR',
  IOT_DEVICE_ERROR = 'IOT_DEVICE_ERROR',
  TECHNICIAN_ASSIGNMENT_ERROR = 'TECHNICIAN_ASSIGNMENT_ERROR',
  INVENTORY_ERROR = 'INVENTORY_ERROR',
  COMPLIANCE_ERROR = 'COMPLIANCE_ERROR',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION'
}

export enum HvacErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum HvacErrorCategory {
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  OPERATIONAL = 'operational',
  SECURITY = 'security',
  COMPLIANCE = 'compliance'
}

export interface HvacErrorMetadata {
  correlationId: string;
  timestamp: number;
  userId?: string;
  customerId?: string;
  equipmentId?: string;
  technicianId?: string;
  location?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  additionalContext?: Record<string, unknown>;
}

export interface HvacRecoveryStrategy {
  retryable: boolean;
  maxRetries: number;
  retryDelayMs: number;
  fallbackAction?: () => Promise<unknown>;
  escalationRequired: boolean;
  notificationRequired: boolean;
  automaticResolution: boolean;
}

export interface HvacErrorDetails {
  type: HvacErrorType;
  severity: HvacErrorSeverity;
  category: HvacErrorCategory;
  message: string;
  originalError: Error;
  metadata: HvacErrorMetadata;
  recoveryStrategy: HvacRecoveryStrategy;
  polishContext?: {
    equipmentBrand?: string;
    heatingType?: 'gas' | 'electric' | 'heat_pump' | 'biomass';
    buildingType?: 'residential' | 'commercial' | 'industrial';
    region?: 'warsaw' | 'krakow' | 'gdansk' | 'wroclaw' | 'poznan' | 'other';
    seasonalContext?: 'heating_season' | 'cooling_season' | 'transition';
  };
}

export class HvacError extends Error {
  public readonly correlationId: string;
  public readonly type: HvacErrorType;
  public readonly severity: HvacErrorSeverity;
  public readonly category: HvacErrorCategory;
  public readonly metadata: HvacErrorMetadata;
  public readonly recoveryStrategy: HvacRecoveryStrategy;
  public readonly polishContext?: HvacErrorDetails['polishContext'];

  constructor(details: HvacErrorDetails) {
    super(details.message);
    this.name = 'HvacError';
    this.correlationId = details.metadata.correlationId;
    this.type = details.type;
    this.severity = details.severity;
    this.category = details.category;
    this.metadata = details.metadata;
    this.recoveryStrategy = details.recoveryStrategy;
    this.polishContext = details.polishContext;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HvacError);
    }
  }
}

@Injectable()
export class HvacErrorHandlerService {
  private readonly logger = new Logger(HvacErrorHandlerService.name);
  private readonly errorStats = new Map<HvacErrorType, number>();
  private readonly recoveryAttempts = new Map<string, number>();

  // Recovery strategies for different error types
  private readonly RECOVERY_STRATEGIES: Record<HvacErrorType, HvacRecoveryStrategy> = {
    [HvacErrorType.EQUIPMENT_CONNECTION_ERROR]: {
      retryable: true,
      maxRetries: 3,
      retryDelayMs: 5000,
      escalationRequired: true,
      notificationRequired: true,
      automaticResolution: false
    },
    [HvacErrorType.MAINTENANCE_SCHEDULE_ERROR]: {
      retryable: true,
      maxRetries: 2,
      retryDelayMs: 2000,
      escalationRequired: false,
      notificationRequired: true,
      automaticResolution: true
    },
    [HvacErrorType.CUSTOMER_DATA_ERROR]: {
      retryable: true,
      maxRetries: 2,
      retryDelayMs: 1000,
      escalationRequired: false,
      notificationRequired: false,
      automaticResolution: true
    },
    [HvacErrorType.WEATHER_API_ERROR]: {
      retryable: true,
      maxRetries: 5,
      retryDelayMs: 3000,
      escalationRequired: false,
      notificationRequired: false,
      automaticResolution: true
    },
    [HvacErrorType.BILLING_INTEGRATION_ERROR]: {
      retryable: true,
      maxRetries: 3,
      retryDelayMs: 2000,
      escalationRequired: true,
      notificationRequired: true,
      automaticResolution: false
    },
    [HvacErrorType.IOT_DEVICE_ERROR]: {
      retryable: true,
      maxRetries: 4,
      retryDelayMs: 2500,
      escalationRequired: true,
      notificationRequired: true,
      automaticResolution: false
    },
    [HvacErrorType.TECHNICIAN_ASSIGNMENT_ERROR]: {
      retryable: true,
      maxRetries: 2,
      retryDelayMs: 1500,
      escalationRequired: true,
      notificationRequired: true,
      automaticResolution: false
    },
    [HvacErrorType.INVENTORY_ERROR]: {
      retryable: true,
      maxRetries: 2,
      retryDelayMs: 1000,
      escalationRequired: false,
      notificationRequired: true,
      automaticResolution: true
    },
    [HvacErrorType.COMPLIANCE_ERROR]: {
      retryable: false,
      maxRetries: 0,
      retryDelayMs: 0,
      escalationRequired: true,
      notificationRequired: true,
      automaticResolution: false
    },
    [HvacErrorType.PERFORMANCE_DEGRADATION]: {
      retryable: false,
      maxRetries: 0,
      retryDelayMs: 0,
      escalationRequired: true,
      notificationRequired: true,
      automaticResolution: false
    }
  };

  constructor(private readonly hvacSentryService: HvacSentryService) {}

  /**
   * Create a new HVAC error with proper metadata and correlation ID
   */
  createError(
    type: HvacErrorType,
    message: string,
    originalError: Error,
    metadata: Partial<HvacErrorMetadata> = {},
    polishContext?: HvacErrorDetails['polishContext']
  ): HvacError {
    const correlationId = metadata.correlationId || uuidv4();
    const severity = this.determineSeverity(type, originalError);
    const category = this.determineCategory(type);

    const fullMetadata: HvacErrorMetadata = {
      correlationId,
      timestamp: Date.now(),
      ...metadata
    };

    const recoveryStrategy = this.RECOVERY_STRATEGIES[type];

    const errorDetails: HvacErrorDetails = {
      type,
      severity,
      category,
      message,
      originalError,
      metadata: fullMetadata,
      recoveryStrategy,
      polishContext
    };

    const hvacError = new HvacError(errorDetails);

    // Log the error with structured data
    this.logStructuredError(hvacError);

    // Update error statistics
    this.updateErrorStats(type);

    // Report to Sentry
    this.reportToSentry(hvacError);

    return hvacError;
  }

  /**
   * Handle error with automatic recovery attempts
   */
  async handleErrorWithRecovery<T>(
    error: HvacError,
    recoveryFunction: () => Promise<T>
  ): Promise<T | null> {
    const { correlationId, type, recoveryStrategy } = error;

    if (!recoveryStrategy.retryable) {
      this.logger.error(`Error ${type} is not retryable`, { correlationId });
      await this.escalateIfRequired(error);
      return null;
    }

    const currentAttempts = this.recoveryAttempts.get(correlationId) || 0;

    if (currentAttempts >= recoveryStrategy.maxRetries) {
      this.logger.error(`Max recovery attempts exceeded for ${type}`, {
        correlationId,
        attempts: currentAttempts
      });
      await this.escalateIfRequired(error);
      return null;
    }

    try {
      // Increment attempt counter
      this.recoveryAttempts.set(correlationId, currentAttempts + 1);

      // Wait before retry
      if (recoveryStrategy.retryDelayMs > 0) {
        await this.sleep(recoveryStrategy.retryDelayMs);
      }

      this.logger.log(`Attempting recovery for ${type}`, {
        correlationId,
        attempt: currentAttempts + 1,
        maxRetries: recoveryStrategy.maxRetries
      });

      const result = await recoveryFunction();

      // Success - clear attempt counter
      this.recoveryAttempts.delete(correlationId);

      this.logger.log(`Recovery successful for ${type}`, { correlationId });

      return result;

    } catch (recoveryError) {
      this.logger.error(`Recovery attempt failed for ${type}`, {
        correlationId,
        attempt: currentAttempts + 1,
        error: recoveryError
      });

      // If this was the last attempt, escalate
      if (currentAttempts + 1 >= recoveryStrategy.maxRetries) {
        await this.escalateIfRequired(error);
      }

      throw recoveryError;
    }
  }

  /**
   * Execute fallback action if available
   */
  async executeFallback(error: HvacError): Promise<unknown> {
    const { recoveryStrategy, correlationId, type } = error;

    if (!recoveryStrategy.fallbackAction) {
      this.logger.warn(`No fallback action available for ${type}`, { correlationId });
      return null;
    }

    try {
      this.logger.log(`Executing fallback for ${type}`, { correlationId });
      const result = await recoveryStrategy.fallbackAction();
      this.logger.log(`Fallback successful for ${type}`, { correlationId });
      return result;
    } catch (fallbackError) {
      this.logger.error(`Fallback failed for ${type}`, {
        correlationId,
        error: fallbackError
      });
      throw fallbackError;
    }
  }

  private determineSeverity(type: HvacErrorType, originalError: Error): HvacErrorSeverity {
    // Critical errors that affect system availability
    if ([
      HvacErrorType.EQUIPMENT_CONNECTION_ERROR,
      HvacErrorType.COMPLIANCE_ERROR,
      HvacErrorType.PERFORMANCE_DEGRADATION
    ].includes(type)) {
      return HvacErrorSeverity.CRITICAL;
    }

    // High severity errors that affect business operations
    if ([
      HvacErrorType.BILLING_INTEGRATION_ERROR,
      HvacErrorType.IOT_DEVICE_ERROR,
      HvacErrorType.TECHNICIAN_ASSIGNMENT_ERROR
    ].includes(type)) {
      return HvacErrorSeverity.HIGH;
    }

    // Medium severity errors that affect functionality
    if ([
      HvacErrorType.MAINTENANCE_SCHEDULE_ERROR,
      HvacErrorType.INVENTORY_ERROR
    ].includes(type)) {
      return HvacErrorSeverity.MEDIUM;
    }

    // Low severity errors (data retrieval, external APIs)
    return HvacErrorSeverity.LOW;
  }

  private determineCategory(type: HvacErrorType): HvacErrorCategory {
    switch (type) {
      case HvacErrorType.EQUIPMENT_CONNECTION_ERROR:
      case HvacErrorType.IOT_DEVICE_ERROR:
      case HvacErrorType.PERFORMANCE_DEGRADATION:
        return HvacErrorCategory.TECHNICAL;

      case HvacErrorType.BILLING_INTEGRATION_ERROR:
      case HvacErrorType.CUSTOMER_DATA_ERROR:
        return HvacErrorCategory.BUSINESS;

      case HvacErrorType.MAINTENANCE_SCHEDULE_ERROR:
      case HvacErrorType.TECHNICIAN_ASSIGNMENT_ERROR:
      case HvacErrorType.INVENTORY_ERROR:
        return HvacErrorCategory.OPERATIONAL;

      case HvacErrorType.COMPLIANCE_ERROR:
        return HvacErrorCategory.COMPLIANCE;

      default:
        return HvacErrorCategory.TECHNICAL;
    }
  }

  private logStructuredError(error: HvacError): void {
    const logData = {
      correlationId: error.correlationId,
      type: error.type,
      severity: error.severity,
      category: error.category,
      message: error.message,
      metadata: error.metadata,
      polishContext: error.polishContext,
      stack: error.stack
    };

    switch (error.severity) {
      case HvacErrorSeverity.CRITICAL:
        this.logger.error('CRITICAL HVAC Error', logData);
        break;
      case HvacErrorSeverity.HIGH:
        this.logger.error('HIGH HVAC Error', logData);
        break;
      case HvacErrorSeverity.MEDIUM:
        this.logger.warn('MEDIUM HVAC Error', logData);
        break;
      case HvacErrorSeverity.LOW:
        this.logger.log('LOW HVAC Error', logData);
        break;
    }
  }

  private updateErrorStats(type: HvacErrorType): void {
    const currentCount = this.errorStats.get(type) || 0;
    this.errorStats.set(type, currentCount + 1);
  }

  private reportToSentry(error: HvacError): void {
    const sentryLevel = this.mapSeverityToSentryLevel(error.severity);

    this.hvacSentryService.reportHVACError(
      error.originalError,
      {
        context: this.mapCategoryToSentryContext(error.category),
        operation: error.type,
        customerId: error.metadata.customerId,
        equipmentId: error.metadata.equipmentId,
        technicianId: error.metadata.technicianId,
        additionalData: {
          correlationId: error.correlationId,
          polishContext: error.polishContext,
          ...error.metadata.additionalContext
        }
      },
      sentryLevel
    );
  }

  /**
   * Enhanced error reporting with Twenty CRM integration
   */
  reportToTwentyErrorSystem(error: HvacError): void {
    try {
      // Report to Twenty's exception handler service
      this.exceptionHandlerService.captureExceptions([error.originalError], {
        user: error.metadata.userId ? { id: error.metadata.userId } : undefined,
        workspace: error.metadata.workspaceId ? { id: error.metadata.workspaceId } : undefined,
        operation: {
          name: error.type,
          type: 'hvac_operation',
        },
      });
    } catch (reportingError) {
      this.logger.error('Failed to report HVAC error to Twenty system', {
        originalError: error,
        reportingError,
      });
    }
  }

  /**
   * Create user-friendly error messages in Polish
   */
  createPolishErrorMessage(error: HvacError): string {
    const polishMessages = {
      [HvacErrorType.API_CONNECTION_FAILED]: 'Błąd połączenia z systemem HVAC. Sprawdź połączenie internetowe.',
      [HvacErrorType.AUTHENTICATION_FAILED]: 'Błąd uwierzytelniania. Sprawdź dane logowania.',
      [HvacErrorType.PERMISSION_DENIED]: 'Brak uprawnień do wykonania tej operacji.',
      [HvacErrorType.RESOURCE_NOT_FOUND]: 'Nie znaleziono żądanego zasobu.',
      [HvacErrorType.VALIDATION_FAILED]: 'Błąd walidacji danych. Sprawdź wprowadzone informacje.',
      [HvacErrorType.RATE_LIMIT_EXCEEDED]: 'Przekroczono limit żądań. Spróbuj ponownie za chwilę.',
      [HvacErrorType.SERVICE_UNAVAILABLE]: 'Usługa HVAC jest tymczasowo niedostępna.',
      [HvacErrorType.TIMEOUT]: 'Przekroczono czas oczekiwania na odpowiedź.',
      [HvacErrorType.DATA_CORRUPTION]: 'Wykryto uszkodzenie danych. Skontaktuj się z administratorem.',
      [HvacErrorType.CONFIGURATION_ERROR]: 'Błąd konfiguracji systemu. Skontaktuj się z administratorem.',
      [HvacErrorType.EXTERNAL_SERVICE_ERROR]: 'Błąd zewnętrznego serwisu. Spróbuj ponownie później.',
      [HvacErrorType.BUSINESS_RULE_VIOLATION]: 'Naruszenie reguł biznesowych.',
      [HvacErrorType.CONCURRENCY_CONFLICT]: 'Konflikt współbieżności. Odśwież dane i spróbuj ponownie.',
      [HvacErrorType.QUOTA_EXCEEDED]: 'Przekroczono limit zasobów.',
      [HvacErrorType.MAINTENANCE_MODE]: 'System jest w trybie konserwacji.',
    };

    return polishMessages[error.type] || 'Wystąpił nieoczekiwany błąd systemu HVAC.';
  }

  private mapSeverityToSentryLevel(severity: HvacErrorSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case HvacErrorSeverity.CRITICAL:
      case HvacErrorSeverity.HIGH:
        return 'error';
      case HvacErrorSeverity.MEDIUM:
        return 'warning';
      case HvacErrorSeverity.LOW:
        return 'info';
    }
  }

  private mapCategoryToSentryContext(category: HvacErrorCategory): HVACErrorContext {
    switch (category) {
      case HvacErrorCategory.TECHNICAL:
        return HVACErrorContext.HVAC_API_INTEGRATION;
      case HvacErrorCategory.BUSINESS:
        return HVACErrorContext.CUSTOMER_MANAGEMENT;
      case HvacErrorCategory.OPERATIONAL:
        return HVACErrorContext.MAINTENANCE_SCHEDULING;
      case HvacErrorCategory.COMPLIANCE:
        return HVACErrorContext.CONFIGURATION;
      default:
        return HVACErrorContext.HVAC_API_INTEGRATION;
    }
  }

  private async escalateIfRequired(error: HvacError): Promise<void> {
    if (!error.recoveryStrategy.escalationRequired) {
      return;
    }

    this.logger.error(`Escalating error ${error.type}`, {
      correlationId: error.correlationId,
      severity: error.severity
    });

    // In production, implement actual escalation logic:
    // - Send alerts to on-call engineers
    // - Create tickets in issue tracking system
    // - Notify management for critical errors
    // - Trigger automated incident response
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): Map<HvacErrorType, number> {
    return new Map(this.errorStats);
  }

  /**
   * Clear error statistics (for testing or periodic reset)
   */
  clearErrorStats(): void {
    this.errorStats.clear();
    this.recoveryAttempts.clear();
  }

  /**
   * Get recovery attempt count for a correlation ID
   */
  getRecoveryAttempts(correlationId: string): number {
    return this.recoveryAttempts.get(correlationId) || 0;
  }

  /**
   * Create equipment connection error with Polish context
   */
  createEquipmentError(
    message: string,
    originalError: Error,
    equipmentId: string,
    metadata: Partial<HvacErrorMetadata> = {},
    polishContext?: HvacErrorDetails['polishContext']
  ): HvacError {
    return this.createError(
      HvacErrorType.EQUIPMENT_CONNECTION_ERROR,
      message,
      originalError,
      { ...metadata, equipmentId },
      polishContext
    );
  }

  /**
   * Create maintenance scheduling error
   */
  createMaintenanceError(
    message: string,
    originalError: Error,
    customerId?: string,
    technicianId?: string,
    metadata: Partial<HvacErrorMetadata> = {}
  ): HvacError {
    return this.createError(
      HvacErrorType.MAINTENANCE_SCHEDULE_ERROR,
      message,
      originalError,
      { ...metadata, customerId, technicianId }
    );
  }

  /**
   * Create weather API error
   */
  createWeatherApiError(
    message: string,
    originalError: Error,
    location?: string,
    metadata: Partial<HvacErrorMetadata> = {}
  ): HvacError {
    return this.createError(
      HvacErrorType.WEATHER_API_ERROR,
      message,
      originalError,
      { ...metadata, location }
    );
  }

  /**
   * Create IoT device error with Polish equipment context
   */
  createIoTDeviceError(
    message: string,
    originalError: Error,
    equipmentId: string,
    metadata: Partial<HvacErrorMetadata> = {},
    polishContext?: HvacErrorDetails['polishContext']
  ): HvacError {
    return this.createError(
      HvacErrorType.IOT_DEVICE_ERROR,
      message,
      originalError,
      { ...metadata, equipmentId },
      polishContext
    );
  }
}
