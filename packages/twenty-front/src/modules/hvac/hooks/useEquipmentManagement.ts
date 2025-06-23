/**
 * useEquipmentManagement Hook - HVAC Equipment Management
 * "Pasja rodzi profesjonalizm" - Professional equipment management hook
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  equipmentAPIService,
  Equipment,
  EquipmentFilter,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ScheduleMaintenanceRequest,
  MaintenanceRecord,
} from '../services/EquipmentAPIService';
import { trackHVACUserAction } from '../index';

// Hook state interface
interface UseEquipmentManagementState {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  total: number;
  selectedEquipment: Equipment | null;
  maintenanceHistory: MaintenanceRecord[];
  maintenanceLoading: boolean;
}

// Hook options
interface UseEquipmentManagementOptions {
  customerId?: string;
  autoLoad?: boolean;
  onError?: (error: Error) => void;
  onEquipmentUpdated?: (equipment: Equipment) => void;
  onMaintenanceScheduled?: (maintenance: MaintenanceRecord) => void;
}

// Hook return type
interface UseEquipmentManagementReturn {
  // State
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  total: number;
  selectedEquipment: Equipment | null;
  maintenanceHistory: MaintenanceRecord[];
  maintenanceLoading: boolean;

  // Equipment operations
  loadEquipment: (filters?: EquipmentFilter, page?: number, limit?: number) => Promise<void>;
  createEquipment: (equipmentData: CreateEquipmentRequest) => Promise<Equipment>;
  updateEquipment: (equipmentData: UpdateEquipmentRequest) => Promise<Equipment>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  selectEquipment: (equipment: Equipment | null) => void;

  // Maintenance operations
  loadMaintenanceHistory: (equipmentId: string) => Promise<void>;
  scheduleMaintenance: (maintenanceData: ScheduleMaintenanceRequest) => Promise<MaintenanceRecord>;

  // Utility functions
  getEquipmentNeedingService: () => Promise<Equipment[]>;
  getEquipmentWithExpiringWarranties: (days?: number) => Promise<Equipment[]>;
  refreshEquipment: () => Promise<void>;
  clearError: () => void;
}

/**
 * Equipment management hook with comprehensive CRUD operations
 * Implements HVAC CRM performance standards and error handling
 */
