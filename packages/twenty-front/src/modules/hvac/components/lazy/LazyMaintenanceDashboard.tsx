/**
 * LazyMaintenanceDashboard - Lazy-loaded Maintenance Dashboard
 * "Pasja rodzi profesjonalizm" - Optimized loading for heavy calendar and chart components
 *
 * This component implements lazy loading for the HvacMaintenanceDashboard
 * to reduce the main bundle size by ~300KB (Calendar and Chart dependencies)
 */

import { Card } from 'primereact/card';
import { Skeleton } from 'primereact/skeleton';
import React, { Suspense, lazy } from 'react';
import { HVACErrorBoundary } from '../HVACErrorBoundary';

// Lazy load the heavy maintenance dashboard
const HvacMaintenanceDashboard = lazy(() =>
  import('../maintenance/HvacMaintenanceDashboard').then(module => ({
    default: module.HvacMaintenanceDashboard
  }))
);

// Component props
interface LazyMaintenanceDashboardProps {
  className?: string;
}

// Loading skeleton component
const MaintenanceLoadingSkeleton: React.FC = () => (
  <div className="maintenance-loading-skeleton">
    {/* Header skeleton */}
    <Card className="mb-4">
      <div className="flex justify-content-between align-items-center">
        <div>
          <Skeleton width="280px" height="2rem" className="mb-2" />
          <Skeleton width="450px" height="1rem" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="120px" height="2.5rem" />
          <Skeleton width="150px" height="2.5rem" />
          <Skeleton width="40px" height="2.5rem" />
        </div>
      </div>
    </Card>

    {/* Stats Cards skeleton */}
    <div className="grid mb-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="col-12 md:col-3">
          <Card className="text-center">
            <Skeleton width="60px" height="3rem" className="mb-2 mx-auto" />
            <Skeleton width="140px" height="1rem" className="mb-1 mx-auto" />
            <Skeleton width="100px" height="0.8rem" className="mx-auto" />
          </Card>
        </div>
      ))}
    </div>

    {/* Calendar and Schedule skeleton */}
    <div className="grid mb-4">
      <div className="col-12 md:col-8">
        <Card>
          <Skeleton width="200px" height="1.5rem" className="mb-3" />
          <Skeleton width="100%" height="400px" />
        </Card>
      </div>
      <div className="col-12 md:col-4">
        <Card>
          <Skeleton width="180px" height="1.5rem" className="mb-3" />
          <div className="flex flex-column gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-content-between align-items-center p-2 border-1 border-200 border-round">
                <div>
                  <Skeleton width="120px" height="1rem" className="mb-1" />
                  <Skeleton width="80px" height="0.8rem" />
                </div>
                <Skeleton width="60px" height="1.5rem" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>

    {/* Equipment Status skeleton */}
    <div className="grid mb-4">
      <div className="col-12 md:col-6">
        <Card>
          <Skeleton width="160px" height="1.5rem" className="mb-3" />
          <div className="flex flex-column gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex align-items-center gap-3 p-3 border-1 border-200 border-round">
                <Skeleton width="50px" height="50px" className="border-circle" />
                <div className="flex-1">
                  <Skeleton width="150px" height="1rem" className="mb-1" />
                  <Skeleton width="100px" height="0.8rem" />
                </div>
                <Skeleton width="80px" height="1.5rem" />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="col-12 md:col-6">
        <Card>
          <Skeleton width="180px" height="1.5rem" className="mb-3" />
          <Skeleton width="100%" height="250px" />
        </Card>
      </div>
    </div>

    {/* Recent Activity skeleton */}
    <Card>
      <Skeleton width="140px" height="1.5rem" className="mb-3" />
      <div className="flex flex-column gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex justify-content-between align-items-center p-2 border-bottom-1 border-200">
            <div className="flex align-items-center gap-3">
              <Skeleton width="30px" height="30px" className="border-circle" />
              <div>
                <Skeleton width="200px" height="1rem" className="mb-1" />
                <Skeleton width="120px" height="0.8rem" />
              </div>
            </div>
            <Skeleton width="80px" height="0.8rem" />
          </div>
        ))}
      </div>
    </Card>
  </div>
);



export const LazyMaintenanceDashboard: React.FC<LazyMaintenanceDashboardProps> = ({
  className = '',
}) => {
  return (
    <div className={`lazy-maintenance-dashboard ${className}`}>
      <HVACErrorBoundary
        context="EQUIPMENT_MANAGEMENT"
        customTitle="Błąd ładowania dashboard konserwacji"
        customMessage="Wystąpił problem podczas ładowania komponentów konserwacji."
      >
        <Suspense fallback={<MaintenanceLoadingSkeleton />}>
          <HvacMaintenanceDashboard />
        </Suspense>
      </HVACErrorBoundary>
    </div>
  );
};
