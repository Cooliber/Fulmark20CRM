/**
 * Customer 360 Loading State Component
 * "Pasja rodzi profesjonalizm" - Professional loading state
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React from 'react';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Skeleton } from 'primereact/skeleton';

export const Customer360LoadingState: React.FC = () => {
  return (
    <div className="customer-360-loading">
      {/* Header Skeleton */}
      <Card className="mb-4">
        <div className="flex align-items-center gap-4">
          <Skeleton shape="circle" size="4rem" />
          <div className="flex-1">
            <Skeleton width="200px" height="1.5rem" className="mb-2" />
            <Skeleton width="150px" height="1rem" className="mb-1" />
            <Skeleton width="100px" height="1rem" />
          </div>
          <div className="flex gap-2">
            <Skeleton width="80px" height="2.5rem" />
            <Skeleton width="80px" height="2.5rem" />
          </div>
        </div>
      </Card>

      {/* KPI Cards Skeleton */}
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <Card>
            <div className="text-center">
              <Skeleton width="60px" height="2rem" className="mb-2" />
              <Skeleton width="100px" height="1rem" />
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card>
            <div className="text-center">
              <Skeleton width="60px" height="2rem" className="mb-2" />
              <Skeleton width="100px" height="1rem" />
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card>
            <div className="text-center">
              <Skeleton width="60px" height="2rem" className="mb-2" />
              <Skeleton width="100px" height="1rem" />
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card>
            <div className="text-center">
              <Skeleton width="60px" height="2rem" className="mb-2" />
              <Skeleton width="100px" height="1rem" />
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <Card>
        <div className="text-center p-6">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
          <p className="mt-3 text-600 font-medium">Ładowanie danych klienta...</p>
          <p className="text-500 text-sm">Pobieranie informacji z systemu HVAC</p>
        </div>
        
        {/* Tab Headers Skeleton */}
        <div className="flex gap-4 mt-4 mb-4">
          <Skeleton width="80px" height="2rem" />
          <Skeleton width="100px" height="2rem" />
          <Skeleton width="90px" height="2rem" />
          <Skeleton width="80px" height="2rem" />
        </div>

        {/* Content Area Skeleton */}
        <div className="grid">
          <div className="col-12 md:col-6">
            <Skeleton width="100%" height="1.5rem" className="mb-3" />
            <Skeleton width="80%" height="1rem" className="mb-2" />
            <Skeleton width="90%" height="1rem" className="mb-2" />
            <Skeleton width="70%" height="1rem" className="mb-3" />
            
            <Skeleton width="100%" height="1.5rem" className="mb-3" />
            <Skeleton width="85%" height="1rem" className="mb-2" />
            <Skeleton width="75%" height="1rem" className="mb-2" />
          </div>
          <div className="col-12 md:col-6">
            <Skeleton width="100%" height="1.5rem" className="mb-3" />
            <Skeleton width="90%" height="1rem" className="mb-2" />
            <Skeleton width="80%" height="1rem" className="mb-2" />
            <Skeleton width="95%" height="1rem" className="mb-3" />
            
            <Skeleton width="100%" height="1.5rem" className="mb-3" />
            <Skeleton width="70%" height="1rem" className="mb-2" />
            <Skeleton width="85%" height="1rem" className="mb-2" />
          </div>
        </div>
      </Card>
    </div>
  );
};
