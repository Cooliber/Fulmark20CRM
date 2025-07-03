/**
 * Performance Monitor Component
 * "Pasja rodzi profesjonalizm" - Professional Performance Monitoring UI
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Functional components only
 * - Event handlers over useEffect
 * - Performance optimization with Core Web Vitals display
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { motion } from 'framer-motion';

// HVAC Performance Monitoring
import { useHVACPerformanceMonitoring } from '../../hooks/useHVACPerformanceMonitoring';
import { 
  performanceMonitoringService,
  PERFORMANCE_THRESHOLDS,
  type CoreWebVitalMetric 
} from '../../services/PerformanceMonitoringService';

// Types
interface PerformanceMonitorProps {
  showCoreWebVitals?: boolean;
  showSearchMetrics?: boolean;
  showComponentMetrics?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  className?: string;
}

interface MetricDisplayProps {
  label: string;
  value: number;
  threshold: { good: number; poor: number };
  unit: string;
  description: string;
}

// Metric Display Component
const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  threshold,
  unit,
  description,
}) => {
  const getRating = (val: number): 'good' | 'needs-improvement' | 'poor' => {
    if (val <= threshold.good) return 'good';
    if (val <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const rating = getRating(value);
  const percentage = Math.min((value / threshold.poor) * 100, 100);

  const getBadgeColor = (rating: string): string => {
    switch (rating) {
      case 'good': return 'success';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'danger';
      default: return 'info';
    }
  };

  return (
    <motion.div
      className="performance-metric p-3 border-round-md surface-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-content-between align-items-center mb-2">
        <span className="font-semibold text-sm">{label}</span>
        <Badge 
          value={rating.replace('-', ' ')} 
          severity={getBadgeColor(rating)}
          className="text-xs"
        />
      </div>
      
      <div className="flex align-items-center gap-2 mb-2">
        <span className="text-2xl font-bold">
          {value.toFixed(value < 10 ? 2 : 0)}
        </span>
        <span className="text-sm text-color-secondary">{unit}</span>
      </div>
      
      <ProgressBar 
        value={percentage} 
        showValue={false}
        className="h-1rem mb-2"
        color={rating === 'good' ? '#22c55e' : rating === 'needs-improvement' ? '#f59e0b' : '#ef4444'}
      />
      
      <p className="text-xs text-color-secondary m-0" data-pr-tooltip={description}>
        {description}
      </p>
      <Tooltip target={`[data-pr-tooltip="${description}"]`} />
    </motion.div>
  );
};

// Main Performance Monitor Component
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showCoreWebVitals = true,
  showSearchMetrics = true,
  showComponentMetrics = true,
  autoRefresh = true,
  refreshInterval = 30,
  className = '',
}) => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { getPerformanceSummary, addPerformanceBreadcrumb } = useHVACPerformanceMonitoring();

  // Event handler for refreshing performance data
  const handleRefreshPerformanceData = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const summary = getPerformanceSummary();
      setPerformanceData(summary);
      
      addPerformanceBreadcrumb('Performance data refreshed', {
        timestamp: new Date().toISOString(),
        dataPoints: Object.keys(summary.coreWebVitals || {}).length,
      });
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
      addPerformanceBreadcrumb('Performance data refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [getPerformanceSummary, addPerformanceBreadcrumb]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(handleRefreshPerformanceData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, handleRefreshPerformanceData]);

  // Initial data load
  useEffect(() => {
    handleRefreshPerformanceData();
  }, [handleRefreshPerformanceData]);

  if (!performanceData) {
    return (
      <Card className={`performance-monitor-loading ${className}`}>
        <div className="flex align-items-center justify-content-center p-4">
          <i className="pi pi-spin pi-spinner mr-2" />
          <span>Ładowanie danych wydajności...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`performance-monitor ${className}`}
      title="Monitor Wydajności HVAC"
      subTitle="Monitorowanie Core Web Vitals i wydajności wyszukiwania"
    >
      <div className="performance-monitor-content">
        {/* Header with refresh button */}
        <div className="flex justify-content-between align-items-center mb-4">
          <h3 className="m-0">Metryki Wydajności</h3>
          <Button
            icon="pi pi-refresh"
            label="Odśwież"
            size="small"
            outlined
            loading={isRefreshing}
            onClick={handleRefreshPerformanceData}
            className="p-button-sm"
          />
        </div>

        {/* Core Web Vitals */}
        {showCoreWebVitals && performanceData.coreWebVitals && (
          <div className="core-web-vitals mb-4">
            <h4 className="mb-3">Core Web Vitals</h4>
            <div className="grid">
              {Object.entries(performanceData.coreWebVitals).map(([metric, data]: [string, any]) => (
                <div key={metric} className="col-12 md:col-6 lg:col-4">
                  <MetricDisplay
                    label={metric}
                    value={data.latest}
                    threshold={PERFORMANCE_THRESHOLDS[metric as CoreWebVitalMetric]}
                    unit={metric === 'CLS' ? '' : 'ms'}
                    description={getMetricDescription(metric as CoreWebVitalMetric)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Performance */}
        {showSearchMetrics && performanceData.searchPerformance && (
          <div className="search-performance mb-4">
            <h4 className="mb-3">Wydajność Wyszukiwania</h4>
            <div className="grid">
              <div className="col-12 md:col-4">
                <MetricDisplay
                  label="Średni czas odpowiedzi"
                  value={performanceData.searchPerformance.averageResponseTime}
                  threshold={PERFORMANCE_THRESHOLDS.searchResponse}
                  unit="ms"
                  description="Średni czas odpowiedzi wyszukiwania semantycznego (cel: <300ms)"
                />
              </div>
              <div className="col-12 md:col-4">
                <MetricDisplay
                  label="Współczynnik trafień cache"
                  value={performanceData.searchPerformance.cacheHitRate * 100}
                  threshold={{ good: 80, poor: 50 }}
                  unit="%"
                  description="Procent zapytań obsłużonych z cache (cel: >80%)"
                />
              </div>
              <div className="col-12 md:col-4">
                <div className="performance-metric p-3 border-round-md surface-card">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {performanceData.searchPerformance.totalSearches}
                    </div>
                    <div className="text-sm text-color-secondary">
                      Łączna liczba wyszukiwań
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Component Performance */}
        {showComponentMetrics && performanceData.componentPerformance && (
          <div className="component-performance">
            <h4 className="mb-3">Wydajność Komponentów</h4>
            <div className="slowest-components">
              {performanceData.componentPerformance.slowestComponents.slice(0, 5).map((comp: any, index: number) => (
                <motion.div
                  key={comp.name}
                  className="flex justify-content-between align-items-center p-2 border-round-md surface-border mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <span className="font-medium">{comp.name}</span>
                  <div className="flex align-items-center gap-2">
                    <span className="text-sm">{comp.avgRenderTime.toFixed(2)}ms</span>
                    <Badge 
                      value={comp.avgRenderTime > PERFORMANCE_THRESHOLDS.componentRender.poor ? 'Wolny' : 'OK'}
                      severity={comp.avgRenderTime > PERFORMANCE_THRESHOLDS.componentRender.poor ? 'danger' : 'success'}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Status */}
        <div className="performance-status mt-4 p-3 border-round-md surface-ground">
          <div className="flex align-items-center gap-2">
            <i className={`pi ${getOverallHealthIcon(performanceData)} text-lg`} />
            <span className="font-semibold">
              Status ogólny: {getOverallHealthStatus(performanceData)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Helper functions
const getMetricDescription = (metric: CoreWebVitalMetric): string => {
  const descriptions = {
    LCP: 'Largest Contentful Paint - czas ładowania głównej treści (cel: <1.8s)',
    FID: 'First Input Delay - czas odpowiedzi na pierwszą interakcję (cel: <100ms)',
    CLS: 'Cumulative Layout Shift - stabilność układu wizualnego (cel: <0.1)',
    FCP: 'First Contentful Paint - czas pierwszego renderowania (cel: <1s)',
    TTFB: 'Time to First Byte - czas odpowiedzi serwera (cel: <200ms)',
  };
  return descriptions[metric] || 'Nieznana metryka wydajności';
};

const getOverallHealthIcon = (data: any): string => {
  const coreWebVitals = data.coreWebVitals || {};
  const poorMetrics = Object.values(coreWebVitals).filter((metric: any) => metric.rating === 'poor').length;
  
  if (poorMetrics === 0) return 'pi-check-circle text-green-500';
  if (poorMetrics <= 2) return 'pi-exclamation-triangle text-yellow-500';
  return 'pi-times-circle text-red-500';
};

const getOverallHealthStatus = (data: any): string => {
  const coreWebVitals = data.coreWebVitals || {};
  const poorMetrics = Object.values(coreWebVitals).filter((metric: any) => metric.rating === 'poor').length;
  
  if (poorMetrics === 0) return 'Doskonały';
  if (poorMetrics <= 2) return 'Wymaga uwagi';
  return 'Krytyczny';
};

// Component display name
PerformanceMonitor.displayName = 'PerformanceMonitor';
