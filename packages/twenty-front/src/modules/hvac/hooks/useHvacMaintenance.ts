/**
 * HVAC Maintenance Hook
 * "Pasja rodzi profesjonalizm" - Professional HVAC Maintenance Management
 * 
 * Provides comprehensive maintenance functionality:
 * - Preventive maintenance scheduling
 * - Equipment-specific checklists
 * - Compliance tracking
 * - Performance analytics
 * - Cost optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client';

// Types
interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  customerId: string;
  customerName: string;
  maintenanceType: 'PREVENTIVE' | 'INSPECTION' | 'CLEANING' | 'CALIBRATION' | 'PARTS_REPLACEMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SCHEDULED' | 'OVERDUE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: Date;
  estimatedDuration: number;
  lastPerformed?: Date;
  nextDueDate: Date;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'SEASONAL';
  complianceRequirements: string[];
  checklist: MaintenanceChecklistItem[];
  assignedTechnician?: string;
  notes?: string;
  cost?: number;
}

interface MaintenanceChecklistItem {
  id: string;
  description: string;
  category: 'SAFETY' | 'PERFORMANCE' | 'COMPLIANCE' | 'VISUAL' | 'MEASUREMENT';
  required: boolean;
  completed?: boolean;
  value?: string;
  notes?: string;
}

interface MaintenancePlan {
  planId: string;
  customerId: string;
  equipmentCount: number;
  scheduledMaintenance: MaintenanceSchedule[];
  totalAnnualCost: number;
  complianceStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  nextMaintenanceDate: Date;
  seasonalRecommendations: SeasonalRecommendation[];
}

interface SeasonalRecommendation {
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
  equipmentTypes: string[];
  tasks: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedCost: number;
  deadline: Date;
}

interface MaintenanceStats {
  totalEquipment: number;
  scheduledMaintenance: number;
  overdueMaintenance: number;
  completedThisMonth: number;
  complianceRate: number;
  costSavings: number;
  efficiency: number;
  nextMaintenanceDate: Date | null;
}

interface MaintenanceAnalytics {
  equipmentId: string;
  performanceMetrics: {
    efficiency: number;
    energyConsumption: number;
    operatingHours: number;
    failureRate: number;
    maintenanceCost: number;
  };
  trends: {
    efficiencyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    costTrend: 'DECREASING' | 'STABLE' | 'INCREASING';
    reliabilityTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
  recommendations: string[];
  nextOptimalMaintenanceDate: Date;
}

export const useHvacMaintenance = () => {
  // State
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [overdueItems, setOverdueItems] = useState<MaintenanceSchedule[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<MaintenanceSchedule[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Apollo client for GraphQL operations
  const apolloClient = useApolloClient();

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for real-time maintenance updates
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/maintenance';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Maintenance WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeMaintenanceUpdate(data);
        } catch (error) {
          console.error('Failed to parse maintenance WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Maintenance WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Maintenance WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle real-time maintenance updates
  const handleRealtimeMaintenanceUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'MAINTENANCE_SCHEDULED':
        setMaintenanceSchedules(prev => [...prev, data.maintenance]);
        break;
      case 'MAINTENANCE_UPDATED':
        setMaintenanceSchedules(prev => 
          prev.map(maintenance => 
            maintenance.id === data.maintenance.id 
              ? { ...maintenance, ...data.maintenance }
              : maintenance
          )
        );
        break;
      case 'MAINTENANCE_COMPLETED':
        setMaintenanceSchedules(prev => 
          prev.map(maintenance => 
            maintenance.id === data.maintenanceId 
              ? { ...maintenance, status: 'COMPLETED', completionTime: new Date() }
              : maintenance
          )
        );
        break;
      case 'MAINTENANCE_OVERDUE':
        setOverdueItems(prev => [...prev, data.maintenance]);
        break;
      default:
        console.log('Unknown maintenance update type:', data.type);
    }
    setLastUpdate(new Date());
  }, []);

  // Load maintenance schedules
  const loadMaintenanceSchedules = useCallback(async (filters?: {
    customerId?: string;
    equipmentType?: string;
    status?: string;
    dateRange?: [Date, Date];
  }) => {
    try {
      setLoading(true);
      setError(null);

      // This would be replaced with actual API call
      const mockSchedules: MaintenanceSchedule[] = [
        {
          id: 'maint-1',
          equipmentId: 'eq-1',
          equipmentName: 'Klimatyzacja biurowa',
          equipmentType: 'AIR_CONDITIONING',
          customerId: 'customer-1',
          customerName: 'Firma ABC Sp. z o.o.',
          maintenanceType: 'PREVENTIVE',
          priority: 'MEDIUM',
          status: 'SCHEDULED',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          estimatedDuration: 120,
          nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          frequency: 'QUARTERLY',
          complianceRequirements: ['EPA-608', 'LOCAL-BUILDING-CODE'],
          checklist: [
            {
              id: 'check-1',
              description: 'Sprawdź filtry powietrza',
              category: 'PERFORMANCE',
              required: true,
            },
            {
              id: 'check-2',
              description: 'Sprawdź poziom czynnika chłodniczego',
              category: 'COMPLIANCE',
              required: true,
            },
          ],
          cost: 350,
        },
        // Add more mock schedules as needed
      ];

      // Apply filters
      let filteredSchedules = mockSchedules;
      
      if (filters?.customerId) {
        filteredSchedules = filteredSchedules.filter(schedule => 
          schedule.customerId === filters.customerId
        );
      }
      
      if (filters?.equipmentType) {
        filteredSchedules = filteredSchedules.filter(schedule => 
          schedule.equipmentType === filters.equipmentType
        );
      }
      
      if (filters?.status) {
        filteredSchedules = filteredSchedules.filter(schedule => 
          schedule.status === filters.status
        );
      }

      setMaintenanceSchedules(filteredSchedules);

      // Separate overdue and upcoming items
      const now = new Date();
      const overdue = filteredSchedules.filter(schedule => 
        schedule.status === 'SCHEDULED' && new Date(schedule.scheduledDate) < now
      );
      const upcoming = filteredSchedules.filter(schedule => 
        schedule.status === 'SCHEDULED' && 
        new Date(schedule.scheduledDate) >= now &&
        new Date(schedule.scheduledDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      );

      setOverdueItems(overdue);
      setUpcomingItems(upcoming);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load maintenance schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate maintenance plan for customer
  const generateMaintenancePlan = useCallback(async (customerId: string): Promise<MaintenancePlan> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/maintenance/generate-plan/${customerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate maintenance plan');
      }

      const plan: MaintenancePlan = await response.json();
      
      setMaintenancePlans(prev => [...prev, plan]);
      
      return plan;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to generate maintenance plan';
      setError(error);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Schedule preventive maintenance
  const schedulePreventiveMaintenance = useCallback(async (maintenanceData: {
    equipmentId: string;
    maintenanceType: string;
    scheduledDate: Date;
    priority?: string;
    assignedTechnician?: string;
    notes?: string;
  }): Promise<MaintenanceSchedule> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hvac/maintenance/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule maintenance');
      }

      const schedule: MaintenanceSchedule = await response.json();
      
      setMaintenanceSchedules(prev => [...prev, schedule]);
      
      return schedule;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to schedule maintenance';
      setError(error);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete maintenance
  const completeMaintenance = useCallback(async (
    maintenanceId: string,
    checklistData: any,
    photos?: File[]
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('maintenanceId', maintenanceId);
      formData.append('checklistData', JSON.stringify(checklistData));
      
      if (photos) {
        photos.forEach((photo, index) => {
          formData.append(`photo_${index}`, photo);
        });
      }

      const response = await fetch(`/api/hvac/maintenance/complete/${maintenanceId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to complete maintenance');
      }

      // Update local state
      setMaintenanceSchedules(prev => 
        prev.map(maintenance => 
          maintenance.id === maintenanceId 
            ? { ...maintenance, status: 'COMPLETED' }
            : maintenance
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete maintenance');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get maintenance analytics
  const getMaintenanceAnalytics = useCallback(async (
    equipmentId: string
  ): Promise<MaintenanceAnalytics | null> => {
    try {
      const response = await fetch(`/api/hvac/maintenance/analytics/${equipmentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get maintenance analytics');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get maintenance analytics:', err);
      return null;
    }
  }, []);

  // Get maintenance statistics
  const getMaintenanceStats = useCallback(async (): Promise<MaintenanceStats> => {
    try {
      const response = await fetch('/api/hvac/maintenance/stats');
      
      if (!response.ok) {
        throw new Error('Failed to get maintenance stats');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get maintenance stats:', err);
      // Return mock stats
      return {
        totalEquipment: maintenanceSchedules.length,
        scheduledMaintenance: maintenanceSchedules.filter(m => m.status === 'SCHEDULED').length,
        overdueMaintenance: overdueItems.length,
        completedThisMonth: maintenanceSchedules.filter(m => 
          m.status === 'COMPLETED' && 
          new Date(m.scheduledDate).getMonth() === new Date().getMonth()
        ).length,
        complianceRate: 85,
        costSavings: 15000,
        efficiency: 92,
        nextMaintenanceDate: upcomingItems[0]?.scheduledDate || null,
      };
    }
  }, [maintenanceSchedules, overdueItems, upcomingItems]);

  // Get overdue maintenance
  const getOverdueMaintenance = useCallback(async (): Promise<MaintenanceSchedule[]> => {
    try {
      const response = await fetch('/api/hvac/maintenance/overdue');
      
      if (!response.ok) {
        throw new Error('Failed to get overdue maintenance');
      }

      const overdue = await response.json();
      setOverdueItems(overdue);
      return overdue;
    } catch (err) {
      console.error('Failed to get overdue maintenance:', err);
      return overdueItems;
    }
  }, [overdueItems]);

  // Get upcoming maintenance
  const getUpcomingMaintenance = useCallback(async (days: number = 30): Promise<MaintenanceSchedule[]> => {
    try {
      const response = await fetch(`/api/hvac/maintenance/upcoming?days=${days}`);
      
      if (!response.ok) {
        throw new Error('Failed to get upcoming maintenance');
      }

      const upcoming = await response.json();
      setUpcomingItems(upcoming);
      return upcoming;
    } catch (err) {
      console.error('Failed to get upcoming maintenance:', err);
      return upcomingItems;
    }
  }, [upcomingItems]);

  // Reschedule maintenance
  const rescheduleMaintenance = useCallback(async (
    maintenanceId: string,
    newDate: Date,
    reason?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/maintenance/reschedule/${maintenanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newDate, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule maintenance');
      }

      // Update local state
      setMaintenanceSchedules(prev => 
        prev.map(maintenance => 
          maintenance.id === maintenanceId 
            ? { ...maintenance, scheduledDate: newDate }
            : maintenance
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule maintenance');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel maintenance
  const cancelMaintenance = useCallback(async (
    maintenanceId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/maintenance/cancel/${maintenanceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel maintenance');
      }

      // Update local state
      setMaintenanceSchedules(prev => 
        prev.map(maintenance => 
          maintenance.id === maintenanceId 
            ? { ...maintenance, status: 'CANCELLED' }
            : maintenance
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel maintenance');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh maintenance data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadMaintenanceSchedules();
      getOverdueMaintenance();
      getUpcomingMaintenance();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadMaintenanceSchedules, getOverdueMaintenance, getUpcomingMaintenance]);

  // Initial load
  useEffect(() => {
    loadMaintenanceSchedules();
  }, [loadMaintenanceSchedules]);

  return {
    // State
    maintenanceSchedules,
    overdueItems,
    upcomingItems,
    maintenancePlans,
    loading,
    error,
    lastUpdate,

    // Actions
    loadMaintenanceSchedules,
    generateMaintenancePlan,
    schedulePreventiveMaintenance,
    completeMaintenance,
    getMaintenanceAnalytics,
    getMaintenanceStats,
    getOverdueMaintenance,
    getUpcomingMaintenance,
    rescheduleMaintenance,
    cancelMaintenance,

    // Utilities
    refreshMaintenance: loadMaintenanceSchedules,
    clearError: () => setError(null),
  };
};
