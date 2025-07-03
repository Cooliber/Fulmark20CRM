/**
 * Performance Monitoring Service
 * "Pasja rodzi profesjonalizm" - Professional Performance Monitoring
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Performance optimization with Core Web Vitals
 * - Proper TypeScript typing
 * - 300ms debounced search performance standards
 */

import { trackHVACUserAction } from '../index';

// Types
export type CoreWebVitalMetric = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';

export type PerformanceMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
  url: string;
  userAgent: string;
  connectionType?: string;
};

export type SearchPerformanceMetric = {
  query: string;
  searchType: 'semantic' | 'filter' | 'autocomplete';
  responseTime: number;
  resultCount: number;
  cacheHit: boolean;
  timestamp: Date;
  userId?: string;
};

export type ComponentPerformanceMetric = {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateTime: number;
  memoryUsage: number;
  timestamp: Date;
};

export type PerformanceThresholds = {
  LCP: { good: number; poor: number }; // Largest Contentful Paint
  FID: { good: number; poor: number }; // First Input Delay
  CLS: { good: number; poor: number }; // Cumulative Layout Shift
  FCP: { good: number; poor: number }; // First Contentful Paint
  TTFB: { good: number; poor: number }; // Time to First Byte
  searchResponse: { good: number; poor: number }; // Search response time
  componentRender: { good: number; poor: number }; // Component render time
};

// Performance thresholds based on Core Web Vitals and HVAC requirements
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 1800, poor: 4000 }, // 1.8s good, 4s poor
  FID: { good: 100, poor: 300 }, // 100ms good, 300ms poor
  CLS: { good: 0.1, poor: 0.25 }, // 0.1 good, 0.25 poor
  FCP: { good: 1000, poor: 3000 }, // 1s good, 3s poor
  TTFB: { good: 200, poor: 600 }, // 200ms good, 600ms poor
  searchResponse: { good: 300, poor: 1000 }, // 300ms good (debounced), 1s poor
  componentRender: { good: 16, poor: 100 }, // 16ms good (60fps), 100ms poor
};

class PerformanceMonitoringService {
  private coreWebVitalsMetrics: Map<CoreWebVitalMetric, PerformanceMetric[]>;
  private searchMetrics: SearchPerformanceMetric[];
  private componentMetrics: ComponentPerformanceMetric[];
  private observer: PerformanceObserver | null;
  private isMonitoring: boolean;

