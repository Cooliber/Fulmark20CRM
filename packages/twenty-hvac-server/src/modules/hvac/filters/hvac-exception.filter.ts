/**
 * HVAC Exception Filter
 * "Pasja rodzi profesjonalizm" - Professional HVAC Exception Handling
 * 
 * Comprehensive exception filter for HVAC operations
 * Integrates with Twenty's error handling system and provides Polish error messages
 */

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { ForbiddenError, UserInputError } from 'apollo-server-express';
import { Response } from 'express';
import { HvacError, HvacErrorCategory, HvacErrorHandlerService, HvacErrorSeverity, HvacErrorType } from '../services/hvac-error-handler.service';

// Mock classes for missing dependencies
class ExceptionHandlerService {}
class NotFoundError extends Error {}
class InternalServerError extends Error {}
function isDefined(value: any): boolean {
  return value !== undefined && value !== null;
}

// HVAC-specific exception class
export class HvacException extends Error {
  constructor(
    message: string,
    public readonly type: HvacErrorType,
    public readonly category: HvacErrorCategory,
    public readonly statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);
    this.name = 'HvacException';
  }
}

@Catch(HvacException)
export class HvacExceptionFilter implements ExceptionFilter, GqlExceptionFilter {
  constructor(
    private readonly hvacErrorHandler: HvacErrorHandlerService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  catch(exception: HvacException, host: ArgumentsHost) {
    const contextType = host.getType<'http' | 'graphql'>();

    if (contextType === 'graphql') {
      return this.handleGraphQLException(exception, host);
    } else {
      return this.handleHttpException(exception, host);
    }
  }

  private handleGraphQLException(exception: HvacException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();

    // Create HVAC error with context
    const hvacError = new HvacError({
      type: exception.type,
      category: exception.category,
      message: exception.message,
      severity: this.mapCategoryToSeverity(exception.category),
      originalError: exception,
      metadata: {
        correlationId: context.req?.headers['x-correlation-id'] || `hvac-${Date.now()}`,
        timestamp: Date.now(),
        userId: context.req?.user?.id,
        workspaceId: context.req?.workspace?.id,
        customerId: exception.metadata?.customerId,
        equipmentId: exception.metadata?.equipmentId,
        technicianId: exception.metadata?.technicianId,
        additionalContext: exception.metadata,
      },
      recoveryStrategy: {
        retryable: true,
        maxRetries: 3,
        retryDelayMs: 1000,
        escalationRequired: false,
        notificationRequired: true,
        automaticResolution: false,
      },
      polishContext: {
        userFriendlyMessage: this.getPolishErrorMessage(exception.type),
        suggestedActions: this.getSuggestedActions(exception.type),
        supportContact: 'support@fulmark.pl',
      },
    });

    // Handle the error through HVAC error handler
    this.hvacErrorHandler.handleError(hvacError);

    // Convert to appropriate GraphQL error
    return this.convertToGraphQLError(exception);
  }

  private handleHttpException(exception: HvacException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Create HVAC error with context
    const hvacError = new HvacError({
      type: exception.type,
      category: exception.category,
      message: exception.message,
      severity: this.mapCategoryToSeverity(exception.category),
      originalError: exception,
      metadata: {
        correlationId: request.headers['x-correlation-id'] || `hvac-${Date.now()}`,
        timestamp: Date.now(),
        userId: request.user?.id,
        workspaceId: request.workspace?.id,
        customerId: exception.metadata?.customerId,
        equipmentId: exception.metadata?.equipmentId,
        technicianId: exception.metadata?.technicianId,
        additionalContext: {
          ...exception.metadata,
          url: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
        },
      },
      recoveryStrategy: {
        retryable: true,
        maxRetries: 3,
        retryDelayMs: 1000,
        escalationRequired: false,
        notificationRequired: true,
        automaticResolution: false,
      },
      polishContext: {
        userFriendlyMessage: this.getPolishErrorMessage(exception.type),
        suggestedActions: this.getSuggestedActions(exception.type),
        supportContact: 'support@fulmark.pl',
      },
    });

    // Handle the error through HVAC error handler
    this.hvacErrorHandler.handleError(hvacError);

    // Send HTTP response
    const statusCode = exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(statusCode).json({
      statusCode,
      error: 'HVAC Error',
      message: hvacError.polishMessage,
      errorId: hvacError.id,
      timestamp: hvacError.timestamp.toISOString(),
      path: request.url,
      correlationId: hvacError.correlationId,
    });
  }

  private convertToGraphQLError(exception: HvacException) {
    const polishMessage = this.getPolishErrorMessage(exception.type);

    switch (exception.category) {
      case HvacErrorCategory.VALIDATION:
      case HvacErrorCategory.BUSINESS_LOGIC:
        return new UserInputError(polishMessage);
      
      case HvacErrorCategory.AUTHENTICATION:
      case HvacErrorCategory.AUTHORIZATION:
        return new ForbiddenError(polishMessage);
      
      case HvacErrorCategory.NOT_FOUND:
        return new NotFoundError(polishMessage);
      
      case HvacErrorCategory.EXTERNAL_SERVICE:
      case HvacErrorCategory.SYSTEM:
      case HvacErrorCategory.PERFORMANCE:
      default:
        return new InternalServerError(polishMessage);
    }
  }

  private getPolishErrorMessage(errorType: HvacErrorType): string {
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

    return polishMessages[errorType] || 'Wystąpił nieoczekiwany błąd systemu HVAC.';
  }

  private getSuggestedActions(errorType: HvacErrorType): string[] {
    const actionMap = {
      [HvacErrorType.API_CONNECTION_FAILED]: [
        'Sprawdź połączenie internetowe',
        'Spróbuj ponownie za chwilę',
        'Skontaktuj się z administratorem jeśli problem się powtarza',
      ],
      [HvacErrorType.AUTHENTICATION_FAILED]: [
        'Sprawdź dane logowania',
        'Wyloguj się i zaloguj ponownie',
        'Skontaktuj się z administratorem',
      ],
      [HvacErrorType.PERMISSION_DENIED]: [
        'Skontaktuj się z administratorem w celu nadania uprawnień',
        'Sprawdź czy masz dostęp do tej funkcji',
      ],
      [HvacErrorType.RESOURCE_NOT_FOUND]: [
        'Sprawdź czy zasób nadal istnieje',
        'Odśwież stronę',
        'Sprawdź uprawnienia dostępu',
      ],
      [HvacErrorType.VALIDATION_FAILED]: [
        'Sprawdź wprowadzone dane',
        'Upewnij się że wszystkie wymagane pola są wypełnione',
        'Sprawdź format danych',
      ],
      [HvacErrorType.RATE_LIMIT_EXCEEDED]: [
        'Poczekaj chwilę przed kolejną próbą',
        'Zmniejsz częstotliwość żądań',
      ],
      [HvacErrorType.SERVICE_UNAVAILABLE]: [
        'Spróbuj ponownie za kilka minut',
        'Sprawdź status systemu',
        'Skontaktuj się z supportem',
      ],
      [HvacErrorType.TIMEOUT]: [
        'Spróbuj ponownie',
        'Sprawdź połączenie internetowe',
        'Podziel operację na mniejsze części',
      ],
    };

    return actionMap[errorType] || [
      'Spróbuj ponownie',
      'Odśwież stronę',
      'Skontaktuj się z supportem: support@fulmark.pl',
    ];
  }

  private mapCategoryToSeverity(category: HvacErrorCategory): HvacErrorSeverity {
    switch (category) {
      case HvacErrorCategory.SYSTEM:
      case HvacErrorCategory.EXTERNAL_SERVICE:
        return HvacErrorSeverity.CRITICAL;
      case HvacErrorCategory.AUTHENTICATION:
      case HvacErrorCategory.AUTHORIZATION:
        return HvacErrorSeverity.HIGH;
      case HvacErrorCategory.BUSINESS_LOGIC:
      case HvacErrorCategory.PERFORMANCE:
        return HvacErrorSeverity.MEDIUM;
      case HvacErrorCategory.VALIDATION:
      case HvacErrorCategory.NOT_FOUND:
      default:
        return HvacErrorSeverity.LOW;
    }
  }
}

// Helper function to create HVAC exceptions
export const createHvacException = (
  message: string,
  type: HvacErrorType,
  category: HvacErrorCategory,
  statusCode?: HttpStatus,
  metadata?: Record<string, any>,
): HvacException => {
  return new HvacException(message, type, category, statusCode, metadata);
};

// Common HVAC exception creators
export const HvacExceptions = {
  apiConnectionFailed: (details?: string) =>
    createHvacException(
      `HVAC API connection failed${details ? `: ${details}` : ''}`,
      HvacErrorType.API_CONNECTION_FAILED,
      HvacErrorCategory.EXTERNAL_SERVICE,
      HttpStatus.SERVICE_UNAVAILABLE,
    ),

  authenticationFailed: (details?: string) =>
    createHvacException(
      `HVAC authentication failed${details ? `: ${details}` : ''}`,
      HvacErrorType.AUTHENTICATION_FAILED,
      HvacErrorCategory.AUTHENTICATION,
      HttpStatus.UNAUTHORIZED,
    ),

  permissionDenied: (operation: string) =>
    createHvacException(
      `Permission denied for HVAC operation: ${operation}`,
      HvacErrorType.PERMISSION_DENIED,
      HvacErrorCategory.AUTHORIZATION,
      HttpStatus.FORBIDDEN,
    ),

  resourceNotFound: (resource: string, id?: string) =>
    createHvacException(
      `HVAC resource not found: ${resource}${id ? ` (ID: ${id})` : ''}`,
      HvacErrorType.RESOURCE_NOT_FOUND,
      HvacErrorCategory.NOT_FOUND,
      HttpStatus.NOT_FOUND,
    ),

  validationFailed: (field: string, reason?: string) =>
    createHvacException(
      `HVAC validation failed for field: ${field}${reason ? ` - ${reason}` : ''}`,
      HvacErrorType.VALIDATION_FAILED,
      HvacErrorCategory.VALIDATION,
      HttpStatus.BAD_REQUEST,
    ),

  serviceUnavailable: (service: string) =>
    createHvacException(
      `HVAC service unavailable: ${service}`,
      HvacErrorType.SERVICE_UNAVAILABLE,
      HvacErrorCategory.EXTERNAL_SERVICE,
      HttpStatus.SERVICE_UNAVAILABLE,
    ),

  timeout: (operation: string) =>
    createHvacException(
      `HVAC operation timeout: ${operation}`,
      HvacErrorType.TIMEOUT,
      HvacErrorCategory.PERFORMANCE,
      HttpStatus.REQUEST_TIMEOUT,
    ),
};
