import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

/**
 * HVAC-specific Sentry error tracking service
 * "Pasja rodzi profesjonalizm" - Professional error monitoring for HVAC CRM
 */

export enum HVACErrorContext {
  WEAVIATE_SEARCH = 'weaviate_search',
  HVAC_API_INTEGRATION = 'hvac_api_integration',
  CUSTOMER_OPERATION = 'customer_operation',
  SERVICE_TICKET = 'service_ticket',
  EQUIPMENT_MANAGEMENT = 'equipment_management',
  MAINTENANCE_RECORD = 'maintenance_record',
  TECHNICIAN_OPERATION = 'technician_operation',
  POLISH_COMPLIANCE = 'polish_compliance',
  BIELIK_AI = 'bielik_ai',
  CREWAI_ORCHESTRATION = 'crewai_orchestration',
  EMAIL_PROCESSING = 'email_processing',
  TRANSCRIPTION_ANALYSIS = 'transcription_analysis',
  SEMANTIC_INDEXING = 'semantic_indexing',
  CONFIGURATION = 'configuration',
  HEALTH_CHECK = 'health_check',
}

export interface HVACErrorMetadata {
  context: HVACErrorContext;
  operation?: string;
  customerId?: string;
  ticketId?: string;
  equipmentId?: string;
  technicianId?: string;
  weaviateQuery?: string;
  apiEndpoint?: string;
  additionalData?: Record<string, any>;
}

@Injectable()
export class HvacSentryService {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  /**
   * Report HVAC-specific errors with proper context and fingerprinting
   */
  reportHVACError(
    error: Error,
    metadata: HVACErrorMetadata,
    level: Sentry.SeverityLevel = 'error'
  ): string {
    return Sentry.withScope((scope) => {
      // Set HVAC-specific tags
      scope.setTag('hvac_context', metadata.context);
      scope.setTag('component', 'hvac-crm');
      scope.setTag('market', 'poland');
      scope.setTag('industry', 'hvac');
      
      // Set operation-specific tags
      if (metadata.operation) {
        scope.setTag('hvac_operation', metadata.operation);
      }
      
      // Set entity-specific tags for better filtering
      if (metadata.customerId) {
        scope.setTag('customer_id', metadata.customerId);
      }
      if (metadata.ticketId) {
        scope.setTag('ticket_id', metadata.ticketId);
      }
      if (metadata.equipmentId) {
        scope.setTag('equipment_id', metadata.equipmentId);
      }
      if (metadata.technicianId) {
        scope.setTag('technician_id', metadata.technicianId);
      }

      // Set HVAC-specific context
      scope.setContext('hvac_operation', {
        context: metadata.context,
        operation: metadata.operation,
        timestamp: new Date().toISOString(),
        environment: this.twentyConfigService.get('SENTRY_ENVIRONMENT'),
        ...metadata.additionalData,
      });

      // Set Weaviate-specific context if applicable
      if (metadata.weaviateQuery) {
        scope.setContext('weaviate', {
          query: metadata.weaviateQuery,
          context: metadata.context,
        });
      }

      // Set API-specific context if applicable
      if (metadata.apiEndpoint) {
        scope.setContext('api', {
          endpoint: metadata.apiEndpoint,
          context: metadata.context,
        });
      }

      // Create fingerprint for better error grouping
      const fingerprint = [
        'hvac-crm',
        metadata.context,
        error.name,
        metadata.operation || 'unknown',
      ];
      scope.setFingerprint(fingerprint);

      // Set severity level
      scope.setLevel(level);

      // Add breadcrumb for the error
      scope.addBreadcrumb({
        message: `HVAC ${metadata.context} error: ${error.message}`,
        category: 'hvac.error',
        level: level,
        data: {
          context: metadata.context,
          operation: metadata.operation,
        },
      });

      return Sentry.captureException(error);
    });
  }

