/**
 * HVAC Error Boundary Component
 * "Pasja rodzi profesjonalizm" - Professional Error Handling
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Functional components only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { motion } from 'framer-motion';

// HVAC Error Reporting
import { trackHVACUserAction } from '../../index';

// Types
interface HvacErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
  showRetry?: boolean;
  showReport?: boolean;
  className?: string;
}

interface HvacErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

// Error messages in Polish
const ERROR_MESSAGES = {
  GENERIC: 'Wystąpił nieoczekiwany błąd w aplikacji HVAC CRM.',
  COMPONENT_CRASH: 'Komponent uległ awarii. Spróbuj odświeżyć stronę.',
  NETWORK_ERROR: 'Błąd połączenia sieciowego. Sprawdź połączenie internetowe.',
  API_ERROR: 'Błąd komunikacji z serwerem. Spróbuj ponownie za chwilę.',
  PERMISSION_ERROR: 'Brak uprawnień do wykonania tej operacji.',
  VALIDATION_ERROR: 'Błąd walidacji danych. Sprawdź wprowadzone informacje.',
} as const;

// Error boundary class component (required by React)
export class HvacErrorBoundary extends Component<HvacErrorBoundaryProps, HvacErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: HvacErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<HvacErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Track error
    trackHVACUserAction('error_boundary_triggered', 'ERROR_REPORTING', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'unknown',
      retryCount: this.state.retryCount,
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('HVAC Error Boundary caught an error:', error, errorInfo);
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleRetry = (): void => {
    const newRetryCount = this.state.retryCount + 1;
    
    trackHVACUserAction('error_boundary_retry', 'ERROR_REPORTING', {
      retryCount: newRetryCount,
      context: this.props.context || 'unknown',
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount,
    });
  };

  private handleReport = (): void => {
    trackHVACUserAction('error_boundary_report', 'ERROR_REPORTING', {
      error: this.state.error?.message,
      context: this.props.context || 'unknown',
      userInitiated: true,
    });

    // Here you could integrate with a bug reporting service
    alert('Raport o błędzie został wysłany do zespołu technicznego.');
  };

  private getErrorMessage(): string {
    const { error } = this.state;
    if (!error) return ERROR_MESSAGES.GENERIC;

    // Categorize error based on message content
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (message.includes('api') || message.includes('server')) {
      return ERROR_MESSAGES.API_ERROR;
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ERROR_MESSAGES.PERMISSION_ERROR;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_MESSAGES.VALIDATION_ERROR;
    }

    return ERROR_MESSAGES.COMPONENT_CRASH;
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <motion.div
          className={`hvac-error-boundary ${this.props.className || ''}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 m-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              
              <Message
                severity="error"
                text={this.getErrorMessage()}
                className="mb-4"
              />

              {this.props.context && (
                <p className="text-sm text-color-secondary mb-4">
                  Kontekst: {this.props.context}
                </p>
              )}

              <div className="flex gap-2 justify-content-center">
                {this.props.showRetry !== false && (
                  <Button
                    label="Spróbuj ponownie"
                    icon="pi pi-refresh"
                    onClick={this.handleRetry}
                    className="p-button-primary"
                  />
                )}

                {this.props.showReport !== false && (
                  <Button
                    label="Zgłoś błąd"
                    icon="pi pi-exclamation-triangle"
                    onClick={this.handleReport}
                    className="p-button-outlined"
                  />
                )}

                <Button
                  label="Odśwież stronę"
                  icon="pi pi-sync"
                  onClick={() => window.location.reload()}
                  className="p-button-outlined"
                />
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Szczegóły błędu (tryb deweloperski)
                  </summary>
                  <pre className="text-xs mt-2 p-2 bg-gray-100 border-round overflow-auto">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs mt-2 p-2 bg-gray-100 border-round overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>
          </Card>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Component display name
HvacErrorBoundary.displayName = 'HvacErrorBoundary';
