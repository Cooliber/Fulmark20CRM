/**
 * HVAC Dashboard State Management
 * "Pasja rodzi profesjonalizm" - Professional HVAC CRM State
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Types over interfaces
 * - Proper Recoil state management
 * - Performance optimization with selectors
 */

import { selector } from 'recoil';
import { createState } from 'twenty-ui/utilities';

// Types
export type HvacDashboardTab = 'overview' | 'search' | 'tickets' | 'equipment' | 'maintenance' | 'analytics';

export type HvacDashboardStats = {
  totalTickets: number;
  activeTickets: number;
  completedTickets: number;
  pendingTickets: number;
  emergencyTickets: number;
  availableTechnicians: number;
  busyTechnicians: number;
  scheduledMaintenance: number;
  overdueMaintenance: number;
  complianceRate: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  lastUpdated: Date;
};

export type HvacDashboardFilters = {
  dateRange: {
    start: Date;
    end: Date;
  };
  priority: string[];
  status: string[];
  technician: string[];
  serviceType: string[];
};

export type HvacDashboardPreferences = {
  defaultTab: HvacDashboardTab;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showNotifications: boolean;
  compactView: boolean;
  theme: 'light' | 'dark' | 'auto';
};

// Atoms - Primitive state
export const hvacDashboardActiveTabState = createState<HvacDashboardTab>({
  key: 'hvacDashboardActiveTabState',
  defaultValue: 'overview',
});

export const hvacDashboardStatsState = createState<HvacDashboardStats | null>({
  key: 'hvacDashboardStatsState',
  defaultValue: null,
});

export const hvacDashboardLoadingState = createState<boolean>({
  key: 'hvacDashboardLoadingState',
  defaultValue: false,
});

export const hvacDashboardErrorState = createState<string | null>({
  key: 'hvacDashboardErrorState',
  defaultValue: null,
});

export const hvacDashboardFiltersState = createState<HvacDashboardFilters>({
  key: 'hvacDashboardFiltersState',
  defaultValue: {
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date(),
    },
    priority: [],
    status: [],
    technician: [],
    serviceType: [],
  },
});

export const hvacDashboardPreferencesState = createState<HvacDashboardPreferences>({
  key: 'hvacDashboardPreferencesState',
  defaultValue: {
    defaultTab: 'overview',
    autoRefresh: true,
    refreshInterval: 30,
    showNotifications: true,
    compactView: false,
    theme: 'auto',
  },
});

export const hvacDashboardLastRefreshState = createState<Date>({
  key: 'hvacDashboardLastRefreshState',
  defaultValue: new Date(),
});

// Selectors - Derived state
export const hvacDashboardIsHealthySelector = selector({
  key: 'hvacDashboardIsHealthySelector',
  get: ({ get }) => {
    const stats = get(hvacDashboardStatsState);
    const error = get(hvacDashboardErrorState);
    
    if (error || !stats) return false;
    
    // Health criteria
    const hasLowEmergencyTickets = stats.emergencyTickets < 5;
    const hasGoodResponseTime = stats.averageResponseTime < 60; // minutes
    const hasHighSatisfaction = stats.customerSatisfaction > 4.0;
    const hasGoodCompliance = stats.complianceRate > 0.85;
    
    return hasLowEmergencyTickets && hasGoodResponseTime && hasHighSatisfaction && hasGoodCompliance;
  },
});

export const hvacDashboardCriticalAlertsSelector = selector({
  key: 'hvacDashboardCriticalAlertsSelector',
  get: ({ get }) => {
    const stats = get(hvacDashboardStatsState);
    if (!stats) return [];
    
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = [];
    
    // Emergency tickets alert
    if (stats.emergencyTickets > 10) {
      alerts.push({
        type: 'emergency_tickets',
        message: `${stats.emergencyTickets} zgłoszeń awaryjnych wymaga natychmiastowej uwagi`,
        severity: 'critical',
      });
    }
    
    // Overdue maintenance alert
    if (stats.overdueMaintenance > 20) {
      alerts.push({
        type: 'overdue_maintenance',
        message: `${stats.overdueMaintenance} zaległych konserwacji`,
        severity: 'high',
      });
    }
    
    // Low compliance rate alert
    if (stats.complianceRate < 0.7) {
      alerts.push({
        type: 'low_compliance',
        message: `Niski wskaźnik zgodności: ${(stats.complianceRate * 100).toFixed(1)}%`,
        severity: 'high',
      });
    }
    
    // Poor response time alert
    if (stats.averageResponseTime > 120) {
      alerts.push({
        type: 'slow_response',
        message: `Długi czas odpowiedzi: ${stats.averageResponseTime} minut`,
        severity: 'medium',
      });
    }
    
    return alerts;
  },
});

export const hvacDashboardKpiSummarySelector = selector({
  key: 'hvacDashboardKpiSummarySelector',
  get: ({ get }) => {
    const stats = get(hvacDashboardStatsState);
    if (!stats) return null;
    
    const totalTechnicians = stats.availableTechnicians + stats.busyTechnicians;
    const technicianUtilization = totalTechnicians > 0 ? stats.busyTechnicians / totalTechnicians : 0;
    const ticketResolutionRate = stats.totalTickets > 0 ? stats.completedTickets / stats.totalTickets : 0;
    const maintenanceCompletionRate = (stats.scheduledMaintenance + stats.overdueMaintenance) > 0 
      ? stats.scheduledMaintenance / (stats.scheduledMaintenance + stats.overdueMaintenance) 
      : 1;
    
    return {
      technicianUtilization: Math.round(technicianUtilization * 100),
      ticketResolutionRate: Math.round(ticketResolutionRate * 100),
      maintenanceCompletionRate: Math.round(maintenanceCompletionRate * 100),
      customerSatisfactionScore: Math.round(stats.customerSatisfaction * 10) / 10,
      complianceScore: Math.round(stats.complianceRate * 100),
      averageResponseTimeHours: Math.round(stats.averageResponseTime / 60 * 10) / 10,
    };
  },
});

export const hvacDashboardActiveFiltersCountSelector = selector({
  key: 'hvacDashboardActiveFiltersCountSelector',
  get: ({ get }) => {
    const filters = get(hvacDashboardFiltersState);
    
    let count = 0;
    if (filters.priority.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.technician.length > 0) count++;
    if (filters.serviceType.length > 0) count++;
    
    return count;
  },
});

export const hvacDashboardShouldAutoRefreshSelector = selector({
  key: 'hvacDashboardShouldAutoRefreshSelector',
  get: ({ get }) => {
    const preferences = get(hvacDashboardPreferencesState);
    const lastRefresh = get(hvacDashboardLastRefreshState);
    const loading = get(hvacDashboardLoadingState);
    
    if (!preferences.autoRefresh || loading) return false;
    
    const timeSinceLastRefresh = Date.now() - lastRefresh.getTime();
    const refreshIntervalMs = preferences.refreshInterval * 1000;
    
    return timeSinceLastRefresh >= refreshIntervalMs;
  },
});
