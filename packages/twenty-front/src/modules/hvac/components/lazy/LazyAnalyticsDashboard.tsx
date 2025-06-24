/**
 * LazyAnalyticsDashboard - Lazy-loaded Analytics Dashboard
 * "Pasja rodzi profesjonalizm" - Optimized loading for heavy chart components
 *
 * This component implements lazy loading for the AdvancedAnalyticsDashboard
 * to reduce the main bundle size by ~500KB (PrimeReact Chart.js dependencies)
 */

import { Card } from 'primereact/card';
import { Skeleton } from 'primereact/skeleton';
import React, { Suspense, lazy } from 'react';
import { HVACErrorBoundary } from '../HVACErrorBoundary';

// Lazy load the heavy analytics dashboard
const AdvancedAnalyticsDashboard = lazy(() =>
  import('../analytics/AdvancedAnalyticsDashboard').then(module => ({
    default: module.AdvancedAnalyticsDashboard
  }))
);

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
      <HVACErrorBoundary
        context="ANALYTICS"
        customTitle="Błąd ładowania dashboard analitycznego"
        customMessage="Wystąpił problem podczas ładowania komponentów analitycznych."
      >
        <Suspense fallback={<AnalyticsLoadingSkeleton />}>
          <AdvancedAnalyticsDashboard className={className} />
        </Suspense>
      </HVACErrorBoundary>
    </div>
  );
};
