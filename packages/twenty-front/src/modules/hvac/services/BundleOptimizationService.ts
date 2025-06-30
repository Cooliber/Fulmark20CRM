/**
 * Bundle Optimization Service
 * "Pasja rodzi profesjonalizm" - Professional Bundle Size Management
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Performance optimization with lazy loading
 * - Proper TypeScript typing
 * - Event handlers over useEffect
 */

import { trackHVACUserAction } from '../index';

// Types
export type ComponentType = 
  | 'CHART' 
  | 'CALENDAR' 
  | 'DATATABLE' 
  | 'KANBAN' 
  | 'ANALYTICS' 
  | 'CUSTOMER360' 
  | 'MAINTENANCE' 
  | 'DISPATCH';

export type LoadingStrategy = 
  | 'IMMEDIATE' 
  | 'ON_DEMAND' 
  | 'PRELOAD' 
  | 'IDLE_PRELOAD' 
  | 'INTERSECTION_OBSERVER';

export type BundleMetrics = {
  componentType: ComponentType;
  loadTime: number;
  bundleSize: number;
  cacheHit: boolean;
  loadingStrategy: LoadingStrategy;
  timestamp: Date;
  userAgent: string;
  networkType?: string;
};

export type OptimizationConfig = {
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  enableIdlePreloading: boolean;
  enableIntersectionObserver: boolean;
  preloadDelay: number; // milliseconds
  idleTimeout: number; // milliseconds
  maxConcurrentLoads: number;
  cacheTimeout: number; // milliseconds
  performanceThreshold: number; // milliseconds
};

// Default configuration
const DEFAULT_CONFIG: OptimizationConfig = {
  enableLazyLoading: true,
  enablePreloading: true,
  enableIdlePreloading: true,
  enableIntersectionObserver: true,
  preloadDelay: 2000, // 2 seconds
  idleTimeout: 5000, // 5 seconds
  maxConcurrentLoads: 3,
  cacheTimeout: 300000, // 5 minutes
  performanceThreshold: 300, // 300ms for debounced search
};

// Bundle size estimates (in bytes)
export const BUNDLE_SIZE_ESTIMATES = {
  CHART: 300 * 1024, // 300KB - Chart.js + dependencies
  CALENDAR: 150 * 1024, // 150KB - Date libraries
  DATATABLE: 200 * 1024, // 200KB - Virtual scrolling
  KANBAN: 200 * 1024, // 200KB - Drag and drop
  ANALYTICS: 500 * 1024, // 500KB - D3.js + Chart.js
  CUSTOMER360: 400 * 1024, // 400KB - Complex visualizations
  MAINTENANCE: 300 * 1024, // 300KB - Calendar + Charts
  DISPATCH: 250 * 1024, // 250KB - Maps + real-time
} as const;

class BundleOptimizationService {
  private config: OptimizationConfig;
  private loadingQueue: Map<ComponentType, Promise<any>>;
  private loadedComponents: Set<ComponentType>;
  private metrics: BundleMetrics[];
  private intersectionObserver: IntersectionObserver | null;
  private idleCallback: number | null;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadingQueue = new Map();
    this.loadedComponents = new Set();
    this.metrics = [];
    this.intersectionObserver = null;
    this.idleCallback = null;

