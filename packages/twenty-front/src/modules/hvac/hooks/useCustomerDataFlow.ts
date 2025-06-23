/**
 * useCustomerDataFlow Hook - Zarządzanie przepływem danych klientów HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalny hook do customer flow management
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  customerDataFlowService,
  CustomerDataFlow,
  CustomerStage,
  FlowStatus,
  Priority,
  CustomerSource,
  FlowAnalytics,
  CustomerFlowMetadata,
} from '../services/CustomerDataFlowService';
import { trackHVACUserAction } from '../index';

// Hook state interface
interface UseCustomerDataFlowState {
  flows: CustomerDataFlow[];
  selectedFlow: CustomerDataFlow | null;
  analytics: FlowAnalytics | null;
  loading: boolean;
  error: string | null;
  total: number;
  filters: FlowFilters;
}

// Filter interface
interface FlowFilters {
  stage?: CustomerStage;
  status?: FlowStatus;
  assignedTo?: string;
  priority?: Priority;
  source?: CustomerSource;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Hook options
interface UseCustomerDataFlowOptions {
  autoLoad?: boolean;
  enableRealTimeUpdates?: boolean;
  refreshInterval?: number; // in milliseconds
  onFlowUpdated?: (flow: CustomerDataFlow) => void;
  onStageChanged?: (customerId: string, oldStage: CustomerStage, newStage: CustomerStage) => void;
  onError?: (error: Error) => void;
}

// Hook return type
interface UseCustomerDataFlowReturn {
  // State
  flows: CustomerDataFlow[];
  selectedFlow: CustomerDataFlow | null;
  analytics: FlowAnalytics | null;
  loading: boolean;
  error: string | null;
  total: number;
  filters: FlowFilters;

  // Flow operations
  loadFlows: (filters?: FlowFilters) => Promise<void>;
  createFlow: (flowData: Omit<CustomerDataFlow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomerDataFlow>;
  updateStage: (customerId: string, stage: CustomerStage, metadata?: Partial<CustomerFlowMetadata>) => Promise<void>;
  selectFlow: (flow: CustomerDataFlow | null) => void;

  // Filter operations
  setFilters: (filters: Partial<FlowFilters>) => void;
  clearFilters: () => void;
  applyQuickFilter: (type: 'hot_leads' | 'proposals' | 'won_this_month' | 'needs_follow_up') => void;

  // Analytics operations
  loadAnalytics: () => Promise<void>;
  getStageMetrics: (stage: CustomerStage) => StageMetrics;
  getConversionRate: (fromStage: CustomerStage, toStage: CustomerStage) => number;

  // Utility functions
  moveToNextStage: (customerId: string) => Promise<void>;
  moveToPreviousStage: (customerId: string) => Promise<void>;
  refreshFlows: () => Promise<void>;
  clearError: () => void;
}

// Stage metrics interface
interface StageMetrics {
  count: number;
  totalValue: number;
  averageValue: number;
  averageTimeInStage: number; // in days
  conversionRate: number;
}

/**
 * Customer data flow hook with comprehensive flow management
 * Implements HVAC CRM customer journey tracking
 */
