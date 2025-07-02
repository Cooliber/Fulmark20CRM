/**
 * Zaawansowane Lazy Loading Komponentów HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalna Optymalizacja Ładowania
 * 
 * Inteligentny system lazy loading z preloadingiem i fallbackami
 * Cel: optymalizacja bundle size i wydajności ładowania
 */

// REMOVED: PrimeReact imports - Heavy dependencies (~300KB)
// Replaced with native TwentyCRM components
// import { Button } from 'primereact/button';
// import { Card } from 'primereact/card';
// import { ProgressSpinner } from 'primereact/progressspinner';

import React, { ComponentType, ReactNode, Suspense, lazy } from 'react';
import { Button } from 'twenty-ui/input';
import { reportHVACError, trackHVACUserAction } from '../index';
// REMOVED: Bundle Optimization - Heavy dependency moved to lazy loading
// import { hvacBundleOptimizer } from '../services/HvacBundleOptimizer';

// Typy dla lazy loading
interface LazyComponentProps {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  preload?: boolean;
  priority?: 'high' | 'low';
  retryable?: boolean;
}

interface LazyLoadError {
  message: string;
  component: string;
  timestamp: Date;
  retryCount: number;
}

// Komponenty loading fallback
const HvacLoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Ładowanie modułu HVAC...' }) => (
  <div className="hvac-loading-container flex flex-column align-items-center justify-content-center p-6">
    {/* REMOVED: ProgressSpinner - Heavy PrimeReact component */}
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <div className="mt-3 text-center">
      <h4 className="text-lg font-semibold mb-2 text-gray-700">{message}</h4>
      <p className="text-sm text-gray-500">Przygotowywanie profesjonalnych narzędzi HVAC...</p>
    </div>
  </div>
);

const HvacErrorFallback: React.FC<{ 
  error: LazyLoadError; 
  onRetry?: () => void;
  retryable?: boolean;
}> = ({ error, onRetry, retryable = true }) => (
  <div className="hvac-error-fallback p-4 m-4 bg-white border-round shadow-1">
    <div className="text-center">
      <i className="pi pi-exclamation-triangle text-4xl text-red-400 mb-3"></i>
      <h3 className="text-lg font-semibold mb-2 text-red-700">
        Błąd ładowania modułu HVAC
      </h3>
      <p className="text-gray-600 mb-4">
        Nie udało się załadować komponentu: <strong>{error.component}</strong>
      </p>
      <p className="text-sm text-gray-500 mb-4">
        {error.message}
      </p>
      {retryable && onRetry && (
        <div className="flex gap-2 justify-content-center">
          <Button 
            label="Spróbuj ponownie" 
            icon="pi pi-refresh"
            onClick={onRetry}
            className="p-button-outlined p-button-sm"
          />
          <Button 
            label="Odśwież stronę" 
            icon="pi pi-sync"
            onClick={() => window.location.reload()}
            className="p-button-text p-button-sm"
          />
        </div>
      )}
    </div>
  </div>
);

