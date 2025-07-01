/**
 * HVAC Analytics Page
 * "Pasja rodzi profesjonalizm" - Professional HVAC Analytics Interface
 *
 * Advanced analytics page for HVAC operations including:
 * - Performance metrics and KPIs
 * - Customer data flow analysis
 * - Quote management analytics
 * - Data pipeline monitoring
 * - Business intelligence insights
 */

import React, { Suspense, useState, useCallback } from 'react';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { IconChartCandle, IconAnalyze, IconRefresh } from 'twenty-ui';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

// HVAC Components - Using lazy loading for performance
import { 
  LazyAnalyticsDashboard,
  HVACErrorBoundary,
  useHVACPerformanceMonitoring,
  trackHVACUserAction
} from '~/modules/hvac';

// Loading component
const AnalyticsSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse"></div>
      ))}
    </div>
    <div className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
  </div>
);

export const HvacAnalyticsPage: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Performance monitoring
  const { getMetrics } = useHVACPerformanceMonitoring({
    enableMetrics: true,
    performanceThreshold: 300,
  });

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    trackHVACUserAction('analytics_refresh', 'ANALYTICS', {
      timestamp: new Date().toISOString(),
    });

    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.current?.show({
        severity: 'success',
        summary: 'Odświeżono',
        detail: 'Dane analityczne zostały zaktualizowane',
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się odświeżyć danych',
        life: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <PageContainer>
      <Toast ref={toast} />
      
      <PageHeader title="Analityka HVAC" Icon={IconChartCandle}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IconAnalyze size={16} />
            <span>Zaawansowana analiza danych</span>
          </div>
          
          <Button
            icon="pi pi-refresh"
            label="Odśwież"
            className="p-button-outlined p-button-sm"
            onClick={handleRefresh}
            loading={isRefreshing}
          />
        </div>
      </PageHeader>
      
      <PageBody>
        <HVACErrorBoundary>
          <Suspense fallback={<AnalyticsSkeleton />}>
            <LazyAnalyticsDashboard />
          </Suspense>
        </HVACErrorBoundary>
      </PageBody>
    </PageContainer>
  );
};
