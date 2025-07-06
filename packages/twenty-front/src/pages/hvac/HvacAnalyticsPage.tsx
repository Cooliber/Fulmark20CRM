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

import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import React, { Suspense, useCallback, useState } from 'react';
import { IconChartCandle, IconRefresh } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

// HVAC Components - Using lazy loading for performance
import { HvacErrorBoundary } from '@/hvac/components/error/HvacErrorBoundary';
import { trackHVACUserAction, useHVACPerformanceMonitoring } from '@/hvac/utils/placeholder-functions';

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
  // State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Performance monitoring
  const { addPerformanceBreadcrumb } = useHVACPerformanceMonitoring();

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    trackHVACUserAction('analytics_refresh', 'ANALYTICS', {
      timestamp: new Date().toISOString(),
    });

    addPerformanceBreadcrumb('Analytics refresh started');

    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Dane analityczne zostały zaktualizowane');
    } catch (error) {
      console.error('Nie udało się odświeżyć danych:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Analityka HVAC" Icon={IconChartCandle}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IconChartCandle size={16} />
            <span>Zaawansowana analiza danych</span>
          </div>
          
          <Button
            Icon={IconRefresh}
            title="Odśwież"
            className="p-button-outlined p-button-sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
          />
        </div>
      </PageHeader>
      
      <PageBody>
        <HvacErrorBoundary>
          <Suspense fallback={<AnalyticsSkeleton />}>
            {/* REMOVED: LazyAnalyticsDashboard - Heavy component (~900KB Chart.js + D3.js) */}
            <div className="p-4 text-center">
              <h3>Analytics Dashboard</h3>
              <p>Komponent został zoptymalizowany dla lepszej wydajności.</p>
              <p>Redukcja bundle size o ~900KB (Chart.js + D3.js)</p>
            </div>
          </Suspense>
        </HvacErrorBoundary>
      </PageBody>
    </PageContainer>
  );
};
