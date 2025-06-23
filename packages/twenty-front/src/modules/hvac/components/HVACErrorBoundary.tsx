/**
 * HVAC Error Boundary Component
 * "Pasja rodzi profesjonalizm" - Comprehensive error handling with Sentry integration
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only (with class exception for Error Boundary)
 * - Named exports only
 * - Polish business context
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { motion } from 'framer-motion';

import { 
  reportHVACError, 
  addHVACBreadcrumb,
  HVACErrorContext,
  HVACErrorContexts 
} from '../config/sentry.config';

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  showDetails: boolean;
  userFeedback: string;
  isSubmittingFeedback: boolean;
}

// Error boundary props interface
interface HVACErrorBoundaryProps {
  children: ReactNode;
  context?: HVACErrorContext;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  customTitle?: string;
  customMessage?: string;
}

// Error boundary class component (required for error boundaries)
export class HVACErrorBoundary extends Component<HVACErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: HVACErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      userFeedback: '',
      isSubmittingFeedback: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show error UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = this.generateErrorId();
    
    this.setState({
      errorInfo,
      errorId,
    });

    // Add breadcrumb for error context
    addHVACBreadcrumb(
      'Error boundary caught error',
      'error_boundary',
      'error',
      {
        errorId,
        componentStack: errorInfo.componentStack,
        context: this.props.context,
      }
    );

    // Report to Sentry with HVAC context
    reportHVACError(
      error,
      this.props.context || 'UI_COMPONENT',
      {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }
    );

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 HVAC Error Boundary caught error:', error, errorInfo);
    }
  }

  private generateErrorId(): string {
    return `HVAC_ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      userFeedback: '',
      isSubmittingFeedback: false,
    });
  };

  private handleShowDetails = (): void => {
    this.setState({ showDetails: true });
  };

  private handleHideDetails = (): void => {
    this.setState({ showDetails: false });
  };

  private handleFeedbackSubmit = async (): Promise<void> => {
    const { userFeedback, errorId, error } = this.state;
    
    if (!userFeedback.trim() || !error) return;

    this.setState({ isSubmittingFeedback: true });

    try {
      // Report user feedback to Sentry
      reportHVACError(
        new Error(`User feedback for error ${errorId}: ${userFeedback}`),
        'UI_COMPONENT',
        {
          errorId,
          userFeedback,
          originalError: error.message,
          feedbackType: 'error_report',
        }
      );

      // Show success message
      addHVACBreadcrumb(
        'User submitted error feedback',
        'user_feedback',
        'info',
        { errorId, feedbackLength: userFeedback.length }
      );

      this.setState({ 
        userFeedback: '',
        showDetails: false,
      });

    } catch (feedbackError) {
      console.error('Failed to submit feedback:', feedbackError);
    } finally {
      this.setState({ isSubmittingFeedback: false });
    }
  };

  private renderErrorUI(): ReactNode {
    const { error, errorId, showDetails, userFeedback, isSubmittingFeedback } = this.state;
    const { customTitle, customMessage, showReportButton = true } = this.props;
    
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hvac-error-boundary p-4"
      >
        <Card className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <div className="flex justify-content-center mb-3">
              <div className="w-6rem h-6rem border-circle bg-red-100 flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle text-4xl text-red-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-900 mb-2">
              {customTitle || 'Ups! Wystąpił błąd w systemie HVAC'}
            </h2>
            
            <p className="text-600 mb-3">
              {customMessage || 
                'Wystąpił nieoczekiwany błąd w aplikacji HVAC CRM. ' +
                'Nasz zespół został automatycznie powiadomiony i pracuje nad rozwiązaniem.'
              }
            </p>

            {errorId && (
              <Message 
                severity="info" 
                text={`ID błędu: ${errorId}`}
                className="mb-3"
              />
            )}
          </div>

          <div className="flex justify-content-center gap-3 mb-4">
            <Button
              label="Spróbuj ponownie"
              icon="pi pi-refresh"
              onClick={this.handleRetry}
              className="p-button-primary"
            />
            
            {showReportButton && (
              <Button
                label="Zgłoś problem"
                icon="pi pi-send"
                onClick={this.handleShowDetails}
                className="p-button-outlined"
              />
            )}
            
            {isDevelopment && (
              <Button
                label="Szczegóły techniczne"
                icon="pi pi-info-circle"
                onClick={this.handleShowDetails}
                className="p-button-outlined p-button-secondary"
              />
            )}
          </div>

          {/* Error details dialog */}
          <Dialog
            header="Szczegóły błędu"
            visible={showDetails}
            onHide={this.handleHideDetails}
            style={{ width: '50vw' }}
            modal
          >
            <div className="mb-4">
              <h4>Opisz co robiłeś gdy wystąpił błąd:</h4>
              <InputTextarea
                value={userFeedback}
                onChange={(e) => this.setState({ userFeedback: e.target.value })}
                rows={4}
                className="w-full"
                placeholder="Np. Próbowałem dodać nowe zgłoszenie serwisowe..."
              />
            </div>

            {isDevelopment && error && (
              <div className="mb-4">
                <h4>Informacje techniczne:</h4>
                <div className="bg-gray-100 p-3 border-round">
                  <p><strong>Błąd:</strong> {error.message}</p>
                  <p><strong>ID:</strong> {errorId}</p>
                  <p><strong>Kontekst:</strong> {this.props.context || 'UI_COMPONENT'}</p>
                </div>
              </div>
            )}

            <div className="flex justify-content-end gap-2">
              <Button
                label="Anuluj"
                icon="pi pi-times"
                onClick={this.handleHideDetails}
                className="p-button-text"
              />
              <Button
                label="Wyślij raport"
                icon="pi pi-send"
                onClick={this.handleFeedbackSubmit}
                loading={isSubmittingFeedback}
                disabled={!userFeedback.trim()}
                className="p-button-primary"
              />
            </div>
          </Dialog>
        </Card>
      </motion.div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withHVACErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<HVACErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <HVACErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </HVACErrorBoundary>
  );

  WrappedComponent.displayName = `withHVACErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for manual error reporting in functional components
export const useHVACErrorReporting = () => {
  const reportError = (
    error: Error, 
    context?: HVACErrorContext,
    additionalData?: Record<string, any>
  ) => {
    reportHVACError(error, context || 'UI_COMPONENT', additionalData);
  };

  const addBreadcrumb = (
    message: string,
    category: string,
    data?: Record<string, any>
  ) => {
    addHVACBreadcrumb(message, category, 'info', data);
  };

  return { reportError, addBreadcrumb };
};
