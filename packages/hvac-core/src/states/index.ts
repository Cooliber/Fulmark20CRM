/**
 * HVAC State Management Index
 * "Pasja rodzi profesjonalizm" - Simplified state management for hvac-core
 *
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Minimal dependencies
 * - Core functionality only
 */

import { atom } from 'recoil';

// Basic types for core states
export type HvacDashboardTab = 'overview' | 'tickets' | 'maintenance' | 'analytics';

export type HvacDashboardStats = {
  totalTickets: number;
  completedTickets: number;
  pendingTickets: number;
  emergencyTickets: number;
  overdueMaintenance: number;
  scheduledMaintenance: number;
  availableTechnicians: number;
  busyTechnicians: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  complianceRate: number;
  revenueThisMonth: number;
  costsThisMonth: number;
  profitMargin: number;
};

// ===== DASHBOARD STATES =====

/**
 * Dashboard loading state
 */
export const hvacDashboardLoadingState = atom<boolean>({
  key: 'hvacDashboardLoadingState',
  default: false,
});

/**
 * Dashboard error state
 */
export const hvacDashboardErrorState = atom<string | null>({
  key: 'hvacDashboardErrorState',
  default: null,
});

/**
 * Dashboard active tab
 */
export const hvacDashboardActiveTabState = atom<HvacDashboardTab>({
  key: 'hvacDashboardActiveTabState',
  default: 'overview',
});

// ===== SEARCH STATES =====

/**
 * Search query
 */
export const hvacSemanticSearchQueryState = atom<string>({
  key: 'hvacSemanticSearchQueryState',
  default: '',
});

/**
 * Search loading state
 */
export const hvacSemanticSearchLoadingState = atom<boolean>({
  key: 'hvacSemanticSearchLoadingState',
  default: false,
});

/**
 * Search error state
 */
export const hvacSemanticSearchErrorState = atom<string | null>({
  key: 'hvacSemanticSearchErrorState',
  default: null,
});

// ===== PERFORMANCE CONSTANTS =====

export const HVAC_STATE_PERFORMANCE = {
  DEBOUNCE_DELAYS: {
    SEARCH_QUERY: 300, // 300ms for search input
    FILTER_CHANGE: 150, // 150ms for filter changes
  },
  CACHE_DURATIONS: {
    DASHBOARD_STATS: 30000, // 30s
    SEARCH_RESULTS: 300000, // 5min
  },
} as const;

// ===== DEFAULT STATES =====

/**
 * Default dashboard state
 */
export const hvacDefaultDashboardState = {
  stats: {
    totalTickets: 0,
    completedTickets: 0,
    pendingTickets: 0,
    emergencyTickets: 0,
    overdueMaintenance: 0,
    scheduledMaintenance: 0,
    availableTechnicians: 0,
    busyTechnicians: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
    complianceRate: 0,
    revenueThisMonth: 0,
    costsThisMonth: 0,
    profitMargin: 0,
  },
  activeTab: 'overview' as HvacDashboardTab,
  loading: false,
  error: null,
};
