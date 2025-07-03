/**
 * HVAC Bundle Optimizer - SOTA Implementation
 * "Pasja rodzi profesjonalizm" - Zaawansowana optymalizacja bundle size
 * 
 * Ten system zapewnia:
 * - Intelligent code splitting
 * - Dynamic imports z preloading strategies
 * - Bundle size monitoring
 * - Performance optimization
 * - Memory management
 */

// Bundle Optimization Configuration
export interface HvacBundleConfig {
  targetSize: number; // Target bundle size in MB
  chunkSizeLimit: number; // Individual chunk size limit in KB
  preloadCritical: boolean; // Whether to preload critical components
  enableLazyLoading: boolean; // Enable lazy loading for non-critical components
  compressionLevel: 'basic' | 'advanced' | 'maximum';
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
}

// Default SOTA Configuration
export const HVAC_BUNDLE_CONFIG: HvacBundleConfig = {
  targetSize: 4.7, // MB - zgodnie z wymaganiami
  chunkSizeLimit: 500, // KB
  preloadCritical: true,
  enableLazyLoading: true,
  compressionLevel: 'advanced',
  cacheStrategy: 'aggressive',
};

// Bundle Metrics Interface
export interface BundleMetrics {
  totalSize: number;
  chunkCount: number;
  largestChunk: number;
  compressionRatio: number;
  loadTime: number;
  cacheHitRate: number;
}

// Component Priority Levels
export enum ComponentPriority {
  CRITICAL = 'critical',     // Load immediately
  HIGH = 'high',            // Preload on idle
  MEDIUM = 'medium',        // Load on demand
  LOW = 'low',              // Lazy load
  DEFERRED = 'deferred'     // Load only when needed
}

// HVAC Component Registry
interface HvacComponentInfo {
  name: string;
  priority: ComponentPriority;
  estimatedSize: number; // KB
  dependencies: string[];
  loadCondition?: () => boolean;
  preloadTrigger?: 'hover' | 'viewport' | 'idle' | 'interaction';
}

// HVAC Components Registry - SOTA Classification
const HVAC_COMPONENTS_REGISTRY: Record<string, HvacComponentInfo> = {
  // Critical Components - Load immediately
  'HvacDashboard': {
    name: 'HvacDashboard',
    priority: ComponentPriority.CRITICAL,
    estimatedSize: 50,
    dependencies: ['HvacIconBridge', 'HvacDashboardHeader'],
  },
  'HvacDashboardHeader': {
    name: 'HvacDashboardHeader',
    priority: ComponentPriority.CRITICAL,
    estimatedSize: 30,
    dependencies: ['HvacIconBridge'],
  },
  'HvacIconBridge': {
    name: 'HvacIconBridge',
    priority: ComponentPriority.CRITICAL,
    estimatedSize: 25,
    dependencies: ['@tabler/icons-react'],
  },

  // High Priority - Preload on idle
  'HvacDashboardOverview': {
    name: 'HvacDashboardOverview',
    priority: ComponentPriority.HIGH,
    estimatedSize: 80,
    dependencies: ['HvacSemanticSearch', 'HvacServiceTicketList'],
    preloadTrigger: 'idle',
  },
  'HvacSemanticSearch': {
    name: 'HvacSemanticSearch',
    priority: ComponentPriority.HIGH,
    estimatedSize: 120,
    dependencies: ['Weaviate', 'SearchEngine'],
    preloadTrigger: 'hover',
  },

  // Medium Priority - Load on demand
  'HvacAnalyticsDashboard': {
    name: 'HvacAnalyticsDashboard',
    priority: ComponentPriority.MEDIUM,
    estimatedSize: 200,
    dependencies: ['Chart.js', 'D3.js'],
    loadCondition: () => window.location.hash.includes('analytics'),
  },
  'HvacMaintenanceDashboard': {
    name: 'HvacMaintenanceDashboard',
    priority: ComponentPriority.MEDIUM,
    estimatedSize: 150,
    dependencies: ['Calendar', 'Scheduler'],
    loadCondition: () => window.location.hash.includes('maintenance'),
  },

  // Low Priority - Lazy load
  'HvacKanbanBoard': {
    name: 'HvacKanbanBoard',
    priority: ComponentPriority.LOW,
    estimatedSize: 180,
    dependencies: ['DragDrop', 'Kanban'],
    preloadTrigger: 'viewport',
  },
  'HvacReportGenerator': {
    name: 'HvacReportGenerator',
    priority: ComponentPriority.LOW,
    estimatedSize: 250,
    dependencies: ['PDF', 'Excel', 'Charts'],
  },

  // Deferred - Load only when needed
  'HvacAdvancedAnalytics': {
    name: 'HvacAdvancedAnalytics',
    priority: ComponentPriority.DEFERRED,
    estimatedSize: 300,
    dependencies: ['ML', 'AI', 'BigData'],
  },
  'HvacCustomReports': {
    name: 'HvacCustomReports',
    priority: ComponentPriority.DEFERRED,
    estimatedSize: 200,
    dependencies: ['ReportBuilder', 'Templates'],
  },
};

/**
 * HVAC Bundle Optimizer Class - Main Optimization Engine
 */
export class HvacBundleOptimizer {
  private config: HvacBundleConfig;
  private metrics: BundleMetrics;
  private loadedComponents: Set<string> = new Set();
  private preloadQueue: Map<string, Promise<any>> = new Map();

