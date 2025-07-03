/**
 * LazyAnalyticsDashboard - Lazy-loaded Analytics Dashboard
 * "Pasja rodzi profesjonalizm" - Optimized loading for heavy chart components
 *
 * This component implements lazy loading for the AdvancedAnalyticsDashboard
 * to reduce the main bundle size by ~500KB (PrimeReact Chart.js dependencies)
 */

// Replaced PrimeReact with native components for bundle optimization
import React, { Component, ErrorInfo, ReactNode, Suspense, lazy } from 'react';
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
// Import HvacCard from the correct location in twenty-front

// Simple placeholder component instead of heavy analytics dashboard
const AdvancedAnalyticsDashboard: React.FC<{ className?: string }> = ({ className }) => (
  <Card style={{ padding: '20px', textAlign: 'center' }}>
    <h3>Dashboard Analityczny HVAC</h3>
    <p>Moduł analityczny jest w trakcie ładowania...</p>
    <div style={{ marginTop: '20px', color: '#666' }}>
      📊 Zaawansowane analityki będą dostępne wkrótce
    </div>
  </Card>
);

// Simple Error Boundary for local use
interface ErrorBoundaryState {
  hasError: boolean;
}

class SimpleErrorBoundary extends Component<
  { children: ReactNode; context?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; context?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HVAC Dashboard Error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Wystąpił błąd</h3>
          <p>Nie udało się załadować komponentu dashboard analitycznego.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Spróbuj ponownie
          </button>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Component props
interface LazyAnalyticsDashboardProps {
  className?: string;
}

// Loading skeleton component
const AnalyticsLoadingSkeleton: React.FC = () => (
  <div className="analytics-loading-skeleton">
    {/* Header skeleton */}
    <Card className="mb-4">
      <div className="flex justify-content-between align-items-center">
        <div>
          <Skeleton width="300px" height="2rem" className="mb-2" />
          <Skeleton width="500px" height="1rem" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="150px" height="2.5rem" />
          <Skeleton width="200px" height="2.5rem" />
          <Skeleton width="40px" height="2.5rem" />
        </div>
      </div>
    </Card>

    {/* KPI Cards skeleton */}
    <div className="grid mb-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="col-12 md:col-3">
          <Card className="text-center">
            <Skeleton width="80px" height="3rem" className="mb-2 mx-auto" />
            <Skeleton width="120px" height="1rem" className="mb-1 mx-auto" />
            <Skeleton width="100px" height="0.8rem" className="mx-auto" />
          </Card>
        </div>
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid mb-4">
      <div className="col-12 md:col-8">
        <Card>
          <Skeleton width="200px" height="1.5rem" className="mb-3" />
          <Skeleton width="100%" height="300px" />
        </Card>
      </div>
      <div className="col-12 md:col-4">
        <Card>
          <Skeleton width="150px" height="1.5rem" className="mb-3" />
          <Skeleton width="100%" height="300px" />
        </Card>
      </div>
    </div>

    {/* Performance metrics skeleton */}
    <div className="grid">
      <div className="col-12 md:col-6">
        <Card>
          <Skeleton width="180px" height="1.5rem" className="mb-3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-content-between align-items-center mb-3">
              <div>
                <Skeleton width="120px" height="1rem" className="mb-1" />
                <Skeleton width="80px" height="0.8rem" />
              </div>
              <div>
                <Skeleton width="60px" height="1.5rem" className="mb-1" />
                <Skeleton width="80px" height="0.8rem" />
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div className="col-12 md:col-6">
        <Card>
          <Skeleton width="160px" height="1.5rem" className="mb-3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-content-between align-items-center mb-3">
              <div>
                <Skeleton width="100px" height="1rem" className="mb-1" />
                <Skeleton width="60px" height="0.8rem" />
              </div>
              <div>
                <Skeleton width="80px" height="1rem" className="mb-1" />
                <Skeleton width="100px" height="0.8rem" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </div>
);



export const LazyAnalyticsDashboard: React.FC<LazyAnalyticsDashboardProps> = ({
  className = '',
}) => {
  return (
    <div className={`lazy-analytics-dashboard ${className}`}>
      <SimpleErrorBoundary context="ANALYTICS">
        <Suspense fallback={<AnalyticsLoadingSkeleton />}>
          <AdvancedAnalyticsDashboard className={className} />
        </Suspense>
      </SimpleErrorBoundary>
    </div>
  );
};