  constructor() {
    this.coreWebVitalsMetrics = new Map();
    this.searchMetrics = [];
    this.componentMetrics = [];
    this.observer = null;
    this.isMonitoring = false;

    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.setupCoreWebVitalsMonitoring();
    this.setupNavigationTimingMonitoring();
    this.setupResourceTimingMonitoring();
    this.isMonitoring = true;
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupCoreWebVitalsMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    // Monitor LCP (Largest Contentful Paint)
    this.observeMetric('largest-contentful-paint', (entry: any) => {
      this.recordCoreWebVital('LCP', entry.startTime);
    });

    // Monitor FID (First Input Delay)
    this.observeMetric('first-input', (entry: any) => {
      this.recordCoreWebVital('FID', entry.processingStart - entry.startTime);
    });

    // Monitor CLS (Cumulative Layout Shift)
    this.observeMetric('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        this.recordCoreWebVital('CLS', entry.value);
      }
    });

    // Monitor FCP (First Contentful Paint)
    this.observeMetric('paint', (entry: any) => {
      if (entry.name === 'first-contentful-paint') {
        this.recordCoreWebVital('FCP', entry.startTime);
      }
    });
  }

  /**
   * Setup navigation timing monitoring
   */
  private setupNavigationTimingMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    this.observeMetric('navigation', (entry: any) => {
      const ttfb = entry.responseStart - entry.requestStart;
      this.recordCoreWebVital('TTFB', ttfb);
    });
  }

  /**
   * Setup resource timing monitoring
   */
  private setupResourceTimingMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    this.observeMetric('resource', (entry: any) => {
      // Monitor slow resources
      const loadTime = entry.responseEnd - entry.startTime;
      if (loadTime > 1000) { // Resources taking more than 1s
        trackHVACUserAction('slow_resource_detected', 'PERFORMANCE', {
          resourceName: entry.name,
          loadTime,
          resourceType: entry.initiatorType,
        });
      }
    });
  }

  /**
   * Observe specific performance metric
   */
  private observeMetric(type: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Failed to observe ${type} metrics:`, error);
    }
  }

  /**
   * Record Core Web Vital metric
   */
  private recordCoreWebVital(metric: CoreWebVitalMetric, value: number): void {
    const thresholds = PERFORMANCE_THRESHOLDS[metric];
    const rating = value <= thresholds.good ? 'good' : 
                   value <= thresholds.poor ? 'needs-improvement' : 'poor';

    const performanceMetric: PerformanceMetric = {
      name: metric,
      value,
      rating,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType,
    };

    if (!this.coreWebVitalsMetrics.has(metric)) {
      this.coreWebVitalsMetrics.set(metric, []);
    }
    
    this.coreWebVitalsMetrics.get(metric)!.push(performanceMetric);

    // Track poor performance
    if (rating === 'poor') {
      trackHVACUserAction('poor_core_web_vital', 'PERFORMANCE', {
        metric,
        value,
        rating,
        url: window.location.href,
      });
    }

    // Keep only last 50 metrics per type
    const metrics = this.coreWebVitalsMetrics.get(metric)!;
    if (metrics.length > 50) {
      this.coreWebVitalsMetrics.set(metric, metrics.slice(-50));
    }
  }

  /**
   * Record search performance metric with 300ms threshold
   */
  recordSearchPerformance(
    query: string,
    searchType: 'semantic' | 'filter' | 'autocomplete',
    startTime: number,
    resultCount: number,
    cacheHit: boolean = false,
    userId?: string
  ): void {
    const responseTime = performance.now() - startTime;
    
    const searchMetric: SearchPerformanceMetric = {
      query,
      searchType,
      responseTime,
      resultCount,
      cacheHit,
      timestamp: new Date(),
      userId,
    };

    this.searchMetrics.push(searchMetric);

    // Check against 300ms threshold for debounced search
    const threshold = PERFORMANCE_THRESHOLDS.searchResponse;
    const rating = responseTime <= threshold.good ? 'good' : 
                   responseTime <= threshold.poor ? 'needs-improvement' : 'poor';

    if (rating !== 'good') {
      trackHVACUserAction('slow_search_performance', 'PERFORMANCE', {
        query: query.substring(0, 50), // Limit query length for privacy
        searchType,
        responseTime,
        resultCount,
        cacheHit,
        rating,
      });
    }

    // Keep only last 100 search metrics
    if (this.searchMetrics.length > 100) {
      this.searchMetrics = this.searchMetrics.slice(-100);
    }
  }

  /**
   * Record component performance metric
   */
  recordComponentPerformance(
    componentName: string,
    renderTime: number,
    mountTime: number = 0,
    updateTime: number = 0,
    memoryUsage: number = 0
  ): void {
    const componentMetric: ComponentPerformanceMetric = {
      componentName,
      renderTime,
      mountTime,
      updateTime,
      memoryUsage,
      timestamp: new Date(),
    };

    this.componentMetrics.push(componentMetric);

    // Check against render time threshold
    const threshold = PERFORMANCE_THRESHOLDS.componentRender;
    if (renderTime > threshold.poor) {
      trackHVACUserAction('slow_component_render', 'PERFORMANCE', {
        componentName,
        renderTime,
        mountTime,
        updateTime,
      });
    }

    // Keep only last 200 component metrics
    if (this.componentMetrics.length > 200) {
      this.componentMetrics = this.componentMetrics.slice(-200);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    coreWebVitals: Record<CoreWebVitalMetric, { latest: number; average: number; rating: string }>;
    searchPerformance: { averageResponseTime: number; cacheHitRate: number; totalSearches: number };
    componentPerformance: { slowestComponents: Array<{ name: string; avgRenderTime: number }> };
  } {
    const coreWebVitals = {} as any;
    
    // Calculate Core Web Vitals summary
    for (const [metric, metrics] of this.coreWebVitalsMetrics.entries()) {
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        const average = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        coreWebVitals[metric] = {
          latest: latest.value,
          average,
          rating: latest.rating,
        };
      }
    }

    // Calculate search performance summary
    const totalSearches = this.searchMetrics.length;
    const averageResponseTime = totalSearches > 0 
      ? this.searchMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalSearches 
      : 0;
    const cacheHits = this.searchMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalSearches > 0 ? cacheHits / totalSearches : 0;

    // Calculate component performance summary
    const componentStats = new Map<string, { totalTime: number; count: number }>();
    this.componentMetrics.forEach(metric => {
      const existing = componentStats.get(metric.componentName) || { totalTime: 0, count: 0 };
      componentStats.set(metric.componentName, {
        totalTime: existing.totalTime + metric.renderTime,
        count: existing.count + 1,
      });
    });

    const slowestComponents = Array.from(componentStats.entries())
      .map(([name, stats]) => ({
        name,
        avgRenderTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.avgRenderTime - a.avgRenderTime)
      .slice(0, 10);

    return {
      coreWebVitals,
      searchPerformance: {
        averageResponseTime,
        cacheHitRate,
        totalSearches,
      },
      componentPerformance: {
        slowestComponents,
      },
    };
  }

  /**
   * Get detailed metrics for analysis
   */
  getDetailedMetrics(): {
    coreWebVitals: Map<CoreWebVitalMetric, PerformanceMetric[]>;
    searchMetrics: SearchPerformanceMetric[];
    componentMetrics: ComponentPerformanceMetric[];
  } {
    return {
      coreWebVitals: new Map(this.coreWebVitalsMetrics),
      searchMetrics: [...this.searchMetrics],
      componentMetrics: [...this.componentMetrics],
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.coreWebVitalsMetrics.clear();
    this.searchMetrics = [];
    this.componentMetrics = [];
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.isMonitoring = false;
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

// Export service class for custom configurations
export { PerformanceMonitoringService };
