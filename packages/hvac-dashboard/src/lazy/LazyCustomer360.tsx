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

// REMOVED: PrimeReact imports - Heavy dependencies (~200KB)
// import { Card } from 'primereact/card';
// import { ProgressSpinner } from 'primereact/progressspinner';
// import { Skeleton } from 'primereact/skeleton';
import React, { Suspense, lazy } from 'react';

// HVAC monitoring - Direct import to avoid circular dependencies
// REMOVED: import { ProgressSpinner } from 'primereact/progressspinner';
import Skeleton from 'react-loading-skeleton';
import { Card } from 'twenty-ui/layout';
import { trackHVACUserAction } from '../../utils/sentry-init';
import { HVACErrorBoundary } from '../HVACErrorBoundary';

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



// Suspense fallback with progress indicator
const Customer360SuspenseFallback: React.FC = () => (
  <div className="flex flex-column align-items-center justify-content-center p-6">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="text-600 mt-3">Ładowanie Customer 360...</p>
  </div>
);

export const LazyCustomer360: React.FC<LazyCustomer360Props> = ({
  customerId,
  initialTab = 'profile',
  onTabChange,
  className = '',
}) => {


  // Track lazy loading
  React.useEffect(() => {
    trackHVACUserAction('customer360_lazy_load_started', 'PERFORMANCE', {
      customerId,
      initialTab,
    });
  }, [customerId, initialTab]);

  return (
    <div className={`lazy-customer360 ${className}`}>
      <HVACErrorBoundary
        context="CUSTOMER_360"
        customTitle="Błąd ładowania Customer 360"
        customMessage="Wystąpił problem podczas ładowania danych klienta."
        onError={(error) => {
          trackHVACUserAction('customer360_error', 'ERROR_REPORTING', {
            customerId,
            error: error.message,
          });
        }}
      >
        <Suspense fallback={<Customer360SuspenseFallback />}>
          <Customer360Container
            customerId={customerId}
            initialTab={initialTab}
            onTabChange={onTabChange}
          />
        </Suspense>
      </HVACErrorBoundary>
    </div>
  );
};

// Lazy load specific tabs for even better performance
export const LazyCustomer360CommunicationTab: React.FC<{
  customerId: string;
}> = ({ customerId }) => (
  <HVACErrorBoundary
    context="CUSTOMER_360"
    customTitle="Błąd ładowania komunikacji"
    customMessage="Wystąpił problem podczas ładowania danych komunikacji klienta."
    onError={(error) => {
      trackHVACUserAction('customer360_communication_error', 'ERROR_REPORTING', {
        customerId,
        error: error.message,
      });
    }}
  >
    <Suspense fallback={<Customer360LoadingSkeleton />}>
      <Customer360CommunicationTabEnhanced customerId={customerId} />
    </Suspense>
  </HVACErrorBoundary>
);

export const LazyCustomer360EquipmentTab: React.FC<{
  customerId: string;
}> = ({ customerId }) => (
  <HVACErrorBoundary
    context="CUSTOMER_360"
    customTitle="Błąd ładowania sprzętu"
    customMessage="Wystąpił problem podczas ładowania danych sprzętu klienta."
    onError={(error) => {
      trackHVACUserAction('customer360_equipment_error', 'ERROR_REPORTING', {
        customerId,
        error: error.message,
      });
    }}
  >
    <Suspense fallback={<Customer360LoadingSkeleton />}>
      <Customer360EquipmentTab customerId={customerId} />
    </Suspense>
  </HVACErrorBoundary>
);

// REMOVED: Static exports that prevent code splitting
// These components should only be imported dynamically to maintain bundle optimization
// export { LazyAnalyticsDashboard } from './LazyAnalyticsDashboard';
// export { LazyKanbanBoard } from './LazyKanbanBoard';
// export { LazyMaintenanceDashboard } from './LazyMaintenanceDashboard';

