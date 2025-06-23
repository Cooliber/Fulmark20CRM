/**
 * PerformanceMonitor - HVAC CRM Performance Monitoring Component
 * "Pasja rodzi profesjonalizm" - Professional performance monitoring
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - Performance optimization focus
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

// HVAC monitoring
import { trackHVACUserAction } from '../../index';

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  apiCallCount: number;
  cacheHitRate: number;
  errorRate: number;
  userInteractions: number;
}

// Component props
interface PerformanceMonitorProps {
  componentName: string;
  showDetails?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName,
  showDetails = false,
  onMetricsUpdate,
  className = '',
}) => {
  // State for metrics and dialog
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    apiCallCount: 0,
    cacheHitRate: 0,
    errorRate: 0,
    userInteractions: 0,
  });
  
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Performance observer for render times
  const measureRenderTime = useCallback(() => {
    if ('performance' in window && 'measure' in window.performance) {
      try {
        const entries = performance.getEntriesByType('measure');
        const componentEntries = entries.filter(entry => 
          entry.name.includes(componentName)
        );
        
        if (componentEntries.length > 0) {
          const avgRenderTime = componentEntries.reduce((sum, entry) => 
            sum + entry.duration, 0
          ) / componentEntries.length;
          
          setMetrics(prev => ({ ...prev, renderTime: avgRenderTime }));
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  }, [componentName]);

  // Memory usage monitoring
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      setMetrics(prev => ({ ...prev, memoryUsage: usedMB }));
    }
  }, []);

  // API call tracking
  const trackAPICall = useCallback((success: boolean) => {
    setMetrics(prev => ({
      ...prev,
      apiCallCount: prev.apiCallCount + 1,
      errorRate: success 
        ? prev.errorRate 
        : (prev.errorRate * prev.apiCallCount + 1) / (prev.apiCallCount + 1),
    }));
  }, []);

  // Cache hit rate tracking
  const trackCacheHit = useCallback((isHit: boolean) => {
    setMetrics(prev => {
      const totalRequests = prev.apiCallCount || 1;
      const currentHits = prev.cacheHitRate * totalRequests;
      const newHits = isHit ? currentHits + 1 : currentHits;
      return {
        ...prev,
        cacheHitRate: newHits / (totalRequests + 1),
      };
    });
  }, []);

  // User interaction tracking
  const trackUserInteraction = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      userInteractions: prev.userInteractions + 1,
    }));
  }, []);

  // Performance monitoring setup
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      measureRenderTime();
      measureMemoryUsage();
    }, 5000); // Monitor every 5 seconds

    // Track user interactions
    const handleClick = () => trackUserInteraction();
    const handleKeyPress = () => trackUserInteraction();

    document.addEventListener('click', handleClick);
    document.addEventListener('keypress', handleKeyPress);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [isMonitoring, measureRenderTime, measureMemoryUsage, trackUserInteraction]);

  // Report metrics to parent and tracking
  useEffect(() => {
    onMetricsUpdate?.(metrics);
    
    // Track performance metrics
    trackHVACUserAction('performance_metrics_updated', 'PERFORMANCE', {
      componentName,
      renderTime: metrics.renderTime,
      memoryUsage: metrics.memoryUsage,
      apiCallCount: metrics.apiCallCount,
      cacheHitRate: metrics.cacheHitRate,
      errorRate: metrics.errorRate,
    });
  }, [metrics, componentName, onMetricsUpdate]);

  // Get performance status
  const getPerformanceStatus = useCallback(() => {
    if (metrics.renderTime > 100 || metrics.memoryUsage > 50 || metrics.errorRate > 0.1) {
      return { severity: 'danger' as const, label: 'Słaba' };
    }
    if (metrics.renderTime > 50 || metrics.memoryUsage > 25 || metrics.errorRate > 0.05) {
      return { severity: 'warning' as const, label: 'Średnia' };
    }
    return { severity: 'success' as const, label: 'Dobra' };
  }, [metrics]);

  // Toggle monitoring
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev);
    trackHVACUserAction('performance_monitoring_toggled', 'PERFORMANCE', {
      componentName,
      enabled: !isMonitoring,
    });
  }, [componentName, isMonitoring]);

  if (!showDetails) {
    const status = getPerformanceStatus();
    return (
      <div className={`performance-monitor-compact ${className}`}>
        <Badge 
          value={`Wydajność: ${status.label}`}
          severity={status.severity}
          className="cursor-pointer"
          onClick={() => setShowMetricsDialog(true)}
        />
      </div>
    );
  }

  const status = getPerformanceStatus();

  return (
    <div className={`performance-monitor ${className}`}>
      <Card 
        title="Monitor wydajności"
        className="performance-monitor-card"
      >
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-sm text-600">Status wydajności</span>
              <Badge value={status.label} severity={status.severity} />
            </div>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-sm text-600">Czas renderowania</span>
              <span className="text-sm font-semibold">
                {metrics.renderTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-sm text-600">Użycie pamięci</span>
              <span className="text-sm font-semibold">
                {metrics.memoryUsage.toFixed(1)}MB
              </span>
            </div>
          </div>
          
          <div className="col-12 md:col-6">
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-sm text-600">Wywołania API</span>
              <span className="text-sm font-semibold">{metrics.apiCallCount}</span>
            </div>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-sm text-600">Trafienia cache</span>
              <span className="text-sm font-semibold">
                {(metrics.cacheHitRate * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-sm text-600">Wskaźnik błędów</span>
              <span className="text-sm font-semibold">
                {(metrics.errorRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            label={isMonitoring ? 'Zatrzymaj' : 'Rozpocznij'}
            icon={isMonitoring ? 'pi pi-pause' : 'pi pi-play'}
            size="small"
            onClick={toggleMonitoring}
          />
          <Button
            label="Szczegóły"
            icon="pi pi-chart-line"
            size="small"
            outlined
            onClick={() => setShowMetricsDialog(true)}
          />
        </div>
      </Card>

      {/* Detailed metrics dialog */}
      <Dialog
        header={`Szczegóły wydajności - ${componentName}`}
        visible={showMetricsDialog}
        onHide={() => setShowMetricsDialog(false)}
        style={{ width: '50vw' }}
        modal
      >
        <div className="flex flex-column gap-4">
          <div>
            <div className="text-sm text-600 mb-2">Czas renderowania</div>
            <ProgressBar 
              value={Math.min(metrics.renderTime, 100)} 
              showValue={false}
              className="mb-2"
            />
            <div className="text-sm">{metrics.renderTime.toFixed(2)}ms</div>
          </div>

          <div>
            <div className="text-sm text-600 mb-2">Użycie pamięci</div>
            <ProgressBar 
              value={Math.min(metrics.memoryUsage, 100)} 
              showValue={false}
              className="mb-2"
            />
            <div className="text-sm">{metrics.memoryUsage.toFixed(1)}MB</div>
          </div>

          <div>
            <div className="text-sm text-600 mb-2">Trafienia cache</div>
            <ProgressBar 
              value={metrics.cacheHitRate * 100} 
              showValue={false}
              className="mb-2"
            />
            <div className="text-sm">{(metrics.cacheHitRate * 100).toFixed(1)}%</div>
          </div>

          <div className="grid">
            <div className="col-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.apiCallCount}</div>
                <div className="text-sm text-600">Wywołania API</div>
              </div>
            </div>
            <div className="col-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{metrics.userInteractions}</div>
                <div className="text-sm text-600">Interakcje użytkownika</div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
