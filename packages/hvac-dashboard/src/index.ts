/**
 * HVAC Dashboard Package - SOTA Implementation
 * "Pasja rodzi profesjonalizm" - Komponenty dashboard systemu HVAC
 *
 * Ten pakiet zawiera wszystkie komponenty dashboard z zaawansowanym
 * systemem optymalizacji bundle i lazy loading.
 *
 * SOTA Features:
 * - Intelligent Bundle Optimization
 * - Advanced Lazy Loading with Preloading
 * - Performance Monitoring
 * - Error Boundaries with Retry Logic
 * - Progressive Component Loading
 */

// Core Components - Critical Priority (Always loaded)
export { HvacDashboard } from './components/HvacDashboard';
export { HvacDashboardContent } from './components/HvacDashboardContent';
export { HvacDashboardHeader } from './components/HvacDashboardHeader';
export { HvacDashboardOverview } from './components/HvacDashboardOverview';

// SOTA Icon System
export * from './components/icons/HvacIconBridge';

// SOTA Bundle Optimization System
export {
    ComponentPriority, HVAC_BUNDLE_CONFIG, HVAC_COMPONENTS_REGISTRY, HvacBundleOptimizer,
    hvacBundleOptimizer
} from './optimization/HvacBundleOptimizer';

// SOTA Lazy Loading System
export {
    HvacErrorBoundary, HvacLazyWrapper, HvacLoadingSkeleton, LazyHvacAnalyticsDashboard, LazyHvacKanbanBoard, LazyHvacMaintenanceDashboard, createHvacLazyComponent, useHvacProgressiveLoader,
    useHvacViewportLoader
} from './optimization/HvacLazyLoader';

// SOTA Performance Engine
export {
    HvacPerformanceEngine,
    hvacPerformanceEngine,
    useHvacPerformance,
    HVAC_PERFORMANCE_CONFIG
} from './performance/HvacPerformanceEngine';

// Legacy Lazy Components - Maintained for compatibility
export { preloadHeavyComponents } from './lazy';
export { LazyAnalyticsDashboard } from './lazy/LazyAnalyticsDashboard';
export { LazyCustomer360 } from './lazy/LazyCustomer360';
export { LazyKanbanBoard } from './lazy/LazyKanbanBoard';
export { LazyMaintenanceDashboard } from './lazy/LazyMaintenanceDashboard';
export { PRIMEREACT_BUNDLE_SAVINGS, preloadCriticalPrimeReactComponents } from './lazy/LazyPrimeReactComponents';

// SOTA Dashboard Configuration
export const HVAC_DASHBOARD_INFO = {
  name: 'hvac-dashboard',
  version: '2.0.0-SOTA',
  description: 'State-of-the-Art HVAC Dashboard Components for TwentyCRM',
  estimatedSize: '~800KB (optimized)',
  targetBundleSize: '4.7MB',
  optimizationLevel: 'MAXIMUM',
  lazyComponents: [
    'LazyMaintenanceDashboard',
    'LazyAnalyticsDashboard',
    'LazyKanbanBoard',
    'LazyCustomer360',
    'LazyHvacAnalyticsDashboard',
    'LazyHvacMaintenanceDashboard',
    'LazyHvacKanbanBoard'
  ],
  bundleOptimization: {
    lazyLoading: true,
    codesplitting: true,
    treeShaking: true,
    intelligentPreloading: true,
    performanceMonitoring: true,
    errorBoundaries: true,
    progressiveLoading: true,
    bundleAnalysis: true
  },
  performanceTargets: {
    searchResponseTime: 300, // ms
    componentLoadTime: 1000, // ms
    bundleSize: 4.7, // MB
    cacheHitRate: 0.9, // 90%
    errorRate: 0.01, // 1%
  },
  features: [
    'Intelligent Bundle Optimization',
    'Advanced Lazy Loading',
    'Performance Monitoring',
    'Error Boundaries with Retry Logic',
    'Progressive Component Loading',
    'SOTA Icon System',
    'Polish Market Compliance',
    'TwentyCRM Integration'
  ]
} as const;

// Types Export
export type { TabType } from './components/HvacDashboardHeader';

// Performance Constants
export const HVAC_PERFORMANCE_TARGETS = HVAC_DASHBOARD_INFO.performanceTargets;
export const HVAC_BUNDLE_TARGET_SIZE = 4.7; // MB
export const HVAC_OPTIMIZATION_LEVEL = 'MAXIMUM' as const;