  /**
   * Report HVAC operation success for monitoring
   */
  reportHVACSuccess(
    operation: string,
    context: HVACErrorContext,
    metadata?: Record<string, any>
  ): void {
    Sentry.addBreadcrumb({
      message: `HVAC ${context} success: ${operation}`,
      category: 'hvac.success',
      level: 'info',
      data: {
        context,
        operation,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Start performance monitoring for HVAC operations
   * Updated to use modern Sentry v8+ API with startSpan
   */
  startHVACTransaction(
    name: string,
    context: HVACErrorContext,
    metadata?: Record<string, any>
  ): { setStatus: (status: string) => void; finish: () => void } {
    // Use modern Sentry.startSpan API for v8+
    return Sentry.startSpan({
      name: `hvac.${context}.${name}`,
      op: 'hvac.operation',
      attributes: {
        hvac_context: context,
        component: 'hvac-crm',
        market: 'poland',
        ...metadata,
      },
    }, (span) => {
      // Return a transaction-like object for compatibility
      return {
        setStatus: (status: string) => {
          if (span) {
            span.setStatus({ code: status === 'ok' ? 1 : 2 });
          }
        },
        finish: () => {
          // Span automatically finishes when callback completes
          if (span) {
            span.end();
          }
        }
      };
    });
  }

  /**
   * Monitor Weaviate operations specifically
   * Updated to use modern Sentry v8+ API with async/await pattern
   */
  async monitorWeaviateOperation<T>(
    operation: string,
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return Sentry.startSpan({
      name: `hvac.weaviate.${operation}`,
      op: 'hvac.weaviate.operation',
      attributes: {
        hvac_context: HVACErrorContext.WEAVIATE_SEARCH,
        component: 'hvac-crm',
        market: 'poland',
        query,
      },
    }, async () => {
      try {
        const result = await fn();

        this.reportHVACSuccess(operation, HVACErrorContext.WEAVIATE_SEARCH, {
          query,
          resultCount: Array.isArray(result) ? result.length : 1,
        });

        return result;
      } catch (error) {
        this.reportHVACError(
          error,
          {
            context: HVACErrorContext.WEAVIATE_SEARCH,
            operation,
            weaviateQuery: query,
          },
          'error'
        );
        throw error;
      }
    });
  }

  /**
   * Monitor HVAC API operations
   * Updated to use modern Sentry v8+ API with async/await pattern
   */
  async monitorHVACApiOperation<T>(
    operation: string,
    endpoint: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return Sentry.startSpan({
      name: `hvac.api.${operation}`,
      op: 'hvac.api.operation',
      attributes: {
        hvac_context: HVACErrorContext.HVAC_API_INTEGRATION,
        component: 'hvac-crm',
        market: 'poland',
        endpoint,
      },
    }, async () => {
      try {
        const result = await fn();

        this.reportHVACSuccess(operation, HVACErrorContext.HVAC_API_INTEGRATION, {
          endpoint,
        });

        return result;
      } catch (error) {
        this.reportHVACError(
          error,
          {
            context: HVACErrorContext.HVAC_API_INTEGRATION,
            operation,
            apiEndpoint: endpoint,
          },
          'error'
        );
        throw error;
      }
    });
  }

  /**
   * Set user context for HVAC operations
   */
  setHVACUser(userId: string, email?: string, workspaceId?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      workspaceId,
    });

    Sentry.setTag('hvac_user', userId);
    if (workspaceId) {
      Sentry.setTag('hvac_workspace', workspaceId);
    }
  }

  /**
   * Clear user context
   */
  clearHVACUser(): void {
    Sentry.setUser(null);
  }

  /**
   * Add HVAC-specific breadcrumb
   */
  addHVACBreadcrumb(
    message: string,
    context: HVACErrorContext,
    level: Sentry.SeverityLevel = 'info',
    data?: Record<string, any>
  ): void {
    Sentry.addBreadcrumb({
      message,
      category: `hvac.${context}`,
      level,
      data: {
        context,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Check if Sentry is properly configured
   */
  isConfigured(): boolean {
    const dsn = this.twentyConfigService.get('SENTRY_DSN');
    return !!dsn && dsn !== 'your_sentry_dsn_here';
  }

  /**
   * Get current Sentry configuration status
   */
  getConfigurationStatus(): {
    isConfigured: boolean;
    environment: string;
    dsn?: string;
  } {
    const dsn = this.twentyConfigService.get('SENTRY_DSN');
    const environment = this.twentyConfigService.get('SENTRY_ENVIRONMENT');
    
    return {
      isConfigured: this.isConfigured(),
      environment: environment || 'unknown',
      dsn: dsn ? dsn.substring(0, 20) + '...' : undefined,
    };
  }
}
