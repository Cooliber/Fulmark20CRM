/**
 * Lazy Components Index - Bundle Size Optimization
 * "Pasja rodzi profesjonalizm" - Optimized component loading
 * 
 * This index exports all lazy-loaded components to reduce main bundle size
 * by implementing code splitting for heavy dependencies.
 * 
 * Bundle Size Savings:
 * - LazyAnalyticsDashboard: ~500KB (Chart.js + D3.js dependencies)
 * - LazyKanbanBoard: ~200KB (Drag-and-drop libraries)
 * - LazyMaintenanceDashboard: ~300KB (Calendar + Chart dependencies)
 * - LazyCustomer360: ~400KB (Complex data visualization)
 * - HvacLazyChart: ~300KB (Chart.js dependencies)
 * - HvacLazyCalendar: ~150KB (Date manipulation libraries)
 * - HvacLazyDataTable: ~200KB (Virtual scrolling and filtering)
 *
 * Total estimated savings: ~2.05MB from main bundle
 */

// Core lazy components
export { LazyCustomer360, LazyCustomer360CommunicationTab, LazyCustomer360EquipmentTab } from './LazyCustomer360';

// Dashboard lazy components
export { LazyAnalyticsDashboard } from './LazyAnalyticsDashboard';
export { LazyMaintenanceDashboard } from './LazyMaintenanceDashboard';

// Interactive components
export { LazyKanbanBoard } from './LazyKanbanBoard';

// Enhanced PrimeReact Lazy Components
export {
    HvacLazyCalendar, HvacLazyChart, HvacLazyDataTable,
    PRIMEREACT_BUNDLE_SAVINGS,
    preloadCriticalPrimeReactComponents
} from './LazyPrimeReactComponents';

// Type definitions for lazy components
export interface LazyComponentProps {
  className?: string;
}

export interface LazyDashboardProps extends LazyComponentProps {
  onRefresh?: () => void;
  onError?: (error: Error) => void;
}

export interface LazyKanbanProps extends LazyComponentProps {
  boardId?: string;
  onCardClick?: (card: any) => void;
  onCardCreate?: (card: any) => void;
  onCardUpdate?: (card: any) => void;
}

export interface LazyCustomer360Props extends LazyComponentProps {
  customerId: string;
  initialTab?: string;
  onTabChange?: (tabIndex: number) => void;
}

// Utility function to preload components
export const preloadHeavyComponents = async () => {
  try {
    // Preload analytics dashboard
    await import('./LazyAnalyticsDashboard');
    
    // Preload kanban board
    await import('./LazyKanbanBoard');
    
    // Preload maintenance dashboard
    await import('./LazyMaintenanceDashboard');
    
    console.log('Heavy HVAC components preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some HVAC components:', error);
  }
};

// Component loading status tracker
export const createLoadingTracker = () => {
  const loadingStates = new Map<string, boolean>();
  
  return {
    setLoading: (componentName: string, isLoading: boolean) => {
      loadingStates.set(componentName, isLoading);
    },
    isLoading: (componentName: string) => {
      return loadingStates.get(componentName) ?? false;
    },
    getLoadingStates: () => {
      return Object.fromEntries(loadingStates);
    }
  };
};