export const useCustomerDataFlow = (
  options: UseCustomerDataFlowOptions = {}
): UseCustomerDataFlowReturn => {
  const {
    autoLoad = true,
    enableRealTimeUpdates = false,
    refreshInterval = 30000, // 30 seconds
    onFlowUpdated,
    onStageChanged,
    onError,
  } = options;

  // State management
  const [state, setState] = useState<UseCustomerDataFlowState>({
    flows: [],
    selectedFlow: null,
    analytics: null,
    loading: false,
    error: null,
    total: 0,
    filters: {},
  });

  const abortControllerRef = useRef<AbortController>();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Load flows with filters
  const loadFlows = useCallback(async (filters: FlowFilters = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, filters }));

    try {
      trackHVACUserAction('customer_flow_load_started', 'CUSTOMER_FLOW', {
        filters,
      });

      const result = await customerDataFlowService.getFlowPipeline(filters);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({
        ...prev,
        flows: result.flows,
        total: result.total,
        analytics: result.analytics,
        loading: false,
      }));

      trackHVACUserAction('customer_flow_load_success', 'CUSTOMER_FLOW', {
        count: result.flows.length,
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

      trackHVACUserAction('customer_flow_load_error', 'CUSTOMER_FLOW', {
        error: errorMessage,
      });
    }
  }, [onError]);

  // Create new flow
  const createFlow = useCallback(async (
    flowData: Omit<CustomerDataFlow, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomerDataFlow> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newFlow = await customerDataFlowService.createCustomerFlow(flowData);

      // Refresh flows
      await loadFlows(state.filters);

      onFlowUpdated?.(newFlow);

      return newFlow;

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
  }, [loadFlows, state.filters, onFlowUpdated, onError]);

  // Update customer stage
  const updateStage = useCallback(async (
    customerId: string,
    stage: CustomerStage,
    metadata?: Partial<CustomerFlowMetadata>
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const oldFlow = state.flows.find(f => f.customerId === customerId);
      const oldStage = oldFlow?.stage;

      const updatedFlow = await customerDataFlowService.updateCustomerStage(
        customerId,
        stage,
        metadata
      );

      // Update flow in state
      setState(prev => ({
        ...prev,
        flows: prev.flows.map(flow => 
          flow.customerId === customerId ? updatedFlow : flow
        ),
        selectedFlow: prev.selectedFlow?.customerId === customerId 
          ? updatedFlow 
          : prev.selectedFlow,
        loading: false,
      }));

      onFlowUpdated?.(updatedFlow);
      
      if (oldStage && oldStage !== stage) {
        onStageChanged?.(customerId, oldStage, stage);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.flows, onFlowUpdated, onStageChanged, onError]);

  // Select flow
  const selectFlow = useCallback((flow: CustomerDataFlow | null) => {
    setState(prev => ({ ...prev, selectedFlow: flow }));
    
    if (flow) {
      trackHVACUserAction('customer_flow_selected', 'CUSTOMER_FLOW', {
        customerId: flow.customerId,
        stage: flow.stage,
        status: flow.status,
      });
    }
  }, []);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<FlowFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    loadFlows(updatedFilters);
  }, [state.filters, loadFlows]);

  // Clear filters
  const clearFilters = useCallback(() => {
    loadFlows({});
  }, [loadFlows]);

  // Apply quick filters
  const applyQuickFilter = useCallback((type: 'hot_leads' | 'proposals' | 'won_this_month' | 'needs_follow_up') => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (type) {
      case 'hot_leads':
        setFilters({
          stage: 'qualified_lead',
          priority: 'high',
        });
        break;
      
      case 'proposals':
        setFilters({
          status: 'proposal_sent',
        });
        break;
      
      case 'won_this_month':
        setFilters({
          status: 'closed_won',
          dateFrom: startOfMonth,
          dateTo: now,
        });
        break;
      
      case 'needs_follow_up':
        setFilters({
          status: 'follow_up_needed',
        });
        break;
    }

    trackHVACUserAction('quick_filter_applied', 'CUSTOMER_FLOW', { type });
  }, [setFilters]);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const result = await customerDataFlowService.getFlowPipeline(state.filters);
      setState(prev => ({ ...prev, analytics: result.analytics }));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load analytics'));
    }
  }, [state.filters, onError]);

  // Get stage metrics
  const getStageMetrics = useCallback((stage: CustomerStage): StageMetrics => {
    if (!state.analytics) {
      return {
        count: 0,
        totalValue: 0,
        averageValue: 0,
        averageTimeInStage: 0,
        conversionRate: 0,
      };
    }

    const count = state.analytics.stageDistribution[stage] || 0;
    const totalValue = state.flows
      .filter(f => f.stage === stage)
      .reduce((sum, f) => sum + f.estimatedValue, 0);

    return {
      count,
      totalValue,
      averageValue: count > 0 ? totalValue / count : 0,
      averageTimeInStage: state.analytics.averageTimeInStage[stage] || 0,
      conversionRate: state.analytics.conversionRates[stage] || 0,
    };
  }, [state.analytics, state.flows]);

  // Get conversion rate between stages
  const getConversionRate = useCallback((fromStage: CustomerStage, toStage: CustomerStage): number => {
    if (!state.analytics) return 0;
    
    const key = `${fromStage}_to_${toStage}`;
    return state.analytics.conversionRates[key] || 0;
  }, [state.analytics]);

  // Move to next stage
  const moveToNextStage = useCallback(async (customerId: string) => {
    const flow = state.flows.find(f => f.customerId === customerId);
    if (!flow) return;

    const stageOrder: CustomerStage[] = [
      'lead', 'qualified_lead', 'opportunity', 'proposal_sent', 'negotiation', 'won', 'customer'
    ];

    const currentIndex = stageOrder.indexOf(flow.stage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      await updateStage(customerId, nextStage);
    }
  }, [state.flows, updateStage]);

  // Move to previous stage
  const moveToPreviousStage = useCallback(async (customerId: string) => {
    const flow = state.flows.find(f => f.customerId === customerId);
    if (!flow) return;

    const stageOrder: CustomerStage[] = [
      'lead', 'qualified_lead', 'opportunity', 'proposal_sent', 'negotiation', 'won', 'customer'
    ];

    const currentIndex = stageOrder.indexOf(flow.stage);
    if (currentIndex > 0) {
      const previousStage = stageOrder[currentIndex - 1];
      await updateStage(customerId, previousStage);
    }
  }, [state.flows, updateStage]);

  // Refresh flows
  const refreshFlows = useCallback(async () => {
    await loadFlows(state.filters);
  }, [loadFlows, state.filters]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-load flows on mount
  useEffect(() => {
    if (autoLoad) {
      loadFlows();
    }
  }, [autoLoad, loadFlows]);

  // Real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates) {
      refreshIntervalRef.current = setInterval(() => {
        refreshFlows();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableRealTimeUpdates, refreshInterval, refreshFlows]);

  return {
    // State
    flows: state.flows,
    selectedFlow: state.selectedFlow,
    analytics: state.analytics,
    loading: state.loading,
    error: state.error,
    total: state.total,
    filters: state.filters,

    // Flow operations
    loadFlows,
    createFlow,
    updateStage,
    selectFlow,

    // Filter operations
    setFilters,
    clearFilters,
    applyQuickFilter,

    // Analytics operations
    loadAnalytics,
    getStageMetrics,
    getConversionRate,

    // Utility functions
    moveToNextStage,
    moveToPreviousStage,
    refreshFlows,
    clearError,
  };
};
