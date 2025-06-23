/**
 * HVAC Suspense Wrapper Component
 * "Pasja rodzi profesjonalizm" - Enhanced Suspense with error handling
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { Suspense, ReactNode } from 'react';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Skeleton } from 'primereact/skeleton';

// HVAC Error Boundary
import { HVACErrorBoundary } from '../HVACErrorBoundary';

// Types
interface HVACSuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  loadingMessage?: string;
  skeletonType?: 'card' | 'list' | 'table' | 'custom';
  skeletonRows?: number;
}

// Skeleton components for different content types
const SkeletonCard: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <Card>
    <div className="flex flex-column gap-3">
      <Skeleton width="60%" height="2rem" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} width="100%" height="1rem" />
      ))}
      <div className="flex gap-2">
        <Skeleton width="5rem" height="2.5rem" />
        <Skeleton width="5rem" height="2.5rem" />
      </div>
    </div>
  </Card>
);

const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="flex flex-column gap-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex align-items-center gap-3 p-3 border-round border-1 border-gray-200">
        <Skeleton shape="circle" size="3rem" />
        <div className="flex-1">
          <Skeleton width="70%" height="1rem" className="mb-2" />
          <Skeleton width="50%" height="0.8rem" />
        </div>
        <Skeleton width="4rem" height="2rem" />
      </div>
    ))}
  </div>
);

const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="border-round border-1 border-gray-200">
    {/* Table header */}
    <div className="flex p-3 bg-gray-50 border-bottom-1 border-gray-200">
      <Skeleton width="20%" height="1rem" className="mr-3" />
      <Skeleton width="25%" height="1rem" className="mr-3" />
      <Skeleton width="20%" height="1rem" className="mr-3" />
      <Skeleton width="15%" height="1rem" />
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex p-3 border-bottom-1 border-gray-200">
        <Skeleton width="20%" height="1rem" className="mr-3" />
        <Skeleton width="25%" height="1rem" className="mr-3" />
        <Skeleton width="20%" height="1rem" className="mr-3" />
        <Skeleton width="15%" height="1rem" />
      </div>
    ))}
  </div>
);

// Default loading fallback
const DefaultLoadingFallback: React.FC<{ message?: string }> = ({ 
  message = 'Ładowanie...' 
}) => (
  <Card className="text-center p-6">
    <ProgressSpinner />
    <p className="mt-3 text-600">{message}</p>
  </Card>
);

export const HVACSuspenseWrapper: React.FC<HVACSuspenseWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  loadingMessage = 'Ładowanie danych HVAC...',
  skeletonType = 'card',
  skeletonRows = 3,
}) => {
  // Render appropriate skeleton based on type
  const renderSkeleton = () => {
    switch (skeletonType) {
      case 'list':
        return <SkeletonList rows={skeletonRows} />;
      case 'table':
        return <SkeletonTable rows={skeletonRows} />;
      case 'card':
        return <SkeletonCard rows={skeletonRows} />;
      case 'custom':
        return fallback || <DefaultLoadingFallback message={loadingMessage} />;
      default:
        return <DefaultLoadingFallback message={loadingMessage} />;
    }
  };

  return (
    <HVACErrorBoundary
      context="UI_COMPONENT"
      customTitle="Błąd ładowania komponentu"
      customMessage="Wystąpił problem podczas ładowania komponentu HVAC."
      fallback={errorFallback}
    >
      <Suspense fallback={fallback || renderSkeleton()}>
        {children}
      </Suspense>
    </HVACErrorBoundary>
  );
};
