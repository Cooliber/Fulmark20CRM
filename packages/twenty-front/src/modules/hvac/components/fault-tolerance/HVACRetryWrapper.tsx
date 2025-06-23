/**
 * HVAC Retry Wrapper Component
 * "Pasja rodzi profesjonalizm" - Automatic retry mechanism for failed operations
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { useState, useCallback, ReactNode } from 'react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';

// HVAC monitoring
import { reportHVACError, addHVACBreadcrumb } from '../../config/sentry.config';

// Types
interface HVACRetryWrapperProps {
  children: ReactNode;
  onRetry: () => Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
  fallback?: ReactNode;
  errorMessage?: string;
  retryButtonLabel?: string;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  hasExhaustedRetries: boolean;
}

export const HVACRetryWrapper: React.FC<HVACRetryWrapperProps> = ({
  children,
  onRetry,
  maxRetries = 3,
  retryDelay = 1000,
  autoRetry = false,
  fallback,
  errorMessage = 'Wystąpił błąd podczas ładowania danych.',
  retryButtonLabel = 'Spróbuj ponownie',
}) => {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    hasExhaustedRetries: false,
  });

  // Handle retry with exponential backoff
  const handleRetry = useCallback(async () => {
    if (retryState.retryCount >= maxRetries) {
      setRetryState(prev => ({ ...prev, hasExhaustedRetries: true }));
      return;
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    // Add breadcrumb for retry attempt
    addHVACBreadcrumb(
      `Retry attempt ${retryState.retryCount + 1}/${maxRetries}`,
      'retry_mechanism',
      'info',
      {
        retryCount: retryState.retryCount + 1,
        maxRetries,
        autoRetry,
      }
    );

    try {
      // Apply exponential backoff delay
      const delay = retryDelay * Math.pow(2, retryState.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Attempt the retry operation
      await onRetry();

      // Success - reset retry state
      setRetryState({
        isRetrying: false,
        retryCount: 0,
        lastError: null,
        hasExhaustedRetries: false,
      });

      addHVACBreadcrumb(
        'Retry operation successful',
        'retry_mechanism',
        'info',
        { retryCount: retryState.retryCount + 1 }
      );

    } catch (error) {
      const retryError = error instanceof Error ? error : new Error('Retry failed');
      
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: retryError,
      }));

      // Report retry failure
      reportHVACError(
        retryError,
        'PERFORMANCE',
        {
          retryCount: retryState.retryCount + 1,
          maxRetries,
          retryMechanism: true,
        }
      );

      // Auto-retry if enabled and retries remaining
      if (autoRetry && retryState.retryCount + 1 < maxRetries) {
        setTimeout(() => handleRetry(), retryDelay);
      }
    }
  }, [retryState.retryCount, maxRetries, retryDelay, autoRetry, onRetry]);

  // Manual retry button handler
  const handleManualRetry = useCallback(() => {
    setRetryState(prev => ({
      ...prev,
      hasExhaustedRetries: false,
      lastError: null,
    }));
    handleRetry();
  }, [handleRetry]);

  // Render retry UI when needed
  if (retryState.lastError || retryState.isRetrying || retryState.hasExhaustedRetries) {
    return (
      <Card className="text-center p-4">
        {retryState.isRetrying ? (
          // Loading state
          <>
            <ProgressSpinner />
            <p className="mt-3 text-600">
              Ponowna próba... ({retryState.retryCount}/{maxRetries})
            </p>
          </>
        ) : retryState.hasExhaustedRetries ? (
          // Exhausted retries state
          <>
            <Message 
              severity="error" 
              text="Przekroczono maksymalną liczbę prób. Skontaktuj się z administratorem." 
              className="w-full mb-3"
            />
            {fallback || (
              <Button
                label="Odśwież stronę"
                icon="pi pi-refresh"
                onClick={() => window.location.reload()}
                className="p-button-outlined"
              />
            )}
          </>
        ) : (
          // Error state with retry option
          <>
            <Message 
              severity="warn" 
              text={errorMessage} 
              className="w-full mb-3"
            />
            <div className="flex justify-content-center gap-2">
              <Button
                label={retryButtonLabel}
                icon="pi pi-refresh"
                onClick={handleManualRetry}
                disabled={retryState.isRetrying}
              />
              <Button
                label="Anuluj"
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={() => setRetryState({
                  isRetrying: false,
                  retryCount: 0,
                  lastError: null,
                  hasExhaustedRetries: true,
                })}
              />
            </div>
            <p className="text-sm text-600 mt-2">
              Próba {retryState.retryCount}/{maxRetries}
            </p>
          </>
        )}
      </Card>
    );
  }

  return <>{children}</>;
};