// HOC dla lazy loading z zaawansowanymi funkcjami
function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  componentName: string,
  options: LazyComponentProps = {}
): ComponentType<React.ComponentProps<T>> {
  
  // Lazy component z error boundary
  const LazyComponent = lazy(async () => {
    try {
      const startTime = performance.now();
      
      // REMOVED: Bundle optimizer - Direct import for better performance
      const module = await importFunction();

      const loadTime = performance.now() - startTime;
      
      trackHVACUserAction('lazy_component_loaded', 'PERFORMANCE', {
        component: componentName,
        loadTime,
        priority: options.priority || 'low',
      });

      return module;
      
    } catch (error) {
      reportHVACError(error as Error, 'PERFORMANCE', {
        operation: 'lazy_load_component',
        component: componentName,
      });
      
      throw error;
    }
  });

  // Wrapper component z error handling
  const WrappedComponent: ComponentType<React.ComponentProps<T>> = (props) => {
    const [retryCount, setRetryCount] = React.useState(0);
    const [lastError, setLastError] = React.useState<LazyLoadError | null>(null);

    const handleRetry = React.useCallback(() => {
      setRetryCount(prev => prev + 1);
      setLastError(null);
      
      trackHVACUserAction('lazy_component_retry', 'PERFORMANCE', {
        component: componentName,
        retryCount: retryCount + 1,
      });
    }, [retryCount]);

    const errorBoundary = React.useMemo(() => {
      return class extends React.Component<
        { children: ReactNode },
        { hasError: boolean; error: Error | null }
      > {
        constructor(props: { children: ReactNode }) {
          super(props);
          this.state = { hasError: false, error: null };
        }

        static getDerivedStateFromError(error: Error) {
          return { hasError: true, error };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          const lazyError: LazyLoadError = {
            message: error.message,
            component: componentName,
            timestamp: new Date(),
            retryCount,
          };
          
          setLastError(lazyError);
          
          reportHVACError(error, 'PERFORMANCE', {
            operation: 'lazy_component_error',
            component: componentName,
            retryCount,
            errorInfo: errorInfo.componentStack,
          });
        }

        render() {
          if (this.state.hasError && lastError) {
            return options.errorFallback || (
              <HvacErrorFallback 
                error={lastError}
                onRetry={options.retryable !== false ? handleRetry : undefined}
                retryable={options.retryable}
              />
            );
          }

          return this.props.children;
        }
      };
    }, [retryCount, lastError, handleRetry]);

    const ErrorBoundary = errorBoundary;

    return (
      <ErrorBoundary>
        <Suspense 
          fallback={
            options.fallback || 
            <HvacLoadingSpinner message={`Ładowanie ${componentName}...`} />
          }
        >
          <LazyComponent {...props} key={retryCount} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `LazyHvac(${componentName})`;
  
  return WrappedComponent;
}

// Predefiniowane lazy components dla modułów HVAC
export const LazyHvacCustomers = createLazyComponent(
  () => import('./HvacCustomerList').then(module => ({ default: module.HvacCustomerList })),
  'HvacCustomers',
  {
    priority: 'high',
    preload: true,
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Klientów HVAC..." />
  }
);

export const LazyHvacServiceTickets = createLazyComponent(
  () => import('./HvacServiceTicketList').then(module => ({ default: module.HvacServiceTicketList })),
  'HvacServiceTickets',
  {
    priority: 'high',
    preload: true,
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Zleceń Serwisowych..." />
  }
);

export const LazyHvacEquipment = createLazyComponent(
  () => import('./equipment/HvacEquipmentManagement').then(module => ({ default: module.HvacEquipmentManagement })),
  'HvacEquipment',
  {
    priority: 'medium',
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Sprzętu HVAC..." />
  }
);

export const LazyHvacAnalytics = createLazyComponent(
  () => import('./analytics/AdvancedAnalyticsDashboard').then(module => ({ default: module.AdvancedAnalyticsDashboard })),
  'HvacAnalytics',
  {
    priority: 'low', // Analytics nie są krytyczne dla initial load
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Analityki HVAC..." />
  }
);

export const LazyHvacTechnicians = createLazyComponent(
  () => import('./scheduling/HvacTechnicianTracker').then(module => ({ default: module.HvacTechnicianTracker })),
  'HvacTechnicians',
  {
    priority: 'medium',
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Techników..." />
  }
);

export const LazyHvacQuotes = createLazyComponent(
  () => import('./HvacDashboard').then(module => ({ default: module.HvacDashboard })),
  'HvacQuotes',
  {
    priority: 'medium',
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Wycen..." />
  }
);

export const LazyHvacFinances = createLazyComponent(
  () => import('./HvacDashboard').then(module => ({ default: module.HvacDashboard })),
  'HvacFinances',
  {
    priority: 'low',
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Finansów..." />
  }
);

export const LazyHvacInventory = createLazyComponent(
  () => import('./HvacDashboard').then(module => ({ default: module.HvacDashboard })),
  'HvacInventory',
  {
    priority: 'low',
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Magazynu..." />
  }
);

export const LazyHvacInspections = createLazyComponent(
  () => import('./maintenance/HvacMaintenanceDashboard').then(module => ({ default: module.HvacMaintenanceDashboard })),
  'HvacInspections',
  {
    priority: 'low',
    fallback: <HvacLoadingSpinner message="Ładowanie modułu Przeglądów..." />
  }
);

// Hook do preloadingu komponentów
export const useHvacPreloader = () => {
  const preloadComponent = React.useCallback(async (componentName: string) => {
    try {
      const importMap: Record<string, () => Promise<any>> = {
        'HvacCustomers': () => import('./HvacCustomerList'),
        'HvacServiceTickets': () => import('./HvacServiceTicketList'),
        'HvacEquipment': () => import('./equipment/HvacEquipmentManagement'),
        'HvacAnalytics': () => import('./analytics/AdvancedAnalyticsDashboard'),
        'HvacTechnicians': () => import('./scheduling/HvacTechnicianTracker'),
        'HvacQuotes': () => import('./HvacDashboard'),
        'HvacFinances': () => import('./HvacDashboard'),
        'HvacInventory': () => import('./HvacDashboard'),
        'HvacInspections': () => import('./maintenance/HvacMaintenanceDashboard'),
      };

      const importFunction = importMap[componentName];
      if (importFunction) {
        // REMOVED: Bundle optimizer - Direct preload for better performance
        await importFunction();
        
        trackHVACUserAction('component_preloaded', 'PERFORMANCE', {
          component: componentName,
        });
      }
    } catch (error) {
      reportHVACError(error as Error, 'PERFORMANCE', {
        operation: 'preload_component',
        component: componentName,
      });
    }
  }, []);

  const preloadCriticalComponents = React.useCallback(async () => {
    const criticalComponents = ['HvacCustomers', 'HvacServiceTickets'];
    await Promise.allSettled(
      criticalComponents.map(component => preloadComponent(component))
    );
  }, [preloadComponent]);

  return {
    preloadComponent,
    preloadCriticalComponents,
  };
};

// Export utility functions
export {
    HvacErrorFallback, HvacLoadingSpinner, createLazyComponent, type LazyComponentProps,
    type LazyLoadError
};