  constructor(config: Partial<HvacBundleConfig> = {}) {
    this.config = { ...HVAC_BUNDLE_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    this.setupOptimizations();
  }

  private initializeMetrics(): BundleMetrics {
    return {
      totalSize: 0,
      chunkCount: 0,
      largestChunk: 0,
      compressionRatio: 0,
      loadTime: 0,
      cacheHitRate: 0,
    };
  }

  private setupOptimizations(): void {
    // Setup intersection observer for viewport-based loading
    this.setupViewportLoading();
    
    // Setup idle callback for preloading
    this.setupIdlePreloading();
    
    // Setup hover preloading
    this.setupHoverPreloading();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Load component with intelligent optimization
   */
  async loadComponent(componentName: string): Promise<any> {
    const componentInfo = HVAC_COMPONENTS_REGISTRY[componentName];
    
    if (!componentInfo) {
      console.warn(`HVAC Component "${componentName}" not found in registry`);
      return null;
    }

    // Check if already loaded
    if (this.loadedComponents.has(componentName)) {
      return this.getCachedComponent(componentName);
    }

    // Check if already in preload queue
    if (this.preloadQueue.has(componentName)) {
      return this.preloadQueue.get(componentName);
    }

    // Load component based on priority
    const loadPromise = this.loadComponentByPriority(componentInfo);
    this.preloadQueue.set(componentName, loadPromise);

    try {
      const component = await loadPromise;
      this.loadedComponents.add(componentName);
      this.updateMetrics(componentInfo);
      return component;
    } catch (error) {
      console.error(`Failed to load HVAC component "${componentName}":`, error);
      this.preloadQueue.delete(componentName);
      throw error;
    }
  }

  private async loadComponentByPriority(componentInfo: HvacComponentInfo): Promise<any> {
    const startTime = performance.now();

    let component;
    switch (componentInfo.name) {
      case 'HvacAnalyticsDashboard':
        component = await import('../lazy/LazyAnalyticsDashboard');
        break;
      case 'HvacMaintenanceDashboard':
        component = await import('../lazy/LazyMaintenanceDashboard');
        break;
      case 'HvacKanbanBoard':
        component = await import('../lazy/LazyKanbanBoard');
        break;
      case 'HvacSemanticSearch':
        // Placeholder for future semantic search component
        component = { default: () => null };
        break;
      default:
        // Dynamic import based on component name
        component = await this.dynamicImport(componentInfo.name);
    }

    const loadTime = performance.now() - startTime;
    console.log(`HVAC Component "${componentInfo.name}" loaded in ${loadTime.toFixed(2)}ms`);

    return component;
  }

  private async dynamicImport(componentName: string): Promise<any> {
    // Intelligent dynamic import with error handling
    // Fixed: Added .tsx extension for Vite compatibility
    try {
      return await import(`../components/${componentName}.tsx`);
    } catch (error) {
      try {
        return await import(`../lazy/${componentName}.tsx`);
      } catch (secondError) {
        console.error(`Failed to dynamically import "${componentName}":`, secondError);
        throw secondError;
      }
    }
  }

  private setupViewportLoading(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const componentName = entry.target.getAttribute('data-hvac-component');
          if (componentName) {
            this.preloadComponent(componentName);
          }
        }
      });
    }, { threshold: 0.1 });

    // Observe elements with data-hvac-component attribute
    document.querySelectorAll('[data-hvac-component]').forEach((el) => {
      observer.observe(el);
    });
  }

  private setupIdlePreloading(): void {
    if (typeof requestIdleCallback === 'undefined') return;

    requestIdleCallback(() => {
      // Preload high priority components during idle time
      Object.entries(HVAC_COMPONENTS_REGISTRY).forEach(([name, info]) => {
        if (info.priority === ComponentPriority.HIGH && info.preloadTrigger === 'idle') {
          this.preloadComponent(name);
        }
      });
    });
  }

  private setupHoverPreloading(): void {
    // Setup hover-based preloading for interactive elements
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const componentName = target.getAttribute('data-hvac-preload');
      
      if (componentName && !this.loadedComponents.has(componentName)) {
        this.preloadComponent(componentName);
      }
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor bundle performance
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('hvac')) {
            this.updateLoadTimeMetrics(entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource'] });
    }
  }

  private async preloadComponent(componentName: string): Promise<void> {
    if (this.loadedComponents.has(componentName) || this.preloadQueue.has(componentName)) {
      return;
    }

    try {
      await this.loadComponent(componentName);
    } catch (error) {
      console.warn(`Failed to preload HVAC component "${componentName}":`, error);
    }
  }

  private getCachedComponent(componentName: string): any {
    // Return cached component (implementation depends on caching strategy)
    return null; // Placeholder
  }

  private updateMetrics(componentInfo: HvacComponentInfo): void {
    this.metrics.totalSize += componentInfo.estimatedSize;
    this.metrics.chunkCount += 1;
    this.metrics.largestChunk = Math.max(this.metrics.largestChunk, componentInfo.estimatedSize);
  }

  private updateLoadTimeMetrics(duration: number): void {
    this.metrics.loadTime = (this.metrics.loadTime + duration) / 2; // Moving average
  }

  /**
   * Get current bundle metrics
   */
  getMetrics(): BundleMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if bundle size is within target
   */
  isWithinTarget(): boolean {
    return (this.metrics.totalSize / 1024) <= this.config.targetSize; // Convert KB to MB
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.isWithinTarget()) {
      recommendations.push('Bundle size exceeds target. Consider lazy loading more components.');
    }
    
    if (this.metrics.largestChunk > this.config.chunkSizeLimit) {
      recommendations.push('Large chunks detected. Consider code splitting.');
    }
    
    if (this.metrics.cacheHitRate < 0.8) {
      recommendations.push('Low cache hit rate. Optimize caching strategy.');
    }
    
    return recommendations;
  }
}

// Global HVAC Bundle Optimizer Instance
export const hvacBundleOptimizer = new HvacBundleOptimizer();

// Export types and utilities
export { HVAC_COMPONENTS_REGISTRY };
export type { HvacComponentInfo };

