/**
 * HVAC Error Boundary
 * "Pasja rodzi profesjonalizm" - Professional HVAC Error Handling
 * 
 * Enhanced error boundary for HVAC modules with Polish localization
 * Integrates with Twenty's error handling system and Sentry
 */

import styled from '@emotion/styled';
import { Component, ErrorInfo, ReactNode } from 'react';
import { IconAlertTriangle, IconBug, IconHome, IconRefresh } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Card, CardContent, CardHeader } from 'twenty-ui/layout';

const StyledErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: ${({ theme }) => theme.spacing(8)};
  background: ${({ theme }) => theme.background.secondary};
`;

const StyledErrorCard = styled(Card)`
  max-width: 600px;
  width: 100%;
  text-align: center;
`;

const StyledErrorIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  
  svg {
    color: ${({ theme }) => theme.color.red};
    width: 64px;
    height: 64px;
  }
`;

const StyledErrorTitle = styled.h2`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledErrorMessage = styled.p`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing(6)};
`;

const StyledErrorDetails = styled.details`
  text-align: left;
  margin: ${({ theme }) => theme.spacing(4)} 0;
  padding: ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.background.primary};
  border-radius: ${({ theme }) => theme.border.radius.md};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
`;

const StyledErrorSummary = styled.summary`
  cursor: pointer;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.tertiary};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  
  &:hover {
    color: ${({ theme }) => theme.font.color.secondary};
  }
`;

const StyledErrorStack = styled.pre`
  font-family: ${({ theme }) => theme.font.family.monospace};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.tertiary};
  background: ${({ theme }) => theme.background.transparent.light};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const StyledButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  justify-content: center;
  flex-wrap: wrap;
