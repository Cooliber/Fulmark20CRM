/**
 * HVAC States
 * "Pasja rodzi profesjonalizm" - Professional state management for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Recoil state management
 * - TypeScript without 'any' types
 */

import { atom } from 'recoil';

// Dashboard loading state
export const hvacDashboardLoadingState = atom<boolean>({
  key: 'hvacDashboardLoadingState',
  default: false,
});

// Dashboard error state
export const hvacDashboardErrorState = atom<string | null>({
  key: 'hvacDashboardErrorState',
  default: null,
});

// Customer selection state
export const hvacSelectedCustomerState = atom<string | null>({
  key: 'hvacSelectedCustomerState',
  default: null,
});

// Search query state
export const hvacSearchQueryState = atom<string>({
  key: 'hvacSearchQueryState',
  default: '',
});

// Filter state
export const hvacFiltersState = atom<Record<string, unknown>>({
  key: 'hvacFiltersState',
  default: {},
});

// Performance monitoring state
export const hvacPerformanceState = atom<{
  isMonitoring: boolean;
  metrics: Record<string, number>;
}>({
  key: 'hvacPerformanceState',
  default: {
    isMonitoring: false,
    metrics: {},
  },
});
