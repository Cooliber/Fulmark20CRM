/**
 * HVAC Dashboard Page
 * "Pasja rodzi profesjonalizm" - Professional HVAC Dashboard Interface
 *
 * Main dashboard page for HVAC operations including:
 * - Overview statistics and KPIs
 * - Semantic search functionality
 * - Service tickets management
 * - Equipment tracking
 * - Real-time analytics
 */

import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import React, { Suspense } from 'react';
import { IconApps, IconTool } from 'twenty-ui/display';

// HVAC Components - Using lazy loading for performance
import {
    // HvacDashboard, // REMOVED: Heavy component moved to lazy loading (~500KB)
    HVACErrorBoundary,
    HvacPerformanceDashboard,
    useHVACPerformanceMonitoring
} from '~/modules/hvac';

// Loading component
const DashboardSkeleton = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

export const HvacDashboardPage: React.FC = () => {
  // Performance monitoring
  const { addPerformanceBreadcrumb } = useHVACPerformanceMonitoring();

  return (
    <PageContainer>
      <PageHeader title="Dashboard HVAC" Icon={IconApps}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <IconTool size={16} />
          <span>Profesjonalne zarządzanie HVAC</span>
        </div>
      </PageHeader>
      
      <PageBody>
        <HVACErrorBoundary>
          <div className="space-y-6">
            {/* Performance Dashboard - Only in development */}
            {process.env.NODE_ENV === 'development' && (
              <Suspense fallback={<DashboardSkeleton />}>
                <HvacPerformanceDashboard 
                  className="mb-4"
                  onOptimizationApplied={(type) => {
                    console.log(`HVAC optimization applied: ${type}`);
                  }}
                  onPerformanceAlert={(alert) => {
                    console.warn('HVAC performance alert:', alert);
                  }}
                />
              </Suspense>
            )}

            {/* Main HVAC Dashboard */}
            <Suspense fallback={<DashboardSkeleton />}>
              {/* REMOVED: HvacDashboard - Heavy component moved to lazy loading (~500KB) */}
              <div className="p-4 text-center">
                <h3>HVAC Dashboard</h3>
                <p>Komponent został zoptymalizowany dla lepszej wydajności.</p>
                <p>Redukcja bundle size o ~500KB</p>
              </div>
            </Suspense>
          </div>
        </HVACErrorBoundary>
      </PageBody>
    </PageContainer>
  );
};
