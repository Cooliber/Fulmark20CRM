/**
 * LazyCustomer360 - Lazy Loading Customer 360 Component
 * "Pasja rodzi profesjonalizm" - Professional lazy loading implementation
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Performance optimization with lazy loading
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { Suspense, lazy, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';

// HVAC monitoring
import { trackHVACUserAction } from '../../index';

// Lazy load Customer 360 components
const Customer360Container = lazy(() => 
  import('../customer360/Customer360Container').then(module => ({
    default: module.Customer360Container
  }))
);

const Customer360CommunicationTabEnhanced = lazy(() => 
  import('../customer360/Customer360CommunicationTabEnhanced').then(module => ({
    default: module.Customer360CommunicationTabEnhanced
  }))
);

const Customer360EquipmentTab = lazy(() => 
  import('../customer360/Customer360EquipmentTab').then(module => ({
    default: module.Customer360EquipmentTab
  }))
);

// Component props
interface LazyCustomer360Props {
  customerId: string;
  initialTab?: 'profile' | 'equipment' | 'communication' | 'analytics';
  onTabChange?: (tab: string) => void;
  className?: string;
}

// Loading skeleton component
const Customer360LoadingSkeleton: React.FC = () => (
  <div className="grid">
    <div className="col-12">
      <Card>
        <div className="flex flex-column gap-4">
          {/* Header skeleton */}
          <div className="flex align-items-center gap-3">
            <Skeleton shape="circle" size="4rem" />
            <div className="flex-1">
              <Skeleton height="1.5rem" className="mb-2" />
              <Skeleton height="1rem" width="60%" />
            </div>
          </div>
          
          {/* Tabs skeleton */}
          <div className="flex gap-2">
            <Skeleton height="2.5rem" width="8rem" />
            <Skeleton height="2.5rem" width="8rem" />
            <Skeleton height="2.5rem" width="8rem" />
            <Skeleton height="2.5rem" width="8rem" />
          </div>
          
          {/* Content skeleton */}
          <div className="grid">
            <div className="col-12 md:col-6">
              <Skeleton height="15rem" />
            </div>
            <div className="col-12 md:col-6">
              <Skeleton height="15rem" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

// Error boundary fallback
const Customer360ErrorFallback: React.FC<{ 
  error: Error; 
  onRetry: () => void; 
}> = ({ error, onRetry }) => (
  <Card className="text-center p-6">
    <i className="pi pi-exclamation-triangle text-6xl text-red-500 mb-4" />
    <h3 className="text-900 font-semibold mb-2">Błąd ładowania Customer 360</h3>
    <p className="text-600 mb-4">
      Wystąpił problem podczas ładowania danych klienta.
    </p>
    <p className="text-sm text-500 mb-4">
      {error.message}
    </p>
    <div className="flex gap-2 justify-content-center">
      <Button
        label="Spróbuj ponownie"
        icon="pi pi-refresh"
        onClick={onRetry}
      />
      <Button
        label="Zgłoś problem"
        icon="pi pi-exclamation-triangle"
        severity="secondary"
        outlined
        onClick={() => {
          trackHVACUserAction('customer360_error_reported', 'ERROR_REPORTING', {
            error: error.message,
          });
        }}
      />
    </div>
  </Card>
);

// Suspense fallback with progress indicator
const Customer360SuspenseFallback: React.FC = () => (
  <div className="flex flex-column align-items-center justify-content-center p-6">
    <ProgressSpinner 
      style={{ width: '50px', height: '50px' }} 
      strokeWidth="4" 
      animationDuration="1s"
    />
    <p className="text-600 mt-3">Ładowanie Customer 360...</p>
  </div>
);

export const LazyCustomer360: React.FC<LazyCustomer360Props> = ({
  customerId,
  initialTab = 'profile',
  onTabChange,
  className = '',
}) => {
  // Handle retry for error boundary
  const handleRetry = useCallback(() => {
    trackHVACUserAction('customer360_retry_clicked', 'USER_INTERACTION', {
      customerId,
    });
    
    // Force component remount by changing key
    window.location.reload();
  }, [customerId]);

  // Track lazy loading
  React.useEffect(() => {
    trackHVACUserAction('customer360_lazy_load_started', 'PERFORMANCE', {
      customerId,
      initialTab,
    });
  }, [customerId, initialTab]);

  return (
    <div className={`lazy-customer360 ${className}`}>
      <React.ErrorBoundary
        fallback={({ error }) => (
          <Customer360ErrorFallback 
            error={error} 
            onRetry={handleRetry} 
          />
        )}
      >
        <Suspense fallback={<Customer360SuspenseFallback />}>
          <Customer360Container
            customerId={customerId}
            initialTab={initialTab}
            onTabChange={onTabChange}
          />
        </Suspense>
      </React.ErrorBoundary>
    </div>
  );
};

// Lazy load specific tabs for even better performance
export const LazyCustomer360CommunicationTab: React.FC<{
  customerId: string;
}> = ({ customerId }) => (
  <React.ErrorBoundary
    fallback={({ error }) => (
      <Customer360ErrorFallback 
        error={error} 
        onRetry={() => window.location.reload()} 
      />
    )}
  >
    <Suspense fallback={<Customer360LoadingSkeleton />}>
      <Customer360CommunicationTabEnhanced customerId={customerId} />
    </Suspense>
  </React.ErrorBoundary>
);

export const LazyCustomer360EquipmentTab: React.FC<{
  customerId: string;
}> = ({ customerId }) => (
  <React.ErrorBoundary
    fallback={({ error }) => (
      <Customer360ErrorFallback 
        error={error} 
        onRetry={() => window.location.reload()} 
      />
    )}
  >
    <Suspense fallback={<Customer360LoadingSkeleton />}>
      <Customer360EquipmentTab customerId={customerId} />
    </Suspense>
  </React.ErrorBoundary>
);