    this.initializeOptimizations();
  }

  /**
   * Initialize optimization strategies
   */
  private initializeOptimizations(): void {
    if (this.config.enableIntersectionObserver && 'IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    }

    if (this.config.enableIdlePreloading && 'requestIdleCallback' in window) {
      this.setupIdlePreloading();
    }

    // Track initial bundle metrics
    this.trackBundleMetrics('ANALYTICS', 0, 0, false, 'IMMEDIATE');
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const componentType = entry.target.getAttribute('data-component-type') as ComponentType;
            if (componentType) {
              this.loadComponent(componentType, 'INTERSECTION_OBSERVER');
            }
          }
        });
      },
      {
        rootMargin: '50px', // Load 50px before component comes into view
        threshold: 0.1,
      }
    );
  }

  /**
   * Setup idle preloading for non-critical components
   */
  private setupIdlePreloading(): void {
    this.idleCallback = window.requestIdleCallback(
      () => {
        this.preloadNonCriticalComponents();
      },
      { timeout: this.config.idleTimeout }
    );
  }

  /**
   * Load a component with specified strategy
   */
  async loadComponent(
    componentType: ComponentType,
    strategy: LoadingStrategy = 'ON_DEMAND'
  ): Promise<any> {
    const startTime = performance.now();

    // Check if already loaded
    if (this.loadedComponents.has(componentType)) {
      this.trackBundleMetrics(componentType, 0, 0, true, strategy);
      return Promise.resolve();
    }

    // Check if already loading
    if (this.loadingQueue.has(componentType)) {
      return this.loadingQueue.get(componentType);
    }

    // Create loading promise
    const loadingPromise = this.createLoadingPromise(componentType, startTime, strategy);
    this.loadingQueue.set(componentType, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadedComponents.add(componentType);
      this.loadingQueue.delete(componentType);
      return result;
    } catch (error) {
      this.loadingQueue.delete(componentType);
      throw error;
    }
  }

  /**
   * Create loading promise for specific component type
   */
  private async createLoadingPromise(
    componentType: ComponentType,
    startTime: number,
    strategy: LoadingStrategy
  ): Promise<any> {
    let importPromise: Promise<any>;

    switch (componentType) {
      case 'CHART':
        importPromise = import('../components/lazy/LazyPrimeReactComponents').then(
          module => module.HvacLazyChart
        );
        break;
      case 'CALENDAR':
        importPromise = import('../components/lazy/LazyPrimeReactComponents').then(
          module => module.HvacLazyCalendar
        );
        break;
      case 'DATATABLE':
        importPromise = import('../components/lazy/LazyPrimeReactComponents').then(
          module => module.HvacLazyDataTable
        );
        break;
      case 'KANBAN':
        importPromise = import('../components/lazy/LazyKanbanBoard');
        break;
      case 'ANALYTICS':
        importPromise = import('../components/lazy/LazyAnalyticsDashboard');
        break;
      case 'CUSTOMER360':
        importPromise = import('../components/lazy/LazyCustomer360');
        break;
      case 'MAINTENANCE':
        importPromise = import('../components/lazy/LazyMaintenanceDashboard');
        break;
      case 'DISPATCH':
        importPromise = import('../components/scheduling/HvacDispatchPanel');
        break;
      default:
        throw new Error(`Unknown component type: ${componentType}`);
    }

    const result = await importPromise;
    const loadTime = performance.now() - startTime;
    const bundleSize = BUNDLE_SIZE_ESTIMATES[componentType];

    this.trackBundleMetrics(componentType, loadTime, bundleSize, false, strategy);

    return result;
  }

  /**
   * Preload critical components
   */
  async preloadCriticalComponents(): Promise<void> {
    const criticalComponents: ComponentType[] = ['DATATABLE', 'CALENDAR', 'CHART'];
    
    const loadPromises = criticalComponents.map(componentType =>
      this.loadComponent(componentType, 'PRELOAD')
    );

    try {
      await Promise.all(loadPromises);
      trackHVACUserAction('critical_components_preloaded', 'PERFORMANCE', {
        components: criticalComponents,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to preload some critical components:', error);
    }
  }

  /**
   * Preload non-critical components during idle time
   */
  async preloadNonCriticalComponents(): Promise<void> {
    const nonCriticalComponents: ComponentType[] = ['ANALYTICS', 'CUSTOMER360', 'MAINTENANCE'];
    
    // Respect max concurrent loads
    const chunks = this.chunkArray(nonCriticalComponents, this.config.maxConcurrentLoads);
    
    for (const chunk of chunks) {
      const loadPromises = chunk.map(componentType =>
        this.loadComponent(componentType, 'IDLE_PRELOAD')
      );
      
      try {
        await Promise.all(loadPromises);
      } catch (error) {
        console.warn('Failed to preload some non-critical components:', error);
      }
    }
  }

  /**
   * Track bundle metrics for performance monitoring
   */
  private trackBundleMetrics(
    componentType: ComponentType,
    loadTime: number,
    bundleSize: number,
    cacheHit: boolean,
    strategy: LoadingStrategy
  ): void {
    const metrics: BundleMetrics = {
      componentType,
      loadTime,
      bundleSize,
      cacheHit,
      loadingStrategy: strategy,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      networkType: (navigator as any).connection?.effectiveType || 'unknown',
    };

    this.metrics.push(metrics);

    // Track performance issues
    if (loadTime > this.config.performanceThreshold) {
      trackHVACUserAction('slow_component_load', 'PERFORMANCE', {
        componentType,
        loadTime,
        strategy,
        threshold: this.config.performanceThreshold,
      });
    }

    // Track bundle size optimization opportunities
    if (bundleSize > 500000) { // 500KB threshold
      trackHVACUserAction('large_bundle_detected', 'PERFORMANCE', {
        componentType,
        bundleSize,
        loadTime,
        strategy,
      });
    }
  }

  /**
   * Advanced bundle analysis and optimization recommendations
   */
  analyzeBundleOptimization(): {
    currentBundleSize: number;
    optimizationOpportunities: Array<{
      type: 'code-splitting' | 'lazy-loading' | 'tree-shaking' | 'compression';
      description: string;
      estimatedSavings: number;
      priority: 'high' | 'medium' | 'low';
    }>;
    totalPotentialSavings: number;
    implementationSteps: string[];
  } {
    const currentSize = this.estimateCurrentBundleSize();
    const opportunities = [];
    let totalSavings = 0;

    // Code splitting opportunities
    const codeSplittingSavings = currentSize * 0.3;
    opportunities.push({
      type: 'code-splitting' as const,
      description: 'Split large components into separate chunks',
      estimatedSavings: codeSplittingSavings,
      priority: 'high' as const,
    });
    totalSavings += codeSplittingSavings;

    // Lazy loading opportunities
    const lazyLoadingSavings = currentSize * 0.25;
    opportunities.push({
      type: 'lazy-loading' as const,
      description: 'Implement lazy loading for non-critical components',
      estimatedSavings: lazyLoadingSavings,
      priority: 'high' as const,
    });
    totalSavings += lazyLoadingSavings;

    // Tree shaking opportunities
    const treeShakingSavings = currentSize * 0.15;
    opportunities.push({
      type: 'tree-shaking' as const,
      description: 'Remove unused code and dependencies',
      estimatedSavings: treeShakingSavings,
      priority: 'medium' as const,
    });
    totalSavings += treeShakingSavings;

    // Compression opportunities
    const compressionSavings = currentSize * 0.2;
    opportunities.push({
      type: 'compression' as const,
      description: 'Enable gzip/brotli compression',
      estimatedSavings: compressionSavings,
      priority: 'medium' as const,
    });
    totalSavings += compressionSavings;

    const implementationSteps = [
      '1. Implement React.lazy() for heavy components',
      '2. Use dynamic imports for route-based code splitting',
      '3. Configure webpack bundle analyzer',
      '4. Enable tree shaking in build configuration',
      '5. Implement compression middleware',
      '6. Monitor bundle size in CI/CD pipeline',
    ];

    return {
      currentBundleSize: currentSize,
      optimizationOpportunities: opportunities,
      totalPotentialSavings: totalSavings,
      implementationSteps,
    };
  }

  /**
   * Estimate current bundle size based on loaded components
   */
  private estimateCurrentBundleSize(): number {
    // This would typically be provided by webpack-bundle-analyzer
    // For now, we'll estimate based on component metrics
    let estimatedSize = 0;

    this.metrics.forEach(metric => {
      estimatedSize += metric.bundleSize;
    });

    // Add base framework size estimate
    estimatedSize += 2000000; // ~2MB for React + Twenty CRM base

    return estimatedSize;
  }

  /**
   * Get performance recommendations based on current metrics
   */
  getPerformanceRecommendations(): {
    bundleOptimization: string[];
    loadingOptimization: string[];
    cacheOptimization: string[];
    networkOptimization: string[];
  } {
    const bundleAnalysis = this.analyzeBundleOptimization();
    const avgLoadTime = this.calculateAverageLoadTime();
    const cacheHitRate = this.calculateCacheHitRate();

    const recommendations = {
      bundleOptimization: [],
      loadingOptimization: [],
      cacheOptimization: [],
      networkOptimization: [],
    };

    // Bundle optimization recommendations
    if (bundleAnalysis.currentBundleSize > 4700000) { // 4.7MB Twenty CRM limit
      recommendations.bundleOptimization.push(
        'Bundle size exceeds Twenty CRM limit - implement immediate code splitting'
      );
    }

    bundleAnalysis.optimizationOpportunities
      .filter(opp => opp.priority === 'high')
      .forEach(opp => {
        recommendations.bundleOptimization.push(opp.description);
      });

    // Loading optimization recommendations
    if (avgLoadTime > this.config.performanceThreshold) {
      recommendations.loadingOptimization.push(
        'Average load time exceeds threshold - implement preloading'
      );
      recommendations.loadingOptimization.push(
        'Consider using React.Suspense with fallback components'
      );
    }

    // Cache optimization recommendations
    if (cacheHitRate < 0.7) {
      recommendations.cacheOptimization.push(
        'Low cache hit rate - review caching strategy'
      );
      recommendations.cacheOptimization.push(
        'Implement service worker for better caching'
      );
    }

    // Network optimization recommendations
    const slowNetworkMetrics = this.metrics.filter(
      m => m.networkType === 'slow-2g' || m.networkType === '2g'
    );

    if (slowNetworkMetrics.length > 0) {
      recommendations.networkOptimization.push(
        'Optimize for slow networks - implement progressive loading'
      );
      recommendations.networkOptimization.push(
        'Consider offline-first approach with service workers'
      );
    }

    return recommendations;
  }

  /**
   * Calculate average load time across all components
   */
  private calculateAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;

    const totalTime = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return totalTime / this.metrics.length;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;

    const cacheHits = this.metrics.filter(metric => metric.cacheHit).length;
    return cacheHits / this.metrics.length;
  }

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageLoadTime: number;
    totalBundleSize: number;
    cacheHitRate: number;
    componentStats: Record<ComponentType, { count: number; avgLoadTime: number }>;
  } {
    if (this.metrics.length === 0) {
      return {
        averageLoadTime: 0,
        totalBundleSize: 0,
        cacheHitRate: 0,
        componentStats: {} as any,
      };
    }

    const totalLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0);
    const totalBundleSize = this.metrics.reduce((sum, m) => sum + m.bundleSize, 0);
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;

    const componentStats: Record<string, { count: number; avgLoadTime: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!componentStats[metric.componentType]) {
        componentStats[metric.componentType] = { count: 0, avgLoadTime: 0 };
      }
      componentStats[metric.componentType].count++;
      componentStats[metric.componentType].avgLoadTime += metric.loadTime;
    });

    // Calculate averages
    Object.keys(componentStats).forEach(key => {
      componentStats[key].avgLoadTime /= componentStats[key].count;
    });

    return {
      averageLoadTime: totalLoadTime / this.metrics.length,
      totalBundleSize,
      cacheHitRate: cacheHits / this.metrics.length,
      componentStats: componentStats as any,
    };
  }

  /**
   * Utility function to chunk array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.idleCallback) {
      window.cancelIdleCallback(this.idleCallback);
    }
    
    this.loadingQueue.clear();
    this.loadedComponents.clear();
    this.metrics = [];
  }
}

// Singleton instance
export const bundleOptimizationService = new BundleOptimizationService();

// Export service class for custom configurations
export { BundleOptimizationService };
