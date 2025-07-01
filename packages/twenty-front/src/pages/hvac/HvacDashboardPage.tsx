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

import React, { Suspense } from 'react';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { IconTool, IconDashboard } from 'twenty-ui';

// HVAC Components - Using lazy loading for performance
import { 
  HvacDashboard,
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
  const { getMetrics } = useHVACPerformanceMonitoring({
    enableMetrics: true,
    performanceThreshold: 300,
  });

  return (
    <PageContainer>
      <PageHeader title="Dashboard HVAC" Icon={IconDashboard}>
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
              <HvacDashboard />
            </Suspense>
          </div>
        </HVACErrorBoundary>
      </PageBody>
    </PageContainer>
  );
};
