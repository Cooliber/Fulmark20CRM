/**
 * LazyMaintenanceDashboard - Lazy-loaded Maintenance Dashboard
 * "Pasja rodzi profesjonalizm" - Optimized loading for heavy calendar and chart components
 *
 * This component implements lazy loading for the HvacMaintenanceDashboard
 * to reduce the main bundle size by ~300KB (Calendar and Chart dependencies)
 */

// Replaced PrimeReact with Twenty UI components for bundle optimization
import React, { Suspense, lazy } from 'react';
import { Card } from 'twenty-ui/layout';
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

// Loading skeleton component using Twenty UI
const MaintenanceLoadingSkeleton: React.FC = () => (
  <div className="maintenance-loading-skeleton">
    {/* Header skeleton */}
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="h-8 bg-gray-200 rounded w-72 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-10 animate-pulse"></div>
        </div>
      </div>
    </Card>

    {/* Stats Cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <div className="text-center">
            <div className="h-12 bg-gray-200 rounded w-16 mb-2 mx-auto animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-36 mb-1 mx-auto animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
          </div>
        </Card>
      ))}
    </div>

    {/* Calendar and Schedule skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="md:col-span-2">
        <Card>
          <div className="h-6 bg-gray-200 rounded w-48 mb-3 animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </Card>
      </div>
      <div>
        <Card>
          <div className="h-6 bg-gray-200 rounded w-44 mb-3 animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center p-2 border border-gray-200 rounded">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
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
