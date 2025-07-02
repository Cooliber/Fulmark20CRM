/**
 * HVAC Dashboard Package
 * "Pasja rodzi profesjonalizm" - Komponenty dashboard systemu HVAC
 * 
 * Ten pakiet zawiera wszystkie komponenty dashboard z lazy loading
 * dla optymalnej wydajności bundle.
 */

// Main Dashboard Components
export { HvacDashboard } from './components/HvacDashboard';

// Lazy Components - Only export the essential ones to reduce bundle size
export { 
  LazyMaintenanceDashboard,
  LazyAnalyticsDashboard,
  LazyKanbanBoard,
  LazyCustomer360,
  preloadHeavyComponents
} from './lazy';

// Dashboard-specific utilities
export const HVAC_DASHBOARD_INFO = {
  name: 'hvac-dashboard',
  version: '0.1.0',
  description: 'Komponenty dashboard systemu HVAC',
  estimatedSize: '~800KB',
  lazyComponents: [
    'LazyMaintenanceDashboard',
    'LazyAnalyticsDashboard', 
    'LazyKanbanBoard',
    'LazyCustomer360'
  ],
  bundleOptimization: {
    lazyLoading: true,
    codesplitting: true,
    treeShaking: true
  }
} as const;
