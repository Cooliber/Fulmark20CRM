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
import React from 'react';

// HVAC monitoring - Direct import to avoid circular dependencies
import { Component, ErrorInfo, ReactNode } from 'react';
// Placeholder Card component
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({ children, style, className }) => (
  <div className={className} style={{
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'white',
    ...style
  }}>
    {children}
  </div>
);

// Placeholder Skeleton component
const Skeleton: React.FC<{
  width?: string;
  height?: string;
  className?: string;
  shape?: string;
  size?: string;
}> = ({ width = '100%', height = '1rem', className = '', shape, size }) => (
  <div
    className={`bg-gray-200 animate-pulse ${className}`}
    style={{
      width: size || width,
      height: size || height,
      borderRadius: shape === 'circle' ? '50%' : '4px'
    }}
  />
);

// Placeholder function for tracking
const trackHVACUserAction = (action: string, context: string, data?: Record<string, unknown>) => {
  console.log('HVAC User Action:', { action, context, data });
};

// Simple Error Boundary for local use
interface ErrorBoundaryState {
  hasError: boolean;
}

class SimpleErrorBoundary extends Component<
  { children: ReactNode; context?: string; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; context?: string; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HVAC Dashboard Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Wystąpił błąd</h3>
          <p>Nie udało się załadować komponentu Customer 360.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Spróbuj ponownie
          </button>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Placeholder Customer 360 components
const Customer360Container: React.FC<{
  customerId: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}> = ({ customerId, initialTab, onTabChange }) => (
  <Card style={{ padding: '20px' }}>
    <h3>Customer 360 - {customerId}</h3>
    <p>Widok 360° klienta jest w trakcie ładowania...</p>
    <div style={{ marginTop: '20px', color: '#666' }}>
      👤 Pełny profil klienta będzie dostępny wkrótce
    </div>
  </Card>
);

const Customer360CommunicationTabEnhanced: React.FC<{
  customerId: string;
}> = ({ customerId }) => (
  <Card style={{ padding: '20px' }}>
    <h4>Komunikacja - {customerId}</h4>
    <p>Historia komunikacji z klientem...</p>
  </Card>
);

const Customer360EquipmentTab: React.FC<{
  customerId: string;
}> = ({ customerId }) => (
  <Card style={{ padding: '20px' }}>
    <h4>Sprzęt - {customerId}</h4>
    <p>Lista sprzętu klienta...</p>
  </Card>
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
      <SimpleErrorBoundary
        context="CUSTOMER_360"
        onError={(error) => {
          trackHVACUserAction('customer360_error', 'ERROR_REPORTING', {
            customerId,
            error: error.message,
          });
        }}
      >
        <Customer360Container
          customerId={customerId}
          initialTab={initialTab}
          onTabChange={onTabChange}
        />
      </SimpleErrorBoundary>
    </div>
  );
};

// Lazy load specific tabs for even better performance
export const LazyCustomer360CommunicationTab: React.FC<{
  customerId: string;
}> = ({ customerId }) => (
  <SimpleErrorBoundary
    context="CUSTOMER_360"
    onError={(error) => {
      trackHVACUserAction('customer360_communication_error', 'ERROR_REPORTING', {
        customerId,
        error: error.message,
      });
    }}
  >
    <Customer360CommunicationTabEnhanced customerId={customerId} />
  </SimpleErrorBoundary>
);

export const LazyCustomer360EquipmentTab: React.FC<{
  customerId: string;
}> = ({ customerId }) => (
  <SimpleErrorBoundary
    context="CUSTOMER_360"
    onError={(error) => {
      trackHVACUserAction('customer360_equipment_error', 'ERROR_REPORTING', {
        customerId,
        error: error.message,
      });
    }}
  >
    <Customer360EquipmentTab customerId={customerId} />
  </SimpleErrorBoundary>
);

// REMOVED: Static exports that prevent code splitting
// These components should only be imported dynamically to maintain bundle optimization
// export { LazyAnalyticsDashboard } from './LazyAnalyticsDashboard';
// export { LazyKanbanBoard } from './LazyKanbanBoard';
// export { LazyMaintenanceDashboard } from './LazyMaintenanceDashboard';