export const useEquipmentManagement = (
  options: UseEquipmentManagementOptions = {}
): UseEquipmentManagementReturn => {
  const {
    customerId,
    autoLoad = false,
    onError,
    onEquipmentUpdated,
    onMaintenanceScheduled,
  } = options;

  // State management
  const [state, setState] = useState<UseEquipmentManagementState>({
    equipment: [],
    loading: false,
    error: null,
    total: 0,
    selectedEquipment: null,
    maintenanceHistory: [],
    maintenanceLoading: false,
  });

  const abortControllerRef = useRef<AbortController>();
  const currentFiltersRef = useRef<EquipmentFilter>({});

  // Load equipment with filters and pagination
  const loadEquipment = useCallback(async (
    filters: EquipmentFilter = {},
    page = 1,
    limit = 20
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    currentFiltersRef.current = filters;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Add customerId to filters if provided
      const finalFilters = customerId ? { ...filters, customerId } : filters;

      trackHVACUserAction('equipment_load_started', 'EQUIPMENT_MANAGEMENT', {
        filters: finalFilters,
        page,
        limit,
      });

      const result = await equipmentAPIService.getEquipment(finalFilters, page, limit);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({
        ...prev,
        equipment: result.equipment,
        total: result.total,
        loading: false,
      }));

      trackHVACUserAction('equipment_load_success', 'EQUIPMENT_MANAGEMENT', {
        count: result.equipment.length,
        total: result.total,
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));

      trackHVACUserAction('equipment_load_error', 'EQUIPMENT_MANAGEMENT', {
        error: errorMessage,
      });
    }
  }, [customerId, onError]);

  // Create new equipment
  const createEquipment = useCallback(async (
    equipmentData: CreateEquipmentRequest
  ): Promise<Equipment> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newEquipment = await equipmentAPIService.createEquipment(equipmentData);

      // Refresh equipment list
      await loadEquipment(currentFiltersRef.current);

      onEquipmentUpdated?.(newEquipment);

      return newEquipment;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [loadEquipment, onEquipmentUpdated, onError]);

  // Update equipment
  const updateEquipment = useCallback(async (
    equipmentData: UpdateEquipmentRequest
  ): Promise<Equipment> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const updatedEquipment = await equipmentAPIService.updateEquipment(equipmentData);

      // Update equipment in state
      setState(prev => ({
        ...prev,
        equipment: prev.equipment.map(eq => 
          eq.id === updatedEquipment.id ? updatedEquipment : eq
        ),
        selectedEquipment: prev.selectedEquipment?.id === updatedEquipment.id 
          ? updatedEquipment 
          : prev.selectedEquipment,
        loading: false,
      }));

      onEquipmentUpdated?.(updatedEquipment);

      return updatedEquipment;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [onEquipmentUpdated, onError]);

  // Delete equipment
  const deleteEquipment = useCallback(async (equipmentId: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await equipmentAPIService.deleteEquipment(equipmentId);

      // Remove equipment from state
      setState(prev => ({
        ...prev,
        equipment: prev.equipment.filter(eq => eq.id !== equipmentId),
        selectedEquipment: prev.selectedEquipment?.id === equipmentId 
          ? null 
          : prev.selectedEquipment,
        loading: false,
        total: prev.total - 1,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [onError]);

  // Select equipment
  const selectEquipment = useCallback((equipment: Equipment | null) => {
    setState(prev => ({ ...prev, selectedEquipment: equipment }));
    
    if (equipment) {
      trackHVACUserAction('equipment_selected', 'EQUIPMENT_MANAGEMENT', {
        equipmentId: equipment.id,
        equipmentType: equipment.type,
      });
    }
  }, []);

  // Load maintenance history
  const loadMaintenanceHistory = useCallback(async (equipmentId: string) => {
    setState(prev => ({ ...prev, maintenanceLoading: true, error: null }));

    try {
      const history = await equipmentAPIService.getMaintenanceHistory(equipmentId);

      setState(prev => ({
        ...prev,
        maintenanceHistory: history,
        maintenanceLoading: false,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        maintenanceLoading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [onError]);

  // Schedule maintenance
  const scheduleMaintenance = useCallback(async (
    maintenanceData: ScheduleMaintenanceRequest
  ): Promise<MaintenanceRecord> => {
    setState(prev => ({ ...prev, maintenanceLoading: true, error: null }));

    try {
      const maintenance = await equipmentAPIService.scheduleMaintenance(maintenanceData);

      // Refresh maintenance history
      await loadMaintenanceHistory(maintenanceData.equipmentId);

      onMaintenanceScheduled?.(maintenance);

      return maintenance;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        maintenanceLoading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [loadMaintenanceHistory, onMaintenanceScheduled, onError]);

  // Get equipment needing service
  const getEquipmentNeedingService = useCallback(async (): Promise<Equipment[]> => {
    try {
      return await equipmentAPIService.getEquipmentNeedingService();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to get equipment needing service'));
      return [];
    }
  }, [onError]);

  // Get equipment with expiring warranties
  const getEquipmentWithExpiringWarranties = useCallback(async (days = 30): Promise<Equipment[]> => {
    try {
      return await equipmentAPIService.getEquipmentWithExpiringWarranties(days);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to get equipment with expiring warranties'));
      return [];
    }
  }, [onError]);

  // Refresh equipment
  const refreshEquipment = useCallback(async () => {
    await loadEquipment(currentFiltersRef.current);
  }, [loadEquipment]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-load equipment on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadEquipment();
    }
  }, [autoLoad, loadEquipment]);

  return {
    // State
    equipment: state.equipment,
    loading: state.loading,
    error: state.error,
    total: state.total,
    selectedEquipment: state.selectedEquipment,
    maintenanceHistory: state.maintenanceHistory,
    maintenanceLoading: state.maintenanceLoading,

    // Equipment operations
    loadEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    selectEquipment,

    // Maintenance operations
    loadMaintenanceHistory,
    scheduleMaintenance,

    // Utility functions
    getEquipmentNeedingService,
    getEquipmentWithExpiringWarranties,
    refreshEquipment,
    clearError,
  };
};