`;

export interface HvacErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  context?: string;
}

interface HvacErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// Polish error messages for HVAC context
const HVAC_ERROR_MESSAGES = {
  title: 'Wystąpił błąd w systemie HVAC',
  subtitle: 'Przepraszamy za niedogodności. Nasz zespół został powiadomiony o problemie.',
  apiError: 'Błąd połączenia z systemem HVAC. Sprawdź połączenie internetowe.',
  searchError: 'Błąd wyszukiwania semantycznego. Spróbuj ponownie za chwilę.',
  dataError: 'Błąd synchronizacji danych. Niektóre informacje mogą być nieaktualne.',
  permissionError: 'Brak uprawnień do tej operacji. Skontaktuj się z administratorem.',
  unknownError: 'Nieoczekiwany błąd systemu. Spróbuj odświeżyć stronę.',
  retry: 'Spróbuj ponownie',
  refresh: 'Odśwież stronę',
  goHome: 'Wróć do głównej',
  reportBug: 'Zgłoś błąd',
  technicalDetails: 'Szczegóły techniczne',
  errorId: 'ID błędu',
  timestamp: 'Czas wystąpienia',
  context: 'Kontekst',
};

export class HvacErrorBoundary extends Component<
  HvacErrorBoundaryProps,
  HvacErrorBoundaryState
> {
  constructor(props: HvacErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<HvacErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `hvac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to Sentry with HVAC context
    this.reportToSentry(error, errorInfo);
  }

  private async reportToSentry(error: Error, errorInfo: ErrorInfo) {
    try {
      const { captureException } = await import('@sentry/react');
      
      captureException(error, (scope) => {
        // Set HVAC-specific context
        scope.setTag('component', 'hvac-crm');
        scope.setTag('market', 'poland');
        scope.setTag('industry', 'hvac');
        scope.setTag('error_boundary', 'hvac');
        
        if (this.props.context) {
          scope.setTag('hvac_context', this.props.context);
        }

        // Set error fingerprint for better grouping
        const fingerprint = error.name === 'ChunkLoadError' 
          ? ['hvac-chunk-load-error']
          : [`hvac-${error.name}`, this.props.context || 'unknown'];
        scope.setFingerprint(fingerprint);

        // Add error info as extra context
        scope.setExtras({
          errorInfo,
          errorId: this.state.errorId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          hvacContext: this.props.context,
        });

        // Add breadcrumb for HVAC error
        scope.addBreadcrumb({
          category: 'hvac-error',
          message: `HVAC Error Boundary caught: ${error.message}`,
          level: 'error',
          data: {
            context: this.props.context,
            errorId: this.state.errorId,
          },
        });

        return scope;
      });
    } catch (sentryError) {
      console.error('Failed to report HVAC error to Sentry:', sentryError);
    }
  }

  private getErrorMessage(error: Error): string {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Błąd ładowania aplikacji. Odśwież stronę, aby spróbować ponownie.';
    }
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return HVAC_ERROR_MESSAGES.apiError;
    }
    
    if (error.message.includes('search') || error.message.includes('weaviate')) {
      return HVAC_ERROR_MESSAGES.searchError;
    }
    
    if (error.message.includes('sync') || error.message.includes('data')) {
      return HVAC_ERROR_MESSAGES.dataError;
    }
    
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return HVAC_ERROR_MESSAGES.permissionError;
    }
    
    return HVAC_ERROR_MESSAGES.unknownError;
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`HVAC Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Opis błędu: ${this.state.error?.message}
ID błędu: ${this.state.errorId}
Kontekst: ${this.props.context || 'Nieznany'}
Czas: ${new Date().toLocaleString('pl-PL')}
URL: ${window.location.href}

Dodatkowe informacje:
[Opisz co robiłeś/aś gdy wystąpił błąd]
    `);
    
    window.open(`mailto:support@fulmark.pl?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;

      return (
        <StyledErrorContainer>
          <StyledErrorCard>
            <CardHeader>
              <StyledErrorIcon>
                <IconAlertTriangle />
              </StyledErrorIcon>
              <StyledErrorTitle>
                {HVAC_ERROR_MESSAGES.title}
              </StyledErrorTitle>
            </CardHeader>
            
            <CardContent>
              <StyledErrorMessage>
                {error ? this.getErrorMessage(error) : HVAC_ERROR_MESSAGES.subtitle}
              </StyledErrorMessage>

              {this.props.showErrorDetails && error && (
                <StyledErrorDetails>
                  <StyledErrorSummary>
                    {HVAC_ERROR_MESSAGES.technicalDetails}
                  </StyledErrorSummary>
                  <div>
                    <p><strong>{HVAC_ERROR_MESSAGES.errorId}:</strong> {errorId}</p>
                    <p><strong>{HVAC_ERROR_MESSAGES.timestamp}:</strong> {new Date().toLocaleString('pl-PL')}</p>
                    {this.props.context && (
                      <p><strong>{HVAC_ERROR_MESSAGES.context}:</strong> {this.props.context}</p>
                    )}
                    <p><strong>Błąd:</strong> {error.message}</p>
                    {errorInfo && (
                      <StyledErrorStack>
                        {errorInfo.componentStack}
                      </StyledErrorStack>
                    )}
                  </div>
                </StyledErrorDetails>
              )}

              <StyledButtonGroup>
                <Button
                  Icon={IconRefresh}
                  title={HVAC_ERROR_MESSAGES.retry}
                  onClick={this.handleRetry}
                  variant="primary"
                />
                <Button
                  Icon={IconRefresh}
                  title={HVAC_ERROR_MESSAGES.refresh}
                  onClick={this.handleRefresh}
                  variant="secondary"
                />
                <Button
                  Icon={IconRefresh}
                  title={HVAC_ERROR_MESSAGES.goHome}
                  onClick={this.handleGoHome}
                  variant="secondary"
                />
                <Button
                  Icon={IconExclamationCircle}
                  title={HVAC_ERROR_MESSAGES.reportBug}
                  onClick={this.handleReportBug}
                  variant="tertiary"
                />
              </StyledButtonGroup>
            </CardContent>
          </StyledErrorCard>
        </StyledErrorContainer>
      );
    }

    return this.props.children;
  }
}
