/**
 * HVAC Lazy Loader - SOTA Implementation
 * "Pasja rodzi profesjonalizm" - Zaawansowany system lazy loading
 * 
 * Ten system zapewnia:
 * - Intelligent component lazy loading
 * - Suspense boundaries z custom fallbacks
 * - Error boundaries z retry logic
 * - Performance monitoring
 * - Progressive loading strategies
 */

import React, { ComponentType, ErrorInfo, ReactNode, Suspense, lazy } from 'react';
import { ComponentPriority, hvacBundleOptimizer } from './HvacBundleOptimizer';

// Lazy Loading Configuration
interface LazyLoadConfig {
  retryAttempts: number;
  retryDelay: number;
  showLoadingSpinner: boolean;
  enableErrorBoundary: boolean;
  preloadOnHover: boolean;
  trackPerformance: boolean;
}

const DEFAULT_LAZY_CONFIG: LazyLoadConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  showLoadingSpinner: true,
  enableErrorBoundary: true,
  preloadOnHover: true,
  trackPerformance: true,
};

// Loading States
interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  loadTime: number;
}

// HVAC Loading Skeleton Components
const HvacLoadingSkeleton: React.FC<{ type: 'dashboard' | 'analytics' | 'maintenance' | 'kanban' }> = ({ type }) => {
  const skeletonStyles = {
    dashboard: 'h-96 bg-gray-100 animate-pulse rounded-lg',
    analytics: 'h-80 bg-blue-50 animate-pulse rounded-lg flex items-center justify-center',
    maintenance: 'h-72 bg-green-50 animate-pulse rounded-lg',
    kanban: 'h-screen bg-purple-50 animate-pulse rounded-lg',
  };

  const messages = {
    dashboard: '📊 Ładowanie Dashboard HVAC...',
    analytics: '📈 Przygotowywanie Analityki...',
    maintenance: '🔧 Ładowanie Konserwacji...',
    kanban: '📋 Inicjalizacja Kanban...',
  };

  return (
    <div className={skeletonStyles[type]}>
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-2xl mb-4">{messages[type].split(' ')[0]}</div>
        <div className="text-lg font-medium">{messages[type].slice(2)}</div>
        <div className="mt-4 w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="w-full h-full bg-blue-500 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

// HVAC Error Boundary
interface HvacErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class HvacErrorBoundary extends React.Component<
  { children: ReactNode; componentName: string; onRetry?: () => void },
  HvacErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<HvacErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`HVAC Component Error in ${this.props.componentName}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Błąd ładowania komponentu HVAC
            </h3>
            <p className="text-red-600 mb-4">
              Komponent "{this.props.componentName}" nie mógł zostać załadowany.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Spróbuj ponownie ({this.state.retryCount}/3)
            </button>
            {process.env['NODE_ENV'] === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-red-700">Szczegóły błędu</summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HVAC Lazy Component Wrapper
interface HvacLazyWrapperProps {
  componentName: string;
  fallback?: ReactNode;
  config?: Partial<LazyLoadConfig>;
  priority?: ComponentPriority;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const HvacLazyWrapper: React.FC<HvacLazyWrapperProps & { children: ReactNode }> = ({
  componentName,
  fallback,
  config = {},
  priority = ComponentPriority.MEDIUM,
  onLoad,
  onError,
  children,
}) => {
  const finalConfig = { ...DEFAULT_LAZY_CONFIG, ...config };
  const [loadingState, setLoadingState] = React.useState<LoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    loadTime: 0,
  });

  const handleRetry = React.useCallback(() => {
    if (loadingState.retryCount < finalConfig.retryAttempts) {
      setLoadingState(prev => ({
        ...prev,
        error: null,
        retryCount: prev.retryCount + 1,
      }));
    }
  }, [loadingState.retryCount, finalConfig.retryAttempts]);

  const handleLoad = React.useCallback(() => {
    if (onLoad) onLoad();
    if (finalConfig.trackPerformance) {
      console.log(`HVAC Component "${componentName}" loaded successfully`);
    }
  }, [componentName, onLoad, finalConfig.trackPerformance]);

  const handleError = React.useCallback((error: Error) => {
    setLoadingState(prev => ({ ...prev, error }));
    if (onError) onError(error);
  }, [onError]);

  // Default fallback based on component type
  const getDefaultFallback = () => {
    if (componentName.includes('Analytics')) return <HvacLoadingSkeleton type="analytics" />;
    if (componentName.includes('Maintenance')) return <HvacLoadingSkeleton type="maintenance" />;
    if (componentName.includes('Kanban')) return <HvacLoadingSkeleton type="kanban" />;
    return <HvacLoadingSkeleton type="dashboard" />;
  };

  const suspenseFallback = fallback || getDefaultFallback();

  if (finalConfig.enableErrorBoundary) {
    return (
      <HvacErrorBoundary componentName={componentName} onRetry={handleRetry}>
        <Suspense fallback={suspenseFallback}>
          {children}
        </Suspense>
      </HvacErrorBoundary>
    );
  }

  return (
    <Suspense fallback={suspenseFallback}>
      {children}
    </Suspense>
  );
};

// HVAC Lazy Component Factory
export function createHvacLazyComponent<T extends {} = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string,
  config?: Partial<LazyLoadConfig>
): ComponentType<T & HvacLazyWrapperProps> {
  const LazyComponent = lazy(importFn);

  const WrappedComponent: ComponentType<T & HvacLazyWrapperProps> = (props) => {
    const { fallback, config: propConfig, priority, onLoad, onError, ...componentProps } = props;
    const finalConfig = { ...config, ...propConfig };

    return (
      <HvacLazyWrapper
        componentName={componentName}
        fallback={fallback}
        config={finalConfig}
        priority={priority}
        onLoad={onLoad}
        onError={onError}
      >
        <LazyComponent {...(componentProps as any)} />
      </HvacLazyWrapper>
    );
  };

  return WrappedComponent;
}

// Pre-configured HVAC Lazy Components - Simplified for TypeScript compatibility
export const LazyHvacAnalyticsDashboard: React.ComponentType<any> = createHvacLazyComponent(
  async () => {
    const module = await import('../lazy/LazyAnalyticsDashboard');
    return { default: module.LazyAnalyticsDashboard as any };
  },
  'HvacAnalyticsDashboard',
  { preloadOnHover: true, trackPerformance: true }
);

export const LazyHvacMaintenanceDashboard: React.ComponentType<any> = createHvacLazyComponent(
  async () => {
    const module = await import('../lazy/LazyMaintenanceDashboard');
    return { default: module.LazyMaintenanceDashboard as any };
  },
  'HvacMaintenanceDashboard',
  { preloadOnHover: true }
);

export const LazyHvacKanbanBoard: React.ComponentType<any> = createHvacLazyComponent(
  async () => {
    const module = await import('../lazy/LazyKanbanBoard');
    return { default: module.LazyKanbanBoard as any };
  },
  'HvacKanbanBoard',
  { retryAttempts: 5, retryDelay: 2000 }
);

// HVAC Progressive Loader Hook
export const useHvacProgressiveLoader = (componentName: string) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadComponent = React.useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await hvacBundleOptimizer.loadComponent(componentName);
      setIsLoaded(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [componentName, isLoaded, isLoading]);

  const preloadComponent = React.useCallback(() => {
    if (!isLoaded && !isLoading) {
      loadComponent();
    }
  }, [loadComponent, isLoaded, isLoading]);

  return {
    isLoaded,
    isLoading,
    error,
    loadComponent,
    preloadComponent,
  };
};

// HVAC Intersection Observer Hook for Viewport Loading
export const useHvacViewportLoader = (componentName: string, threshold = 0.1) => {
  const [ref, setRef] = React.useState<HTMLElement | null>(null);
  const { preloadComponent } = useHvacProgressiveLoader(componentName);

  React.useEffect(() => {
    if (!ref || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadComponent();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, preloadComponent, threshold]);

  return setRef;
};

// Export all utilities
export {
    DEFAULT_LAZY_CONFIG, HvacErrorBoundary, HvacLoadingSkeleton
};

    export type {
        HvacLazyWrapperProps, LazyLoadConfig,
        LoadingState
    };

